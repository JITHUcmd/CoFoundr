import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { AnalyticsService } from "@/services/analytics/analytics.service";

const chart = {
  labels: ["2026-06-22"],
  values: [1]
};

function createProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    name: "Arya",
    username: "arya",
    profilePhotoUrl: "https://cdn.example/avatar.png",
    headline: "Founder",
    bio: "Building",
    country: "India",
    state: "Kerala",
    city: "Kochi",
    status: "ACTIVELY_LOOKING",
    availability: "FULL_TIME",
    skills: [{ skillId: "skill-1" }],
    industries: [{ industryId: "industry-1" }],
    interests: [{ interestId: "interest-1" }],
    experiences: [{ id: "experience-1" }],
    education: [{ id: "education-1" }],
    communityMemberships: [{ communityId: "community-1" }],
    portfolioLinks: [{ id: "portfolio-1" }],
    reputation: {
      builderScore: 81,
      trustScore: 76,
      collaborationScore: 88
    },
    ...overrides
  };
}

function createStartup(overrides: Record<string, unknown> = {}) {
  return {
    id: "startup-1",
    ownerId: "owner-1",
    verificationStatus: "VERIFIED",
    teamSize: 4,
    profileViewsCount: 100,
    followersCount: 12,
    savesCount: 8,
    applicationsCount: 5,
    members: [{ id: "member-1" }, { id: "member-2" }],
    opportunities: [{ id: "opportunity-1" }],
    ...overrides
  };
}

function createOpportunity(overrides: Record<string, unknown> = {}) {
  return {
    id: "opportunity-1",
    startupId: "startup-1",
    viewsCount: 80,
    savesCount: 10,
    applicationsCount: 6,
    startup: {
      ownerId: "owner-1"
    },
    ...overrides
  };
}

function createRepository(overrides: Record<string, unknown> = {}) {
  return {
    findUserProfile: vi.fn().mockResolvedValue(createProfile()),
    getUserMetrics: vi.fn().mockResolvedValue({
      profileViews: 7,
      discoveryAppearances: 0,
      rightSwipesReceived: 4,
      superLikesReceived: 2,
      matches: 3,
      messagesSent: 8,
      messagesReceived: 10
    }),
    getUserCharts: vi.fn().mockResolvedValue({
      profileViews: chart,
      matches: chart,
      messagesSent: chart
    }),
    findStartupForAnalytics: vi.fn().mockResolvedValue(createStartup()),
    getStartupMetrics: vi.fn().mockResolvedValue({
      views: 12,
      saves: 5,
      applications: 3,
      matches: 2,
      joined: 1
    }),
    getStartupCharts: vi.fn().mockResolvedValue({
      views: chart,
      applications: chart,
      matches: chart
    }),
    findOpportunityForAnalytics: vi.fn().mockResolvedValue(createOpportunity()),
    getOpportunityMetrics: vi.fn().mockResolvedValue({
      views: 20,
      saves: 6,
      applications: 5,
      acceptedApplications: 2,
      rejectedApplications: 1,
      matches: 2
    }),
    getOpportunityCharts: vi.fn().mockResolvedValue({
      views: chart,
      applications: chart,
      matches: chart
    }),
    getPlatformTotals: vi.fn().mockResolvedValue({
      totalUsers: 100,
      activeUsers: 80,
      totalStartups: 20,
      totalOpportunities: 30,
      totalMatches: 12,
      totalMessages: 300,
      totalApplications: 40
    }),
    getPlatformGrowth: vi.fn().mockResolvedValue({
      daily: chart,
      weekly: chart,
      monthly: chart
    }),
    ...overrides
  };
}

function createService(overrides: Record<string, unknown> = {}) {
  const analytics = createRepository(overrides);

  return {
    analytics,
    service: new AnalyticsService({
      analytics: analytics as never
    })
  };
}

