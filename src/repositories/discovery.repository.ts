import type { Prisma, SwipeAction } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  OpportunityDiscoveryFilters,
  StartupDiscoveryFilters,
  UserDiscoveryFilters
} from "@/types/discovery.types";

const skillSelect = {
  skillId: true,
  yearsExperience: true,
  skill: {
    select: {
      name: true,
      slug: true
    }
  }
} satisfies Prisma.UserSkillSelect;

const industrySelect = {
  industryId: true,
  industry: {
    select: {
      name: true,
      slug: true
    }
  }
} satisfies Prisma.UserIndustrySelect;

const opportunitySkillSelect = {
  skillId: true,
  skill: {
    select: {
      name: true,
      slug: true
    }
  }
} satisfies Prisma.OpportunitySkillSelect;

const founderVisionSelect = {
  startupGoal: true,
  fundingPreference: true,
  riskAppetite: true,
  commitmentLevel: true,
  workStyle: true,
  preferredTeamSize: true,
  preferredCoFounderType: true,
  remotePreference: true
} satisfies Prisma.FounderVisionSelect;

const reputationSelect = {
  builderScore: true,
  trustScore: true,
  collaborationScore: true
} satisfies Prisma.UserReputationSelect;

const currentUserContextSelect = {
  id: true,
  country: true,
  state: true,
  city: true,
  status: true,
  availability: true,
  skills: {
    select: skillSelect
  },
  industries: {
    select: industrySelect
  },
  founderVision: {
    select: founderVisionSelect
  },
  reputation: {
    select: reputationSelect
  }
} satisfies Prisma.UserSelect;

const userDiscoverySelect = {
  id: true,
  username: true,
  name: true,
  profilePhotoUrl: true,
  headline: true,
  bio: true,
  country: true,
  state: true,
  city: true,
  status: true,
  availability: true,
  createdAt: true,
  skills: {
    select: skillSelect
  },
  industries: {
    select: industrySelect
  },
  interests: {
    select: {
      interestId: true,
      interest: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  },
  communityMemberships: {
    select: {
      community: {
        select: {
          name: true,
          slug: true,
          description: true,
          website: true,
          isVerified: true
        }
      }
    }
  },
  founderVision: {
    select: founderVisionSelect
  },
  reputation: {
    select: reputationSelect
  }
} satisfies Prisma.UserSelect;

const startupDiscoverySelect = {
  id: true,
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
  hiringStatus: true,
  openRolesCount: true,
  equityAvailable: true,
  salaryAvailable: true,
  profileViewsCount: true,
  followersCount: true,
  savesCount: true,
  applicationsCount: true,
  createdAt: true,
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
      role: true,
      isFounder: true,
      user: {
        select: {
          username: true,
          name: true,
          profilePhotoUrl: true
        }
      }
    }
  }
} satisfies Prisma.StartupSelect;

