import type { UserType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import type { AuthUser } from "@/types/auth.types";

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  username: true,
  profilePhotoUrl: true,
  roles: {
    select: {
      type: true
    }
  }
} as const;

type SelectedAuthUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  profilePhotoUrl: string | null;
  roles: Array<{ type: UserType }>;
};

function toAuthUser(user: SelectedAuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    profilePhotoUrl: user.profilePhotoUrl,
    roles: user.roles.map((role) => role.type)
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export class AuthRepository {
  async createEmailUserWithCredential(input: {
    email: string;
    username: string;
    name: string;
    roles: UserType[];
    passwordHash: string;
  }) {
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizeEmail(input.email),
          username: normalizeUsername(input.username),
          name: input.name,
          roles: {
            create: input.roles.map((type) => ({ type }))
          }
        },
        select: authUserSelect
      });

      await tx.authCredential.create({
        data: {
          userId: createdUser.id,
          passwordHash: input.passwordHash
        }
      });

      return createdUser;
    });

    return toAuthUser(user);
  }

  async resetPasswordAndMarkTokenUsed(input: {
    userId: string;
    tokenId: string;
    passwordHash: string;
  }) {
    await prisma.$transaction(async (tx) => {
      await tx.authCredential.upsert({
        where: {
          userId: input.userId
        },
        create: {
          userId: input.userId,
          passwordHash: input.passwordHash
        },
        update: {
          passwordHash: input.passwordHash,
          passwordChangedAt: new Date()
        }
      });

      const tokenUpdate = await tx.passwordResetToken.updateMany({
        where: {
          id: input.tokenId,
          usedAt: null
        },
        data: {
          usedAt: new Date()
        }
      });

      if (tokenUpdate.count !== 1) {
        throw new AppError("UNAUTHORIZED", "Password reset token is invalid or expired.", 401);
      }
    });
  }

  async upsertOAuthUserWithAccount(input: {
    email: string;
    name: string;
    username: string;
    profilePhotoUrl?: string | null;
    defaultRole: UserType;
    provider: string;
    providerAccountId: string;
  }) {
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: input.provider,
          providerAccountId: input.providerAccountId
        }
      },
      select: {
        user: {
          select: authUserSelect
        }
      }
    });

    if (existingAccount) {
      return toAuthUser(existingAccount.user);
    }

    const email = normalizeEmail(input.email);
    const username = normalizeUsername(input.username);

    const user = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email },
        select: authUserSelect
      });

      if (existingUser) {
        await tx.account.create({
          data: {
            userId: existingUser.id,
            provider: input.provider,
            providerAccountId: input.providerAccountId
          }
        });

        return existingUser;
      }

      const createdUser = await tx.user.create({
        data: {
          email,
          username,
          name: input.name,
          profilePhotoUrl: input.profilePhotoUrl,
          roles: {
            create: [{ type: input.defaultRole }]
          },
          accounts: {
            create: {
              provider: input.provider,
              providerAccountId: input.providerAccountId
            }
          }
        },
        select: authUserSelect
      });

      return createdUser;
    });

    return toAuthUser(user);
  }
}

export const authRepository = new AuthRepository();
