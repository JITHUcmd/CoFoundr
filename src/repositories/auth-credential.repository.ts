import { prisma } from "@/lib/db/prisma";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export class AuthCredentialRepository {
  async findByEmail(email: string) {
    return prisma.authCredential.findFirst({
      where: {
        user: {
          email: normalizeEmail(email)
        }
      },
      select: {
        id: true,
        userId: true,
        passwordHash: true,
        user: {
          select: {
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
          }
        }
      }
    });
  }

  async createForUser(input: { userId: string; passwordHash: string }) {
    return prisma.authCredential.create({
      data: {
        userId: input.userId,
        passwordHash: input.passwordHash
      }
    });
  }

  async updatePassword(input: { userId: string; passwordHash: string }) {
    return prisma.authCredential.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        passwordHash: input.passwordHash
      },
      update: {
        passwordHash: input.passwordHash,
        passwordChangedAt: new Date()
      }
    });
  }
}

export const authCredentialRepository = new AuthCredentialRepository();
