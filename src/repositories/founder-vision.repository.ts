import { prisma } from "@/lib/db/prisma";
import type { FounderVisionInput } from "@/types/founder-vision.types";

const founderVisionSelect = {
  id: true,
  userId: true,
  startupGoal: true,
  fundingPreference: true,
  riskAppetite: true,
  commitmentLevel: true,
  workStyle: true,
  preferredTeamSize: true,
  preferredCoFounderType: true,
  remotePreference: true,
  createdAt: true,
  updatedAt: true
};

export class FounderVisionRepository {
  async findActiveUserById(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true }
    });
  }

  async findByUserId(userId: string) {
    return prisma.founderVision.findFirst({
      where: {
        userId,
        user: {
          deletedAt: null
        }
      },
      select: founderVisionSelect
    });
  }

  async existsByUserId(userId: string) {
    const vision = await prisma.founderVision.findUnique({
      where: { userId },
      select: { id: true }
    });

    return Boolean(vision);
  }

  async create(userId: string, input: FounderVisionInput) {
    return prisma.founderVision.create({
      data: {
        userId,
        ...input
      },
      select: founderVisionSelect
    });
  }

  async update(userId: string, input: FounderVisionInput) {
    const result = await prisma.founderVision.updateMany({
      where: { userId },
      data: input
    });

    if (result.count !== 1) return null;
    return this.findByUserId(userId);
  }

  async delete(userId: string) {
    const result = await prisma.founderVision.deleteMany({
      where: { userId }
    });

    return result.count === 1;
  }
}

export const founderVisionRepository = new FounderVisionRepository();
