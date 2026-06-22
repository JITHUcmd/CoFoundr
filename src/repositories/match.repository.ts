import type { MatchStatus, Prisma, SwipeAction } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { MatchListFilters, MatchScoreSnapshot } from "@/types/match.types";

const positiveSwipeActions: SwipeAction[] = ["RIGHT", "SUPER_LIKE"];

const visibleUserWhere = {
  deletedAt: null,
  status: {
    not: "NOT_LOOKING"
  }
} satisfies Prisma.UserWhereInput;

const scoreSelect = {
  matchScore: true,
  compatibilityScore: true,
  skillsScore: true,
  founderVisionScore: true,
  locationScore: true,
  consistencyScore: true,
  trustScore: true,
  builderScore: true
};

const userPublicSelect = {
  id: true,
  username: true,
  name: true,
  profilePhotoUrl: true,
  headline: true
};

const userContextSelect = {
  id: true,
  country: true,
  state: true,
  city: true,
  skills: {
    select: {
      skillId: true
    }
  },
  industries: {
    select: {
      industryId: true
    }
  },
  founderVision: {
    select: {
      startupGoal: true,
      fundingPreference: true,
      riskAppetite: true,
      commitmentLevel: true,
      workStyle: true,
      remotePreference: true
    }
  },
  reputation: {
    select: {
      builderScore: true,
      trustScore: true,
      collaborationScore: true
    }
  }
} satisfies Prisma.UserSelect;

const userMatchSelect = {
  id: true,
  status: true,
  createdAt: true,
  archivedAt: true,
  blockedAt: true,
  ...scoreSelect,
  userA: {
    select: userPublicSelect
  },
  userB: {
    select: userPublicSelect
  }
} satisfies Prisma.UserMatchSelect;

const startupMatchSelect = {
  id: true,
  status: true,
  createdAt: true,
  archivedAt: true,
  blockedAt: true,
  ...scoreSelect,
  user: {
    select: userPublicSelect
  },
  startup: {
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      tagline: true,
      ownerId: true
    }
  }
} satisfies Prisma.UserStartupMatchSelect;

const startupInterestSelect = {
  id: true,
  action: true,
  createdAt: true,
  swiper: {
    select: userPublicSelect
  }
} satisfies Prisma.StartupSwipeSelect;

const opportunityMatchSelect = {
  id: true,
  status: true,
  createdAt: true,
  archivedAt: true,
  blockedAt: true,
  ...scoreSelect,
  user: {
    select: userPublicSelect
  },
  opportunity: {
    select: {
      id: true,
      roleName: true,
      opportunityType: true,
      status: true,
      startup: {
        select: {
          id: true,
          slug: true,
          name: true,
          logoUrl: true,
          ownerId: true
        }
      }
    }
  }
} satisfies Prisma.UserOpportunityMatchSelect;

const opportunityInterestSelect = {
  id: true,
  action: true,
  createdAt: true,
  swiper: {
    select: userPublicSelect
  }
} satisfies Prisma.OpportunitySwipeSelect;

export type MatchUserContext = Prisma.UserGetPayload<{
  select: typeof userContextSelect;
}>;

export type UserMatchRecord = Prisma.UserMatchGetPayload<{
  select: typeof userMatchSelect;
}>;

export type StartupMatchRecord = Prisma.UserStartupMatchGetPayload<{
  select: typeof startupMatchSelect;
}>;

export type StartupInterestRecord = Prisma.StartupSwipeGetPayload<{
  select: typeof startupInterestSelect;
}>;

export type OpportunityMatchRecord = Prisma.UserOpportunityMatchGetPayload<{
  select: typeof opportunityMatchSelect;
}>;

export type OpportunityInterestRecord = Prisma.OpportunitySwipeGetPayload<{
  select: typeof opportunityInterestSelect;
}>;

function scoreData(snapshot: MatchScoreSnapshot) {
  return {
    matchScore: snapshot.matchScore,
    compatibilityScore: snapshot.compatibilityScore,
    skillsScore: snapshot.skillsScore,
    founderVisionScore: snapshot.founderVisionScore,
    locationScore: snapshot.locationScore,
    consistencyScore: snapshot.consistencyScore,
    trustScore: snapshot.trustScore,
    builderScore: snapshot.builderScore
  };
}

export class MatchRepository {
  async findVisibleUserContext(userId: string) {
    return prisma.user.findFirst({
      where: {
        id: userId,
        ...visibleUserWhere
      },
      select: userContextSelect
    });
  }

