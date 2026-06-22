import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { AuthService } from "@/services/auth/auth.service";

function createService(overrides: {
  emailExists?: boolean;
  usernameExists?: boolean;
  passwordHash?: string;
} = {}) {
  const users = {
    emailExists: vi.fn().mockResolvedValue(Boolean(overrides.emailExists)),
    usernameExists: vi.fn().mockResolvedValue(Boolean(overrides.usernameExists)),
    findAuthUserByEmail: vi.fn().mockResolvedValue({
      id: "user-1",
      email: "founder@example.com",
      name: "Founder One",
      username: "founder",
      profilePhotoUrl: null,
      roles: ["FOUNDER"]
    }),
  };

  const auth = {
    createEmailUserWithCredential: vi.fn().mockResolvedValue({
      id: "user-1",
      email: "founder@example.com",
      name: "Founder One",
      username: "founder",
      profilePhotoUrl: null,
      roles: ["FOUNDER"]
    }),
    upsertOAuthUserWithAccount: vi.fn().mockResolvedValue({
      id: "user-1",
      email: "founder@example.com",
      name: "Founder One",
      username: "founder",
      profilePhotoUrl: null,
      roles: ["FOUNDER"]
    }),
    resetPasswordAndMarkTokenUsed: vi.fn().mockResolvedValue(undefined)
  };

  const credentials = {
    findByEmail: vi.fn().mockResolvedValue(null),
    createForUser: vi.fn().mockResolvedValue({ id: "credential-1" }),
    updatePassword: vi.fn().mockResolvedValue({ id: "credential-1" })
  };

  const passwordResetTokens = {
    create: vi.fn().mockResolvedValue({ id: "reset-1", expiresAt: new Date() }),
    findActiveBySelector: vi.fn().mockResolvedValue(null),
    markUsed: vi.fn().mockResolvedValue({ id: "reset-1" })
  };

  const passwordResetNotifications = {
    sendPasswordReset: vi.fn().mockResolvedValue(undefined)
  };

  const service = new AuthService({
    auth: auth as never,
    users: users as never,
    credentials: credentials as never,
    passwordResetTokens: passwordResetTokens as never,
    passwordResetNotifications: passwordResetNotifications as never
  });

  return { service, auth, users, credentials, passwordResetTokens, passwordResetNotifications };
}

describe("AuthService", () => {
  it("creates a user and password credential on signup", async () => {
    const { service, auth } = createService();

    const user = await service.signup({
      email: "founder@example.com",
      password: "Password123",
      username: "founder",
      name: "Founder One",
      roles: ["FOUNDER"]
    });

    expect(user.email).toBe("founder@example.com");
    expect(auth.createEmailUserWithCredential).toHaveBeenCalledOnce();
  });

  it("rejects duplicate signup email", async () => {
    const { service } = createService({ emailExists: true });

    await expect(
      service.signup({
        email: "founder@example.com",
        password: "Password123",
        username: "founder",
        name: "Founder One"
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects unverified Google email", async () => {
    const { service } = createService();

    await expect(
      service.handleGoogleSignIn({
        provider: "google",
        providerAccountId: "google-user-1",
        email: "founder@example.com",
        emailVerified: false
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
