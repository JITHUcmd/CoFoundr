import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { AnalyticsDateWindow, ChartSeries } from "@/types/analytics.types";

type ChartRow = {
  label: string;
  value: number | bigint;
};

const profileCompletionSelect = {
  id: true,
  name: true,
  username: true,
  profilePhotoUrl: true,
  headline: true,
  bio: true,
  country: true,
  state: true,
  city: true,
  status: true,
  availability: true,
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
  interests: {
    select: {
      interestId: true
    }
  },
  experiences: {
    select: {
      id: true
    }
  },
  education: {
    select: {
      id: true
    }
  },
  communityMemberships: {
    select: {
      communityId: true
    }
  },
  portfolioLinks: {
    select: {
      id: true
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

export type AnalyticsProfileRecord = Prisma.UserGetPayload<{
  select: typeof profileCompletionSelect;
}>;

const startupAnalyticsSelect = {
  id: true,
  ownerId: true,
  verificationStatus: true,
  teamSize: true,
  profileViewsCount: true,
  followersCount: true,
  savesCount: true,
  applicationsCount: true,
  members: {
    where: {
      leftAt: null
    },
    select: {
      id: true
    }
  },
  opportunities: {
    where: {
      status: "OPEN",
      closedAt: null
    },
    select: {
      id: true
    }
  }
} satisfies Prisma.StartupSelect;

export type StartupAnalyticsRecord = Prisma.StartupGetPayload<{
  select: typeof startupAnalyticsSelect;
}>;

const opportunityAnalyticsSelect = {
  id: true,
  startupId: true,
  viewsCount: true,
  savesCount: true,
  applicationsCount: true,
  startup: {
    select: {
      ownerId: true
    }
  }
} satisfies Prisma.StartupOpportunitySelect;

export type OpportunityAnalyticsRecord = Prisma.StartupOpportunityGetPayload<{
  select: typeof opportunityAnalyticsSelect;
}>;

function dateWhere(startDate: Date | null) {
  return startDate ? { gte: startDate } : undefined;
}

function chartFromRows(rows: ChartRow[]): ChartSeries {
  return {
    labels: rows.map((row) => row.label),
    values: rows.map((row) => Number(row.value))
  };
}

function bucketFormat(bucket: AnalyticsDateWindow["bucket"]) {
  if (bucket === "month") return "YYYY-MM";
  if (bucket === "week") return "IYYY-IW";
  return "YYYY-MM-DD";
}

function windowSql(window: AnalyticsDateWindow, column: string) {
  return window.startDate
    ? Prisma.sql`AND ${Prisma.raw(column)} >= ${window.startDate}`
    : Prisma.empty;
}

export class AnalyticsRepository {
  async createProfileViewEvent(input: {
    targetUserId: string;
    actorUserId?: string | null;
  }) {
    return prisma.analyticsEvent.create({
      data: {
        eventType: "PROFILE_VIEW",
        entityType: "USER",
        actorUserId: input.actorUserId ?? null,
        targetUserId: input.targetUserId
      }
    });
  }

  async createDiscoveryAppearanceEvents(input: {
    actorUserId: string;
    targetUserIds?: string[];
    startupIds?: string[];
    opportunityIds?: string[];
  }) {
    const data: Prisma.AnalyticsEventCreateManyInput[] = [
      ...(input.targetUserIds ?? []).map((targetUserId) => ({
        eventType: "DISCOVERY_APPEARANCE" as const,
        entityType: "USER" as const,
        actorUserId: input.actorUserId,
        targetUserId
      })),
      ...(input.startupIds ?? []).map((startupId) => ({
        eventType: "DISCOVERY_APPEARANCE" as const,
        entityType: "STARTUP" as const,
        actorUserId: input.actorUserId,
        startupId
      })),
      ...(input.opportunityIds ?? []).map((opportunityId) => ({
        eventType: "DISCOVERY_APPEARANCE" as const,
        entityType: "OPPORTUNITY" as const,
        actorUserId: input.actorUserId,
        opportunityId
      }))
    ];

    if (data.length === 0) {
      return { count: 0 };
    }

    return prisma.analyticsEvent.createMany({ data });
  }

  async createMatchCreatedEvents(input: {
    matchId: string;
    matchType: string;
    participantUserIds: string[];
  }) {
    const participantUserIds = [...new Set(input.participantUserIds.filter(Boolean))];

    if (participantUserIds.length === 0) {
      return { count: 0 };
    }

    return prisma.analyticsEvent.createMany({
      data: participantUserIds.map((targetUserId) => ({
        eventType: "MATCH_CREATED",
        entityType: "MATCH",
        targetUserId,
        metadata: {
          matchId: input.matchId,
          matchType: input.matchType
        }
      }))
    });
  }

  async createMessageSentEvent(input: {
    senderId: string;
    conversationId: string;
    messageId: string;
  }) {
    return prisma.analyticsEvent.create({
      data: {
        eventType: "MESSAGE_SENT",
        entityType: "MESSAGE",
        actorUserId: input.senderId,
        conversationId: input.conversationId,
        messageId: input.messageId
      }
    });
  }

  async findUserProfile(userId: string) {
    return prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null
      },
      select: profileCompletionSelect
    });
  }

  async getUserMetrics(userId: string, window: AnalyticsDateWindow) {
    const createdAt = dateWhere(window.startDate);
    const occurredAt = dateWhere(window.startDate);

    const [
      profileViews,
      discoveryAppearances,
      rightSwipesReceived,
      superLikesReceived,
      userMatches,
      startupMatches,
      opportunityMatches,
      messagesSent,
      messagesReceived
    ] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          eventType: "PROFILE_VIEW",
          targetUserId: userId,
          occurredAt
        }
      }),
      prisma.analyticsEvent.count({
        where: {
          eventType: "DISCOVERY_APPEARANCE",
          targetUserId: userId,
          occurredAt
        }
      }),
      prisma.userSwipe.count({
        where: {
          targetUserId: userId,
          action: "RIGHT",
          createdAt
        }
      }),
      prisma.userSwipe.count({
        where: {
          targetUserId: userId,
          action: "SUPER_LIKE",
          createdAt
        }
      }),
      prisma.userMatch.count({
        where: {
          status: "ACTIVE",
          createdAt,
          OR: [
            { userAId: userId },
            { userBId: userId }
          ]
        }
      }),
      prisma.userStartupMatch.count({
        where: {
          userId,
          status: "ACTIVE",
          createdAt
        }
      }),
      prisma.userOpportunityMatch.count({
        where: {
          userId,
          status: "ACTIVE",
          createdAt
        }
      }),
      prisma.message.count({
        where: {
          senderId: userId,
          deletedAt: null,
          createdAt
        }
      }),
      prisma.message.count({
        where: {
          senderId: {
            not: userId
          },
          deletedAt: null,
          createdAt,
          conversation: {
            participants: {
              some: {
                userId
              }
            }
          }
        }
      })
    ]);

    return {
      profileViews,
      discoveryAppearances,
      rightSwipesReceived,
      superLikesReceived,
      matches: userMatches + startupMatches + opportunityMatches,
      messagesSent,
      messagesReceived
    };
  }

  async getUserCharts(userId: string, window: AnalyticsDateWindow) {
    const [profileViews, matches, messagesSent] = await Promise.all([
      this.analyticsEventChart({
        eventType: "PROFILE_VIEW",
        window,
        targetUserId: userId
      }),
      this.analyticsEventChart({
        eventType: "MATCH_CREATED",
        window,
        targetUserId: userId
      }),
      this.analyticsEventChart({
        eventType: "MESSAGE_SENT",
        window,
        actorUserId: userId
      })
    ]);

    return {
      profileViews,
      matches,
      messagesSent
    };
  }

  async findStartupForAnalytics(startupId: string) {
    return prisma.startup.findFirst({
      where: {
        id: startupId,
        archivedAt: null
      },
      select: startupAnalyticsSelect
    });
  }

  async getStartupMetrics(startupId: string, window: AnalyticsDateWindow) {
    const createdAt = dateWhere(window.startDate);
    const occurredAt = dateWhere(window.startDate);

    const [
      views,
      saves,
      applications,
      startupMatches,
      opportunityMatches,
      joined
    ] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          eventType: "STARTUP_VIEW",
          startupId,
          occurredAt
        }
      }),
      prisma.savedStartup.count({
        where: {
          startupId,
          createdAt
        }
      }),
      prisma.application.count({
        where: {
          opportunity: {
            startupId
          },
          createdAt
        }
      }),
      prisma.userStartupMatch.count({
        where: {
          startupId,
          status: "ACTIVE",
          createdAt
        }
      }),
      prisma.userOpportunityMatch.count({
        where: {
          status: "ACTIVE",
          createdAt,
          opportunity: {
            startupId
          }
        }
      }),
      prisma.startupMember.count({
        where: {
          startupId,
          leftAt: null,
          joinedAt: createdAt
        }
      })
    ]);

    return {
      views,
      saves,
      applications,
      matches: startupMatches + opportunityMatches,
      joined
    };
  }

  async getStartupCharts(startupId: string, window: AnalyticsDateWindow) {
    const [views, applications, matches] = await Promise.all([
      this.analyticsEventChart({
        eventType: "STARTUP_VIEW",
        window,
        startupId
      }),
      this.applicationChart({
        window,
        startupId
      }),
      this.startupMatchChart(startupId, window)
    ]);

    return {
      views,
      applications,
      matches
    };
  }

  async findOpportunityForAnalytics(opportunityId: string) {
    return prisma.startupOpportunity.findFirst({
      where: {
        id: opportunityId,
        closedAt: null
      },
      select: opportunityAnalyticsSelect
    });
  }

  async getOpportunityMetrics(opportunityId: string, window: AnalyticsDateWindow) {
    const createdAt = dateWhere(window.startDate);
    const occurredAt = dateWhere(window.startDate);

    const [
      views,
      saves,
      applications,
      acceptedApplications,
      rejectedApplications,
      matches
    ] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          eventType: "OPPORTUNITY_VIEW",
          opportunityId,
          occurredAt
        }
      }),
      prisma.savedOpportunity.count({
        where: {
          opportunityId,
          createdAt
        }
      }),
      prisma.application.count({
        where: {
          opportunityId,
          createdAt
        }
      }),
      prisma.application.count({
        where: {
          opportunityId,
          status: "ACCEPTED",
          createdAt
        }
      }),
      prisma.application.count({
        where: {
          opportunityId,
          status: "REJECTED",
          createdAt
        }
      }),
      prisma.userOpportunityMatch.count({
        where: {
          opportunityId,
          status: "ACTIVE",
          createdAt
        }
      })
    ]);

    return {
      views,
      saves,
      applications,
      acceptedApplications,
      rejectedApplications,
      matches
    };
  }

  async getOpportunityCharts(opportunityId: string, window: AnalyticsDateWindow) {
    const [views, applications, matches] = await Promise.all([
      this.analyticsEventChart({
        eventType: "OPPORTUNITY_VIEW",
        window,
        opportunityId
      }),
      this.applicationChart({
        window,
        opportunityId
      }),
      this.opportunityMatchChart(opportunityId, window)
    ]);

    return {
      views,
      applications,
      matches
    };
  }

  async getPlatformTotals(_window: AnalyticsDateWindow) {
    const [
      totalUsers,
      activeUsers,
      totalStartups,
      totalOpportunities,
      userMatches,
      startupMatches,
      opportunityMatches,
      totalMessages,
      totalApplications
    ] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null
        }
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          status: {
            not: "NOT_LOOKING"
          }
        }
      }),
      prisma.startup.count({
        where: {
          archivedAt: null
        }
      }),
      prisma.startupOpportunity.count({
        where: {
          closedAt: null
        }
      }),
      prisma.userMatch.count(),
      prisma.userStartupMatch.count(),
      prisma.userOpportunityMatch.count(),
      prisma.message.count({
        where: {
          deletedAt: null
        }
      }),
      prisma.application.count()
    ]);

    return {
      totalUsers,
      activeUsers,
      totalStartups,
      totalOpportunities,
      totalMatches: userMatches + startupMatches + opportunityMatches,
      totalMessages,
      totalApplications
    };
  }

  async getPlatformGrowth(window: AnalyticsDateWindow) {
    const [daily, weekly, monthly] = await Promise.all([
      this.userSignupChart({ ...window, bucket: "day" }),
      this.userSignupChart({ ...window, bucket: "week" }),
      this.userSignupChart({ ...window, bucket: "month" })
    ]);

    return {
      daily,
      weekly,
      monthly
    };
  }

  private async analyticsEventChart(args: {
    eventType: "PROFILE_VIEW" | "STARTUP_VIEW" | "OPPORTUNITY_VIEW" | "MATCH_CREATED" | "MESSAGE_SENT";
    window: AnalyticsDateWindow;
    targetUserId?: string;
    actorUserId?: string;
    startupId?: string;
    opportunityId?: string;
  }) {
    const filters: Prisma.Sql[] = [
      Prisma.sql`"eventType" = ${args.eventType}`
    ];

    if (args.targetUserId) filters.push(Prisma.sql`"targetUserId" = ${args.targetUserId}`);
    if (args.actorUserId) filters.push(Prisma.sql`"actorUserId" = ${args.actorUserId}`);
    if (args.startupId) filters.push(Prisma.sql`"startupId" = ${args.startupId}`);
    if (args.opportunityId) filters.push(Prisma.sql`"opportunityId" = ${args.opportunityId}`);
    if (args.window.startDate) filters.push(Prisma.sql`"occurredAt" >= ${args.window.startDate}`);

    const rows = await prisma.$queryRaw<ChartRow[]>`
      SELECT
        to_char(date_trunc(${args.window.bucket}, "occurredAt"), ${bucketFormat(args.window.bucket)}) AS label,
        COUNT(*)::int AS value
      FROM "AnalyticsEvent"
      WHERE ${Prisma.join(filters, " AND ")}
      GROUP BY label
      ORDER BY label ASC
    `;

    return chartFromRows(rows);
  }

  private async applicationChart(args: {
    window: AnalyticsDateWindow;
    startupId?: string;
    opportunityId?: string;
  }) {
    const rows = await prisma.$queryRaw<ChartRow[]>`
      SELECT
        to_char(date_trunc(${args.window.bucket}, a."createdAt"), ${bucketFormat(args.window.bucket)}) AS label,
        COUNT(*)::int AS value
      FROM "Application" a
      JOIN "StartupOpportunity" o ON o.id = a."opportunityId"
      WHERE 1 = 1
        ${args.startupId ? Prisma.sql`AND o."startupId" = ${args.startupId}` : Prisma.empty}
        ${args.opportunityId ? Prisma.sql`AND a."opportunityId" = ${args.opportunityId}` : Prisma.empty}
        ${windowSql(args.window, `a."createdAt"`)}
      GROUP BY label
      ORDER BY label ASC
    `;

    return chartFromRows(rows);
  }

  private async startupMatchChart(startupId: string, window: AnalyticsDateWindow) {
    const rows = await prisma.$queryRaw<ChartRow[]>`
      SELECT label, SUM(value)::int AS value
      FROM (
        SELECT
          to_char(date_trunc(${window.bucket}, "createdAt"), ${bucketFormat(window.bucket)}) AS label,
          COUNT(*)::int AS value
        FROM "UserStartupMatch"
        WHERE "startupId" = ${startupId}
          ${windowSql(window, `"createdAt"`)}
        GROUP BY label

        UNION ALL

        SELECT
          to_char(date_trunc(${window.bucket}, m."createdAt"), ${bucketFormat(window.bucket)}) AS label,
          COUNT(*)::int AS value
        FROM "UserOpportunityMatch" m
        JOIN "StartupOpportunity" o ON o.id = m."opportunityId"
        WHERE o."startupId" = ${startupId}
          ${windowSql(window, `m."createdAt"`)}
        GROUP BY label
      ) series
      GROUP BY label
      ORDER BY label ASC
    `;

    return chartFromRows(rows);
  }

  private async opportunityMatchChart(opportunityId: string, window: AnalyticsDateWindow) {
    const rows = await prisma.$queryRaw<ChartRow[]>`
      SELECT
        to_char(date_trunc(${window.bucket}, "createdAt"), ${bucketFormat(window.bucket)}) AS label,
        COUNT(*)::int AS value
      FROM "UserOpportunityMatch"
      WHERE "opportunityId" = ${opportunityId}
        ${windowSql(window, `"createdAt"`)}
      GROUP BY label
      ORDER BY label ASC
    `;

    return chartFromRows(rows);
  }

  private async userSignupChart(window: AnalyticsDateWindow) {
    const rows = await prisma.$queryRaw<ChartRow[]>`
      SELECT
        to_char(date_trunc(${window.bucket}, "createdAt"), ${bucketFormat(window.bucket)}) AS label,
        COUNT(*)::int AS value
      FROM "User"
      WHERE "deletedAt" IS NULL
        ${windowSql(window, `"createdAt"`)}
      GROUP BY label
      ORDER BY label ASC
    `;

    return chartFromRows(rows);
  }
}

export const analyticsRepository = new AnalyticsRepository();