const opportunityDiscoverySelect = {
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
  createdAt: true,
  startup: {
    select: {
      name: true,
      slug: true,
      logoUrl: true,
      startupStage: true,
      fundingStage: true,
      industry: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  },
  skills: {
    select: opportunitySkillSelect
  }
} satisfies Prisma.StartupOpportunitySelect;

const swipeSelect = {
  id: true,
  action: true,
  createdAt: true
};

// Placeholder until the schema has a dedicated profile visibility field.
// Future schema candidate: User.profileVisibility or User.isProfileActive.
const visibleProfileWhere = {
  deletedAt: null,
  status: {
    not: "NOT_LOOKING"
  }
} satisfies Prisma.UserWhereInput;

export type CurrentUserDiscoveryContext = Prisma.UserGetPayload<{
  select: typeof currentUserContextSelect;
}>;

export type DiscoveryUserCandidate = Prisma.UserGetPayload<{
  select: typeof userDiscoverySelect;
}>;

export type DiscoveryStartupCandidate = Prisma.StartupGetPayload<{
  select: typeof startupDiscoverySelect;
}>;

export type DiscoveryOpportunityCandidate = Prisma.StartupOpportunityGetPayload<{
  select: typeof opportunityDiscoverySelect;
}>;

function paginate<T extends { id: string }>(items: T[], limit: number) {
  const hasNextPage = items.length > limit;
  const visibleItems = hasNextPage ? items.slice(0, limit) : items;
  const nextCursor = hasNextPage ? visibleItems[visibleItems.length - 1]?.id ?? null : null;

  return {
    items: visibleItems,
    nextCursor
  };
}

export class DiscoveryRepository {
  async findCurrentUserContext(userId: string) {
    return prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null
      },
      select: currentUserContextSelect
    });
  }

  async findBlockedUserIds(userId: string) {
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: userId },
          { blockedId: userId }
        ]
      },
      select: {
        blockerId: true,
        blockedId: true
      }
    });

    return blocks.map((block) => block.blockerId === userId ? block.blockedId : block.blockerId);
  }

  async areUsersBlocked(userId: string, otherUserId: string) {
    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId }
        ]
      },
      select: {
        blockerId: true
      }
    });

    return Boolean(block);
  }

  async findUserDiscoveryCandidates(
    userId: string,
    filters: UserDiscoveryFilters,
    blockedUserIds: string[]
  ) {
    const where: Prisma.UserWhereInput = {
      id: {
        not: userId,
        notIn: blockedUserIds
      },
      deletedAt: visibleProfileWhere.deletedAt,
      status: filters.status ?? {
        not: "NOT_LOOKING"
      },
      availability: filters.availability,
      country: filters.country,
      state: filters.state,
      city: filters.city,
      skills: filters.skillIds?.length || filters.minExperienceYears !== undefined
        ? {
          some: {
            skillId: filters.skillIds?.length ? { in: filters.skillIds } : undefined,
            yearsExperience: filters.minExperienceYears !== undefined ? { gte: filters.minExperienceYears } : undefined
          }
        }
        : undefined,
      industries: filters.industryIds?.length
        ? {
          some: {
            industryId: {
              in: filters.industryIds
            }
          }
        }
        : undefined,
      founderVision: filters.workStyle
        ? {
          is: {
            OR: [
              { workStyle: filters.workStyle },
              { remotePreference: filters.workStyle }
            ]
          }
        }
        : undefined,
      swipesReceived: {
        none: {
          swiperId: userId
        }
      }
    };

    const users = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      skip: filters.cursor ? 1 : 0,
      take: filters.limit + 1,
      select: userDiscoverySelect
    });

    return paginate(users, filters.limit);
  }

  async findStartupDiscoveryCandidates(
    userId: string,
    filters: StartupDiscoveryFilters,
    blockedUserIds: string[]
  ) {
    const where: Prisma.StartupWhereInput = {
      ownerId: {
        not: userId,
        notIn: blockedUserIds
      },
      archivedAt: null,
      industryId: filters.industryIds?.length ? { in: filters.industryIds } : undefined,
      fundingStage: filters.fundraisingOnly
        ? { in: ["FUNDRAISING_NOW", "FUNDRAISING"] }
        : filters.fundingStage,
      country: filters.country,
      state: filters.state,
      city: filters.city,
      teamSize: filters.minTeamSize !== undefined || filters.maxTeamSize !== undefined
        ? {
          gte: filters.minTeamSize,
          lte: filters.maxTeamSize
        }
        : undefined,
      hiringStatus: filters.hiringStatus,
      owner: {
        ...visibleProfileWhere
      },
      swipes: {
        none: {
          swiperId: userId
        }
      }
    };

    const startups = await prisma.startup.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      skip: filters.cursor ? 1 : 0,
      take: filters.limit + 1,
      select: startupDiscoverySelect
    });

    return paginate(startups, filters.limit);
  }

  async findOpportunityDiscoveryCandidates(
    userId: string,
    filters: OpportunityDiscoveryFilters,
    blockedUserIds: string[]
  ) {
    const compensationType: Prisma.StartupOpportunityWhereInput["compensationType"] = filters.equityAvailable && filters.salaryAvailable
      ? "BOTH"
      : filters.equityAvailable
        ? { in: ["EQUITY", "BOTH"] }
        : filters.salaryAvailable
          ? { in: ["SALARY", "BOTH"] }
          : undefined;

    const where: Prisma.StartupOpportunityWhereInput = {
      closedAt: null,
      status: "OPEN",
      opportunityType: filters.opportunityType,
      compensationType,
      remoteAllowed: filters.remoteAllowed,
      country: filters.country,
      state: filters.state,
      city: filters.city,
      skills: filters.skillIds?.length
        ? {
          some: {
            skillId: {
              in: filters.skillIds
            }
          }
        }
        : undefined,
      startup: {
        archivedAt: null,
        ownerId: {
          not: userId,
          notIn: blockedUserIds
        },
        owner: {
          ...visibleProfileWhere
        }
      },
      swipes: {
        none: {
          swiperId: userId
        }
      }
    };

    const opportunities = await prisma.startupOpportunity.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      skip: filters.cursor ? 1 : 0,
      take: filters.limit + 1,
      select: opportunityDiscoverySelect
    });

    return paginate(opportunities, filters.limit);
  }

  async findUserForSwipe(targetUserId: string) {
    return prisma.user.findFirst({
      where: {
        id: targetUserId,
        ...visibleProfileWhere
      },
      select: {
        id: true,
        deletedAt: true,
        status: true
      }
    });
  }

  async findStartupForSwipe(targetStartupId: string) {
    return prisma.startup.findFirst({
      where: {
        id: targetStartupId,
        archivedAt: null,
        owner: {
          ...visibleProfileWhere
        }
      },
      select: {
        id: true,
        ownerId: true,
        archivedAt: true
      }
    });
  }

  async findOpportunityForSwipe(targetOpportunityId: string) {
    return prisma.startupOpportunity.findFirst({
      where: {
        id: targetOpportunityId,
        closedAt: null,
        status: "OPEN",
        startup: {
          archivedAt: null,
          owner: {
            ...visibleProfileWhere
          }
        }
      },
      select: {
        id: true,
        status: true,
        closedAt: true,
        startup: {
          select: {
            ownerId: true,
            archivedAt: true
          }
        }
      }
    });
  }

  async hasUserSwipe(swiperId: string, targetUserId: string) {
    const swipe = await prisma.userSwipe.findUnique({
      where: {
        swiperId_targetUserId: {
          swiperId,
          targetUserId
        }
      },
      select: {
        id: true
      }
    });

    return Boolean(swipe);
  }

  async hasStartupSwipe(swiperId: string, targetStartupId: string) {
    const swipe = await prisma.startupSwipe.findUnique({
      where: {
        swiperId_targetStartupId: {
          swiperId,
          targetStartupId
        }
      },
      select: {
        id: true
      }
    });

    return Boolean(swipe);
  }

  async hasOpportunitySwipe(swiperId: string, targetOpportunityId: string) {
    const swipe = await prisma.opportunitySwipe.findUnique({
      where: {
        swiperId_targetOpportunityId: {
          swiperId,
          targetOpportunityId
        }
      },
      select: {
        id: true
      }
    });

    return Boolean(swipe);
  }

  async createUserSwipe(swiperId: string, targetUserId: string, action: SwipeAction) {
    return prisma.userSwipe.create({
      data: {
        swiperId,
        targetUserId,
        action
      },
      select: swipeSelect
    });
  }

  async createStartupSwipe(swiperId: string, targetStartupId: string, action: SwipeAction) {
    return prisma.startupSwipe.create({
      data: {
        swiperId,
        targetStartupId,
        action
      },
      select: swipeSelect
    });
  }

  async createOpportunitySwipe(swiperId: string, targetOpportunityId: string, action: SwipeAction) {
    return prisma.opportunitySwipe.create({
      data: {
        swiperId,
        targetOpportunityId,
        action
      },
      select: swipeSelect
    });
  }

  async findUserForCompatibility(targetUserId: string) {
    return prisma.user.findFirst({
      where: {
        id: targetUserId,
        ...visibleProfileWhere
      },
      select: userDiscoverySelect
    });
  }

  async findStartupForCompatibility(startupId: string) {
    return prisma.startup.findFirst({
      where: {
        id: startupId,
        archivedAt: null,
        owner: {
          ...visibleProfileWhere
        }
      },
      select: startupDiscoverySelect
    });
  }
}

export const discoveryRepository = new DiscoveryRepository();
