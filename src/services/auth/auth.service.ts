import crypto from "node:crypto";
import type { UserType } from "@prisma/client";
import { AppError } from "@/lib/errors/app-error";
import { hashPassword, hashToken, verifyPassword, verifyToken } from "@/lib/security/password";
import {
  authRepository,
  type AuthRepository
} from "@/repositories/auth.repository";
import {
  authCredentialRepository,
  type AuthCredentialRepository
} from "@/repositories/auth-credential.repository";
import {
  passwordResetTokenRepository,
  type PasswordResetTokenRepository
} from "@/repositories/password-reset-token.repository";
import { userRepository, type UserRepository } from "@/repositories/user.repository";
import {
  passwordResetNotificationService,
  type PasswordResetNotificationService
} from "@/services/auth/password-reset-notification.service";
import type {
  AuthUser,
  GoogleProfileInput,
  LoginInput,
  PasswordResetInput,
  PasswordResetRequestInput,
  SignupInput
} from "@/types/auth.types";

const DEFAULT_ROLE: UserType = "STARTUP_TALENT";
const PASSWORD_RESET_TTL_MINUTES = 30;

type AuthServiceDeps = {
  auth?: AuthRepository;
  users?: UserRepository;
  credentials?: AuthCredentialRepository;
  passwordResetTokens?: PasswordResetTokenRepository;
  passwordResetNotifications?: PasswordResetNotificationService;
};

function toSessionUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    image: user.profilePhotoUrl,
    roles: user.roles
  };
}

function toAuthUserFromCredential(result: Awaited<ReturnType<AuthCredentialRepository["findByEmail"]>>): AuthUser | null {
  if (!result) return null;

  return {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    username: result.user.username,
    profilePhotoUrl: result.user.profilePhotoUrl,
    roles: result.user.roles.map((role) => role.type)
  };
}

function usernameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${localPart || "user"}_${suffix}`.toLowerCase();
}

export class AuthService {
  private readonly auth: AuthRepository;
  private readonly users: UserRepository;
  private readonly credentials: AuthCredentialRepository;
  private readonly passwordResetTokens: PasswordResetTokenRepository;
  private readonly passwordResetNotifications: PasswordResetNotificationService;

  constructor(deps: AuthServiceDeps = {}) {
    this.auth = deps.auth ?? authRepository;
    this.users = deps.users ?? userRepository;
    this.credentials = deps.credentials ?? authCredentialRepository;
    this.passwordResetTokens = deps.passwordResetTokens ?? passwordResetTokenRepository;
    this.passwordResetNotifications =
      deps.passwordResetNotifications ?? passwordResetNotificationService;
  }

  async signup(input: SignupInput) {
    const [emailExists, usernameExists] = await Promise.all([
      this.users.emailExists(input.email),
      this.users.usernameExists(input.username)
    ]);

    if (emailExists) {
      throw new AppError("CONFLICT", "Email is already registered.", 409);
    }

    if (usernameExists) {
      throw new AppError("CONFLICT", "Username is already taken.", 409);
    }

    const roles = input.roles?.length ? input.roles : [DEFAULT_ROLE];
    const passwordHash = await hashPassword(input.password);
    const user = await this.auth.createEmailUserWithCredential({
      email: input.email,
      username: input.username,
      name: input.name,
      roles,
      passwordHash
    });

    return toSessionUser(user);
  }

  async authorizeCredentials(input: LoginInput) {
    const credential = await this.credentials.findByEmail(input.email);

    if (!credential) {
      return null;
    }

    const isValidPassword = await verifyPassword(input.password, credential.passwordHash);

    if (!isValidPassword) {
      return null;
    }

    const user = toAuthUserFromCredential(credential);
    return user ? toSessionUser(user) : null;
  }

  async getSessionUserByEmail(email: string) {
    const user = await this.users.findAuthUserByEmail(email);
    return user ? toSessionUser(user) : null;
  }

  async handleGoogleSignIn(profile: GoogleProfileInput) {
    if (!profile.emailVerified) {
      throw new AppError("FORBIDDEN", "Google account email must be verified.", 403);
    }

    const username = usernameFromEmail(profile.email);
    const user = await this.auth.upsertOAuthUserWithAccount({
      email: profile.email,
      name: profile.name || profile.email.split("@")[0] || "CoFoundr User",
      username,
      profilePhotoUrl: profile.image,
      defaultRole: DEFAULT_ROLE,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId
    });

    return toSessionUser(user);
  }

  async requestPasswordReset(input: PasswordResetRequestInput) {
    const user = await this.users.findAuthUserByEmail(input.email);

    if (!user) {
      return { accepted: true as const };
    }

    const selector = crypto.randomBytes(12).toString("base64url");
    const secret = crypto.randomBytes(48).toString("base64url");
    const token = `${selector}.${secret}`;
    const tokenHash = await hashToken(secret);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

    await this.passwordResetTokens.create({
      userId: user.id,
      selector,
      tokenHash,
      expiresAt
    });

    await this.passwordResetNotifications.sendPasswordReset({
      email: user.email,
      resetToken: token,
      expiresAt
    });

    return {
      accepted: true as const,
      expiresAt
    };
  }

  async resetPassword(input: PasswordResetInput) {
    const usersByToken = await this.findUserForResetToken(input.token);

    if (!usersByToken) {
      throw new AppError("UNAUTHORIZED", "Password reset token is invalid or expired.", 401);
    }

    const passwordHash = await hashPassword(input.password);

    await this.auth.resetPasswordAndMarkTokenUsed({
      userId: usersByToken.userId,
      tokenId: usersByToken.tokenId,
      passwordHash
    });

    return { reset: true as const };
  }

  private async findUserForResetToken(token: string) {
    const [selector, secret] = token.split(".");

    if (!selector || !secret) {
      return null;
    }

    const resetToken = await this.passwordResetTokens.findActiveBySelector(selector);

    if (!resetToken) {
      return null;
    }

    const isValid = await verifyToken(secret, resetToken.tokenHash);

    if (!isValid) {
      return null;
    }

    return {
      tokenId: resetToken.id,
      userId: resetToken.userId
    };
  }

  hasAnyRole(userRoles: UserType[], allowedRoles: UserType[]) {
    return userRoles.some((role) => allowedRoles.includes(role));
  }
}

export const authService = new AuthService();