  async areUsersBlocked(userAId: string, userBId: string) {
    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId }
        ]
      },
      select: {
        blockerId: true
      }
    });

    return Boolean(block);
  }

  async hasPositiveUserSwipe(swiperId: string, targetUserId: string) {
    const swipe = await prisma.userSwipe.findFirst({
      where: {
        swiperId,
        targetUserId,
        action: {
          in: positiveSwipeActions
        }
      },
      select: {
        id: true
      }
    });

    return Boolean(swipe);
  }

  async hasPositiveStartupSwipe(userId: string, startupId: string) {
    const swipe = await prisma.startupSwipe.findFirst({
      where: {
        swiperId: userId,
        targetStartupId: startupId,
        action: {
          in: positiveSwipeActions
        }
      },
      select: {
        id: true
      }
    });

    return Boolean(swipe);
  }

  async hasPositiveOpportunitySwipe(userId: string, opportunityId: string) {
    const swipe = await prisma.opportunitySwipe.findFirst({
      where: {
        swiperId: userId,
        targetOpportunityId: opportunityId,
        action: {
          in: positiveSwipeActions
        }
      },
      select: {
        id: true
      }
    });

    return Boolean(swipe);
  }

  async findVisibleStartup(startupId: string) {
    return prisma.startup.findFirst({
      where: {
        id: startupId,
        archivedAt: null,
        owner: {
          ...visibleUserWhere
        }
      },
      select: {
        id: true,
        ownerId: true
      }
    });
  }

  async listStartupInterests(startupId: string) {
    return prisma.startupSwipe.findMany({
      where: {
        targetStartupId: startupId,
        action: {
          in: positiveSwipeActions
        },
        swiper: {
          ...visibleUserWhere
        },
        targetStartup: {
          archivedAt: null,
          owner: {
            ...visibleUserWhere
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      select: startupInterestSelect
    });
  }

  async findVisibleOpportunity(opportunityId: string) {
    return prisma.startupOpportunity.findFirst({
      where: {
        id: opportunityId,
        status: "OPEN",
        closedAt: null,
        startup: {
          archivedAt: null,
          owner: {
            ...visibleUserWhere
          }
        }
      },
      select: {
        id: true,
        startup: {
          select: {
            ownerId: true
          }
        }
      }
    });
  }

  async listOpportunityInterests(opportunityId: string) {
    return prisma.opportunitySwipe.findMany({
      where: {
        targetOpportunityId: opportunityId,
        action: {
          in: positiveSwipeActions
        },
        swiper: {
          ...visibleUserWhere
        },
        targetOpportunity: {
          status: "OPEN",
          closedAt: null,
          startup: {
            archivedAt: null,
            owner: {
              ...visibleUserWhere
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      select: opportunityInterestSelect
    });
  }

  async findStartupReadyForOwnerSwipe(ownerId: string, targetUserId: string, startupId: string) {
    return prisma.startup.findFirst({
      where: {
        id: startupId,
        ownerId,
        archivedAt: null,
        owner: {
          ...visibleUserWhere
        },
        swipes: {
          some: {
            swiperId: targetUserId,
            action: {
              in: positiveSwipeActions
            }
          }
        }
      },
      select: {
        id: true,
        ownerId: true
      }
    });
  }

  async findAcceptedApplication(applicationId: string) {
    return prisma.application.findFirst({
      where: {
        id: applicationId,
        status: "ACCEPTED",
        withdrawnAt: null,
        applicant: {
          ...visibleUserWhere
        },
        opportunity: {
          status: "OPEN",
          closedAt: null,
          startup: {
            archivedAt: null,
            owner: {
              ...visibleUserWhere
            }
          }
        }
      },
      select: {
        id: true,
        applicantId: true,
        opportunityId: true,
        opportunity: {
          select: {
            startup: {
              select: {
                ownerId: true
              }
            }
          }
        }
      }
    });
  }

  async findUserMatch(userAId: string, userBId: string) {
    return prisma.userMatch.findUnique({
      where: {
        userAId_userBId: {
          userAId,
          userBId
        }
      },
      select: userMatchSelect
    });
  }

  async createUserMatch(userAId: string, userBId: string, createdByUserId: string, scores: MatchScoreSnapshot) {
    return prisma.userMatch.create({
      data: {
        userAId,
        userBId,
        createdByUserId,
        ...scoreData(scores)
      },
      select: userMatchSelect
    });
  }

  async findStartupMatch(userId: string, startupId: string) {
    return prisma.userStartupMatch.findUnique({
      where: {
        userId_startupId: {
          userId,
          startupId
        }
      },
      select: startupMatchSelect
    });
  }

  async createStartupMatch(userId: string, startupId: string, createdByUserId: string, scores: MatchScoreSnapshot) {
    return prisma.userStartupMatch.create({
      data: {
        userId,
        startupId,
        createdByUserId,
        ...scoreData(scores)
      },
      select: startupMatchSelect
    });
  }

  async findOpportunityMatch(userId: string, opportunityId: string) {
    return prisma.userOpportunityMatch.findUnique({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId
        }
      },
      select: opportunityMatchSelect
    });
  }

  async createOpportunityMatch(
    userId: string,
    opportunityId: string,
    createdByUserId: string,
    scores: MatchScoreSnapshot
  ) {
    return prisma.userOpportunityMatch.create({
      data: {
        userId,
        opportunityId,
        createdByUserId,
        ...scoreData(scores)
      },
      select: opportunityMatchSelect
    });
  }

  async listUserMatches(userId: string, filters: MatchListFilters) {
    const status = filters.status;

    return prisma.userMatch.findMany({
      where: {
        status,
        OR: [
          { userAId: userId },
          { userBId: userId }
        ],
        userA: {
          ...visibleUserWhere
        },
        userB: {
          ...visibleUserWhere
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: filters.limit,
      select: userMatchSelect
    });
  }

  async listStartupMatches(userId: string, filters: MatchListFilters) {
    return prisma.userStartupMatch.findMany({
      where: {
        status: filters.status,
        OR: [
          { userId },
          { startup: { ownerId: userId } }
        ],
        user: {
          ...visibleUserWhere
        },
        startup: {
          archivedAt: null,
          owner: {
            ...visibleUserWhere
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: filters.limit,
      select: startupMatchSelect
    });
  }

  async listOpportunityMatches(userId: string, filters: MatchListFilters) {
    return prisma.userOpportunityMatch.findMany({
      where: {
        status: filters.status,
        OR: [
          { userId },
          { opportunity: { startup: { ownerId: userId } } }
        ],
        user: {
          ...visibleUserWhere
        },
        opportunity: {
          status: "OPEN",
          closedAt: null,
          startup: {
            archivedAt: null,
            owner: {
              ...visibleUserWhere
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: filters.limit,
      select: opportunityMatchSelect
    });
  }

  async findMatchByIdForUser(matchId: string, userId: string) {
    const userMatch = await prisma.userMatch.findFirst({
      where: {
        id: matchId,
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      select: userMatchSelect
    });

    if (userMatch) return { type: "USER" as const, match: userMatch };

    const startupMatch = await prisma.userStartupMatch.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId },
          { startup: { ownerId: userId } }
        ]
      },
      select: startupMatchSelect
    });

    if (startupMatch) return { type: "STARTUP" as const, match: startupMatch };

    const opportunityMatch = await prisma.userOpportunityMatch.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId },
          { opportunity: { startup: { ownerId: userId } } }
        ]
      },
      select: opportunityMatchSelect
    });

    if (opportunityMatch) return { type: "OPPORTUNITY" as const, match: opportunityMatch };
    return null;
  }

  async updateMatchStatusForUser(matchId: string, userId: string, status: "ARCHIVED" | "BLOCKED") {
    const now = new Date();
    const data = status === "ARCHIVED"
      ? { status, archivedAt: now }
      : { status, blockedAt: now };

    const userResult = await prisma.userMatch.updateMany({
      where: {
        id: matchId,
        status: "ACTIVE",
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      data
    });

    if (userResult.count === 1) return this.findMatchByIdForUser(matchId, userId);

    const startupResult = await prisma.userStartupMatch.updateMany({
      where: {
        id: matchId,
        status: "ACTIVE",
        OR: [
          { userId },
          { startup: { ownerId: userId } }
        ]
      },
      data
    });

    if (startupResult.count === 1) return this.findMatchByIdForUser(matchId, userId);

    const opportunityResult = await prisma.userOpportunityMatch.updateMany({
      where: {
        id: matchId,
        status: "ACTIVE",
        OR: [
          { userId },
          { opportunity: { startup: { ownerId: userId } } }
        ]
      },
      data
    });

    if (opportunityResult.count === 1) return this.findMatchByIdForUser(matchId, userId);
    return null;
  }
}

export const matchRepository = new MatchRepository();
