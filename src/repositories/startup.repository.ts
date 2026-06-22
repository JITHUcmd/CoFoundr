import { prisma } from "@/lib/db/prisma";
import type {
  CreateStartupInput,
  StartupInput,
  StartupMemberInput,
  StartupVerificationRequestInput
} from "@/types/startup.types";

const industryPublicSelect = {
  name: true,
  slug: true
};

const memberPublicSelect = {
  role: true,
  isFounder: true,
  user: {
    select: {
      username: true,
      name: true,
      profilePhotoUrl: true
    }
  }
};

const startupPrivateSelect = {
  id: true,
  ownerId: true,
  industryId: true,
  name: true,
  slug: true,
  logoUrl: true,
  coverImageUrl: true,
  tagline: true,
  description: true,
  website: true,
  foundedDate: true,
  teamSize: true,
  country: true,
  state: true,
  city: true,
  remoteAllowed: true,
  workStyle: true,
  startupStage: true,
  fundingStage: true,
  fundingTargetAmount: true,
  hiringStatus: true,
  openRolesCount: true,
  equityAvailable: true,
  salaryAvailable: true,
  verificationStatus: true,
  verificationNotes: true,
  profileViewsCount: true,
  followersCount: true,
  savesCount: true,
  applicationsCount: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  industry: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  members: {
    where: {
      leftAt: null
    },
    select: {
      id: true,
      userId: true,
      role: true,
      isFounder: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          profilePhotoUrl: true
        }
      }
    }
  }
};

const startupPublicSelect = {
  name: true,
  slug: true,
  logoUrl: true,
  coverImageUrl: true,
  tagline: true,
  description: true,
  website: true,
  foundedDate: true,
  teamSize: true,
  country: true,
  state: true,
  city: true,
  remoteAllowed: true,
  workStyle: true,
  startupStage: true,
  fundingStage: true,
  fundingTargetAmount: true,
  hiringStatus: true,
  openRolesCount: true,
  equityAvailable: true,
  salaryAvailable: true,
  verificationStatus: true,
  profileViewsCount: true,
  followersCount: true,
  savesCount: true,
  applicationsCount: true,
  industry: {
    select: industryPublicSelect
  },
  members: {
    where: {
      leftAt: null
    },
    select: memberPublicSelect
  }
};

