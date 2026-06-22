import { prisma } from "@/lib/db/prisma";
import type {
  CreateOpportunityInput,
  OpportunityApplicationInput,
  OpportunityInput,
  OpportunityReviewInput
} from "@/types/opportunity.types";

const skillSelect = {
  skillId: true,
  skill: {
    select: {
      name: true,
      slug: true
    }
  }
};

const opportunityPrivateSelect = {
  id: true,
  startupId: true,
  roleName: true,
  opportunityType: true,
  description: true,
  openings: true,
  experienceLevel: true,
  compensationType: true,
  equityMinPercent: true,
  equityMaxPercent: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  commitment: true,
  remoteAllowed: true,
  workStyle: true,
  country: true,
  state: true,
  city: true,
  status: true,
  viewsCount: true,
  savesCount: true,
  applicationsCount: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
  startup: {
    select: {
      id: true,
      ownerId: true,
      name: true,
      slug: true,
      logoUrl: true
    }
  },
  skills: {
    select: skillSelect
  }
};

const opportunityPublicSelect = {
  id: true,
  roleName: true,
  opportunityType: true,
  description: true,
  openings: true,
  experienceLevel: true,
  compensationType: true,
  equityMinPercent: true,
  equityMaxPercent: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  commitment: true,
  remoteAllowed: true,
  workStyle: true,
  country: true,
  state: true,
  city: true,
  status: true,
  viewsCount: true,
  savesCount: true,
  applicationsCount: true,
  startup: {
    select: {
      name: true,
      slug: true,
      logoUrl: true
    }
  },
  skills: {
    select: skillSelect
  }
};

const applicationSelect = {
  id: true,
  opportunityId: true,
  applicantId: true,
  reviewedById: true,
  status: true,
  note: true,
  reviewNote: true,
  reviewedAt: true,
  withdrawnAt: true,
  decidedAt: true,
  createdAt: true,
  updatedAt: true
};

function splitSkills<T extends OpportunityInput>(input: T) {
  const { skillIds, ...data } = input;
  return { data, skillIds };
}

