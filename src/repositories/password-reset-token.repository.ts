import { prisma } from "@/lib/db/prisma";

export class PasswordResetTokenRepository {
  async create(input: { userId: string; selector: string; tokenHash: string; expiresAt: Date }) {
    return prisma.passwordResetToken.create({
      data: input,
      select: {
        id: true,
        expiresAt: true
      }
    });
  }

  async findActiveBySelector(selector: string) {
    return prisma.passwordResetToken.findFirst({
      where: {
        selector,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        userId: true,
        tokenHash: true
      }
    });
  }

  async markUsed(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: {
        usedAt: new Date()
      }
    });
  }
}

export const passwordResetTokenRepository = new PasswordResetTokenRepository();