describe("AnalyticsService", () => {
  it("returns current-user analytics with profile completion and response rate", async () => {
    const { service } = createService();

    const analytics = await service.getUserAnalytics("user-1", "30d");

    expect(analytics).toMatchObject({
      range: "30d",
      profileViews: 7,
      rightSwipesReceived: 4,
      superLikesReceived: 2,
      matches: 3,
      messagesSent: 8,
      messagesReceived: 10,
      responseRate: 80,
      profileCompletion: 100,
      consistencyScore: 88,
      trustScore: 76,
      builderScore: 81
    });
    expect(analytics.charts.profileViews).toEqual(chart);
  });

  it("clamps response rate to 100 percent", async () => {
    const { service } = createService({
      getUserMetrics: vi.fn().mockResolvedValue({
        profileViews: 7,
        discoveryAppearances: 0,
        rightSwipesReceived: 4,
        superLikesReceived: 2,
        matches: 3,
        messagesSent: 12,
        messagesReceived: 3
      })
    });

    const analytics = await service.getUserAnalytics("user-1", "30d");

    expect(analytics.responseRate).toBe(100);
  });

  it("rejects user analytics when the active profile is missing", async () => {
    const { service } = createService({
      findUserProfile: vi.fn().mockResolvedValue(null)
    });

    await expect(service.getUserAnalytics("user-1", "7d")).rejects.toBeInstanceOf(AppError);
  });

  it("returns startup analytics only for startup owners", async () => {
    const { service } = createService();

    const analytics = await service.getStartupAnalytics("owner-1", "startup-1", "30d");

    expect(analytics).toMatchObject({
      startupId: "startup-1",
      startupViews: 12,
      followers: 12,
      saves: 5,
      applications: 3,
      matches: 2,
      verificationStatus: "VERIFIED",
      teamSize: 4,
      activeOpportunities: 1,
      hiringFunnel: {
        viewed: 12,
        saved: 5,
        applied: 3,
        matched: 2,
        joined: 1
      },
      hiringFunnelPercentages: {
        viewedToSaved: 42,
        savedToApplied: 60,
        appliedToMatched: 67,
        matchedToJoined: 50,
        viewedToJoined: 8
      }
    });
  });

  it("rejects startup analytics for non-owners", async () => {
    const { service } = createService();

    await expect(
      service.getStartupAnalytics("user-2", "startup-1", "30d")
    ).rejects.toBeInstanceOf(AppError);
  });

  it("returns opportunity analytics only for startup owners", async () => {
    const { service } = createService();

    const analytics = await service.getOpportunityAnalytics("owner-1", "opportunity-1", "30d");

    expect(analytics).toMatchObject({
      opportunityId: "opportunity-1",
      views: 20,
      saves: 6,
      applications: 5,
      acceptedApplications: 2,
      rejectedApplications: 1,
      matches: 2,
      conversionRate: 40
    });
  });

  it("clamps opportunity conversion rate to 100 percent", async () => {
    const { service } = createService({
      getOpportunityMetrics: vi.fn().mockResolvedValue({
        views: 20,
        saves: 6,
        applications: 2,
        acceptedApplications: 2,
        rejectedApplications: 1,
        matches: 5
      })
    });

    const analytics = await service.getOpportunityAnalytics("owner-1", "opportunity-1", "30d");

    expect(analytics.conversionRate).toBe(100);
  });

  it("rejects opportunity analytics for non-owners", async () => {
    const { service } = createService();

    await expect(
      service.getOpportunityAnalytics("user-2", "opportunity-1", "30d")
    ).rejects.toBeInstanceOf(AppError);
  });

  it("returns platform analytics for admin routes", async () => {
    const { service } = createService();

    const analytics = await service.getAdminPlatformAnalytics("90d");

    expect(analytics).toMatchObject({
      range: "90d",
      totals: {
        totalUsers: 100,
        activeUsers: 80,
        totalStartups: 20,
        totalOpportunities: 30,
        totalMatches: 12,
        totalMessages: 300,
        totalApplications: 40
      },
      growth: {
        daily: chart,
        weekly: chart,
        monthly: chart
      }
    });
  });
});