export class OpportunityRepository {
  async findActiveUserById(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true }
    });
  }

  async isStartupOwner(startupId: string, userId: string) {
    const startup = await prisma.startup.findFirst({
      where: { id: startupId, ownerId: userId, archivedAt: null },
      select: { id: true }
    });

    return Boolean(startup);
  }

  async isOpportunityOwner(opportunityId: string, userId: string) {
    const opportunity = await prisma.startupOpportunity.findFirst({
      where: {
        id: opportunityId,
        closedAt: null,
        startup: {
          ownerId: userId,
          archivedAt: null
        }
      },
      select: { id: true }
    });

    return Boolean(opportunity);
  }

  async findPrivateById(opportunityId: string) {
    return prisma.startupOpportunity.findFirst({
      where: { id: opportunityId, closedAt: null },
      select: opportunityPrivateSelect
    });
  }

  async findPublicById(opportunityId: string) {
    return prisma.startupOpportunity.findFirst({
      where: {
        id: opportunityId,
        closedAt: null,
        startup: {
          archivedAt: null
        }
      },
      select: opportunityPublicSelect
    });
  }

  async listByStartupId(startupId: string) {
    return prisma.startupOpportunity.findMany({
      where: {
        startupId,
        closedAt: null,
        startup: {
          archivedAt: null
        }
      },
      orderBy: { createdAt: "desc" },
      select: opportunityPublicSelect
    });
  }

  async create(input: CreateOpportunityInput) {
    const { data, skillIds } = splitSkills(input);

    const opportunity = await prisma.$transaction(async (tx) => {
      const created = await tx.startupOpportunity.create({
        data,
        select: opportunityPrivateSelect
      });

      if (skillIds?.length) {
        await tx.opportunitySkill.createMany({
          data: skillIds.map((skillId) => ({
            opportunityId: created.id,
            skillId
          })),
          skipDuplicates: true
        });
      }

      return created;
    });

    return this.findPrivateById(opportunity.id);
  }

  async update(opportunityId: string, input: OpportunityInput) {
    const { data, skillIds } = splitSkills(input);

    await prisma.$transaction(async (tx) => {
      await tx.startupOpportunity.update({
        where: { id: opportunityId },
        data
      });

      if (skillIds) {
        await tx.opportunitySkill.deleteMany({ where: { opportunityId } });

        if (skillIds.length) {
          await tx.opportunitySkill.createMany({
            data: skillIds.map((skillId) => ({ opportunityId, skillId })),
            skipDuplicates: true
          });
        }
      }
    });

    return this.findPrivateById(opportunityId);
  }

  async close(opportunityId: string) {
    const result = await prisma.startupOpportunity.updateMany({
      where: { id: opportunityId, closedAt: null },
      data: {
        status: "CLOSED",
        closedAt: new Date()
      }
    });

    return result.count === 1;
  }

  async incrementView(opportunityId: string, actorUserId?: string | null) {
    return prisma.$transaction(async (tx) => {
      const opportunity = await tx.startupOpportunity.findFirst({
        where: {
          id: opportunityId,
          closedAt: null,
          startup: {
            archivedAt: null
          }
        },
        select: { id: true, startupId: true }
      });

      if (!opportunity) return false;

      await tx.startupOpportunity.update({
        where: { id: opportunity.id },
        data: {
          viewsCount: {
            increment: 1
          }
        }
      });

      await tx.analyticsEvent.create({
        data: {
          eventType: "OPPORTUNITY_VIEW",
          entityType: "OPPORTUNITY",
          actorUserId: actorUserId ?? null,
          startupId: opportunity.startupId,
          opportunityId: opportunity.id
        }
      });

      return true;
    });
  }

  async getAnalytics(opportunityId: string) {
    const opportunity = await prisma.startupOpportunity.findFirst({
      where: { id: opportunityId, closedAt: null },
      select: {
        viewsCount: true,
        savesCount: true,
        applicationsCount: true
      }
    });

    if (!opportunity) return null;

    return {
      views: opportunity.viewsCount,
      saves: opportunity.savesCount,
      applications: opportunity.applicationsCount
    };
  }

  async hasActiveApplication(opportunityId: string, applicantId: string) {
    const application = await prisma.application.findFirst({
      where: {
        opportunityId,
        applicantId,
        status: "PENDING",
        withdrawnAt: null
      },
      select: { id: true }
    });

    return Boolean(application);
  }

  async createApplication(opportunityId: string, applicantId: string, input: OpportunityApplicationInput) {
    return prisma.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          opportunityId,
          applicantId,
          note: input.note ?? null
        },
        select: applicationSelect
      });

      await tx.startupOpportunity.update({
        where: { id: opportunityId },
        data: {
          applicationsCount: {
            increment: 1
          }
        }
      });

      return application;
    });
  }

  async findApplicationForApplicant(opportunityId: string, applicationId: string, applicantId: string) {
    return prisma.application.findFirst({
      where: { id: applicationId, opportunityId, applicantId },
      select: applicationSelect
    });
  }

  async findApplicationForOwner(opportunityId: string, applicationId: string, ownerId: string) {
    return prisma.application.findFirst({
      where: {
        id: applicationId,
        opportunityId,
        opportunity: {
          startup: {
            ownerId,
            archivedAt: null
          }
        }
      },
      select: applicationSelect
    });
  }

  async withdrawApplication(opportunityId: string, applicationId: string, applicantId: string) {
    const result = await prisma.application.updateMany({
      where: {
        id: applicationId,
        opportunityId,
        applicantId,
        status: "PENDING",
        withdrawnAt: null
      },
      data: {
        status: "WITHDRAWN",
        withdrawnAt: new Date(),
        decidedAt: new Date()
      }
    });

    if (result.count !== 1) return null;
    return this.findApplicationForApplicant(opportunityId, applicationId, applicantId);
  }

  async acceptApplication(opportunityId: string, applicationId: string, reviewerId: string, input: OpportunityReviewInput) {
    return this.reviewApplication(opportunityId, applicationId, reviewerId, "ACCEPTED", input);
  }

  async rejectApplication(opportunityId: string, applicationId: string, reviewerId: string, input: OpportunityReviewInput) {
    return this.reviewApplication(opportunityId, applicationId, reviewerId, "REJECTED", input);
  }

  private async reviewApplication(
    opportunityId: string,
    applicationId: string,
    reviewerId: string,
    status: "ACCEPTED" | "REJECTED",
    input: OpportunityReviewInput
  ) {
    const result = await prisma.application.updateMany({
      where: {
        id: applicationId,
        opportunityId,
        status: "PENDING",
        withdrawnAt: null,
        opportunity: {
          startup: {
            ownerId: reviewerId,
            archivedAt: null
          }
        }
      },
      data: {
        status,
        reviewedById: reviewerId,
        reviewNote: input.reviewNote ?? null,
        reviewedAt: new Date(),
        decidedAt: new Date()
      }
    });

    if (result.count !== 1) return null;
    return this.findApplicationForOwner(opportunityId, applicationId, reviewerId);
  }
}

export const opportunityRepository = new OpportunityRepository();