export class StartupRepository {
  async findActiveUserById(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true }
    });
  }

  async findPrivateById(startupId: string) {
    return prisma.startup.findFirst({
      where: { id: startupId, archivedAt: null },
      select: startupPrivateSelect
    });
  }

  async findPublicBySlug(slug: string) {
    return prisma.startup.findFirst({
      where: { slug, archivedAt: null },
      select: startupPublicSelect
    });
  }

  async slugExists(slug: string, excludeStartupId?: string) {
    const startup = await prisma.startup.findFirst({
      where: {
        slug,
        id: excludeStartupId ? { not: excludeStartupId } : undefined
      },
      select: { id: true }
    });

    return Boolean(startup);
  }

  async isOwner(startupId: string, userId: string) {
    const startup = await prisma.startup.findFirst({
      where: { id: startupId, ownerId: userId, archivedAt: null },
      select: { id: true }
    });

    return Boolean(startup);
  }

  async create(ownerId: string, input: CreateStartupInput) {
    const startup = await prisma.$transaction(async (tx) => {
      const createdStartup = await tx.startup.create({
        data: {
          ownerId,
          ...input,
          members: {
            create: {
              userId: ownerId,
              role: "CEO",
              isFounder: true
            }
          }
        },
        select: startupPrivateSelect
      });

      return createdStartup;
    });

    return startup;
  }

  async update(startupId: string, input: StartupInput) {
    const result = await prisma.startup.updateMany({
      where: { id: startupId, archivedAt: null },
      data: input
    });

    if (result.count !== 1) return null;
    return this.findPrivateById(startupId);
  }

  async softDelete(startupId: string) {
    const result = await prisma.startup.updateMany({
      where: { id: startupId, archivedAt: null },
      data: { archivedAt: new Date() }
    });

    return result.count === 1;
  }

  async addMember(startupId: string, input: StartupMemberInput) {
    return prisma.startupMember.create({
      data: {
        startupId,
        userId: input.userId,
        role: input.role,
        isFounder: input.isFounder ?? false
      }
    });
  }

  async updateMember(startupId: string, memberId: string, input: Omit<StartupMemberInput, "userId">) {
    const result = await prisma.startupMember.updateMany({
      where: { id: memberId, startupId, leftAt: null },
      data: input
    });

    if (result.count !== 1) return null;
    return prisma.startupMember.findUnique({ where: { id: memberId } });
  }

  async removeMember(startupId: string, memberId: string) {
    const result = await prisma.startupMember.updateMany({
      where: { id: memberId, startupId, leftAt: null },
      data: { leftAt: new Date() }
    });

    return result.count === 1;
  }

  async findMemberById(startupId: string, memberId: string) {
    return prisma.startupMember.findFirst({
      where: { id: memberId, startupId, leftAt: null },
      select: { id: true, userId: true, role: true, isFounder: true }
    });
  }

  async transferOwnership(startupId: string, newOwnerId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.startup.update({
        where: { id: startupId },
        data: { ownerId: newOwnerId }
      });

      await tx.startupMember.upsert({
        where: {
          startupId_userId: {
            startupId,
            userId: newOwnerId
          }
        },
        create: {
          startupId,
          userId: newOwnerId,
          role: "CEO",
          isFounder: true
        },
        update: {
          leftAt: null,
          role: "CEO",
          isFounder: true
        }
      });
    });

    return this.findPrivateById(startupId);
  }

  async incrementView(startupId: string, actorUserId?: string | null) {
    await prisma.$transaction(async (tx) => {
      await tx.startup.updateMany({
        where: { id: startupId, archivedAt: null },
        data: {
          profileViewsCount: {
            increment: 1
          }
        }
      });

      await tx.analyticsEvent.create({
        data: {
          eventType: "STARTUP_VIEW",
          entityType: "STARTUP",
          actorUserId: actorUserId ?? null,
          startupId
        }
      });
    });
  }

  async incrementViewBySlug(slug: string, actorUserId?: string | null) {
    return prisma.$transaction(async (tx) => {
      const startup = await tx.startup.findFirst({
        where: { slug, archivedAt: null },
        select: { id: true }
      });

      if (!startup) return false;

      await tx.startup.update({
        where: { id: startup.id },
        data: {
          profileViewsCount: {
            increment: 1
          }
        }
      });

      await tx.analyticsEvent.create({
        data: {
          eventType: "STARTUP_VIEW",
          entityType: "STARTUP",
          actorUserId: actorUserId ?? null,
          startupId: startup.id
        }
      });

      return true;
    });
  }

  async getAnalytics(startupId: string) {
    const startup = await prisma.startup.findFirst({
      where: { id: startupId, archivedAt: null },
      select: {
        profileViewsCount: true,
        followersCount: true,
        savesCount: true,
        applicationsCount: true
      }
    });

    if (!startup) return null;

    return {
      profileViews: startup.profileViewsCount,
      follows: startup.followersCount,
      saves: startup.savesCount,
      applications: startup.applicationsCount
    };
  }

  async requestVerification(
    startupId: string,
    submittedByUserId: string,
    input: StartupVerificationRequestInput
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.startup.update({
        where: { id: startupId },
        data: { verificationStatus: "PENDING" }
      });

      await tx.startupVerification.create({
        data: {
          startupId,
          submittedByUserId,
          evidenceUrl: input.evidenceUrl ?? null,
          status: "PENDING"
        }
      });
    });

    return this.getVerificationStatus(startupId);
  }

  async getVerificationStatus(startupId: string) {
    return prisma.startup.findFirst({
      where: { id: startupId, archivedAt: null },
      select: {
        verificationStatus: true,
        verificationNotes: true
      }
    });
  }
}

export const startupRepository = new StartupRepository();
