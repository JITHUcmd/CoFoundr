import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { DiscoveryService } from "@/services/discovery/discovery.service";

const currentUser = {
  id: "user-1",
  country: "India",
  state: "Kerala",
  city: "Kochi",
  status: "ACTIVELY_LOOKING",
  availability: "FULL_TIME",
  skills: [
    {
      skillId: "skill-1",
      yearsExperience: 4,
      skill: {
        name: "TypeScript",
        slug: "typescript"
      }
    }
  ],
  industries: [
    {
      industryId: "industry-1",
      industry: {
        name: "SaaS",
        slug: "saas"
      }
    }
  ],
  founderVision: {
    startupGoal: "BOOTSTRAPPED_SAAS",
    fundingPreference: "BOOTSTRAPPED",
    riskAppetite: "MEDIUM",
    commitmentLevel: "FULL_TIME",
    workStyle: "REMOTE",
    preferredTeamSize: 3,
    preferredCoFounderType: "Technical",
    remotePreference: "REMOTE"
  },
  reputation: {
    builderScore: 70,
    trustScore: 80,
    collaborationScore: 90
  }
};

function createUserCandidate(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-2",
    username: "maya",
    name: "Maya",
    profilePhotoUrl: null,
    headline: "Builder",
    bio: "Building useful products.",
    country: "India",
    state: "Kerala",
    city: "Kochi",
    status: "ACTIVELY_LOOKING",
    availability: "FULL_TIME",
    createdAt: new Date(),
    skills: currentUser.skills,
    industries: currentUser.industries,
    interests: [],
    communityMemberships: [],
    founderVision: currentUser.founderVision,
    reputation: currentUser.reputation,
    ...overrides
  };
}

function createStartupCandidate(overrides: Record<string, unknown> = {}) {
  return {
    id: "startup-1",
    name: "CoFoundr Labs",
    slug: "cofoundr-labs",
    logoUrl: null,
    coverImageUrl: null,
    tagline: "Founder discovery",
    description: "A startup.",
    website: null,
    foundedDate: null,
    teamSize: 3,
    country: "India",
    state: "Kerala",
    city: "Kochi",
    remoteAllowed: true,
    workStyle: "REMOTE",
    startupStage: "MVP",
    fundingStage: "BOOTSTRAPPED",
    hiringStatus: "HIRING",
    openRolesCount: 2,
    equityAvailable: true,
    salaryAvailable: false,
    profileViewsCount: 10,
    followersCount: 5,
    savesCount: 2,
    applicationsCount: 1,
    createdAt: new Date(),
    industry: {
      id: "industry-1",
      name: "SaaS",
      slug: "saas"
    },
    members: [],
    ...overrides
  };
}

function createDiscoveryRepository(overrides: Record<string, unknown> = {}) {
  return {
    findCurrentUserContext: vi.fn().mockResolvedValue(currentUser),
    findBlockedUserIds: vi.fn().mockResolvedValue([]),
    areUsersBlocked: vi.fn().mockResolvedValue(false),
    findUserDiscoveryCandidates: vi.fn().mockResolvedValue({
      items: [createUserCandidate()],
      nextCursor: null
    }),
    findStartupDiscoveryCandidates: vi.fn().mockResolvedValue({
      items: [createStartupCandidate()],
      nextCursor: null
    }),
    findOpportunityDiscoveryCandidates: vi.fn().mockResolvedValue({
      items: [],
      nextCursor: null
    }),
    findUserForSwipe: vi.fn().mockResolvedValue({ id: "user-2", deletedAt: null, status: "ACTIVELY_LOOKING" }),
    findStartupForSwipe: vi.fn().mockResolvedValue({ id: "startup-1", ownerId: "owner-1", archivedAt: null }),
    findOpportunityForSwipe: vi.fn().mockResolvedValue({
      id: "opportunity-1",
      status: "OPEN",
      closedAt: null,
      startup: {
        ownerId: "owner-1",
        archivedAt: null
      }
    }),
    hasUserSwipe: vi.fn().mockResolvedValue(false),
    hasStartupSwipe: vi.fn().mockResolvedValue(false),
    hasOpportunitySwipe: vi.fn().mockResolvedValue(false),
    createUserSwipe: vi.fn().mockResolvedValue({ id: "swipe-1", action: "RIGHT", createdAt: new Date() }),
    createStartupSwipe: vi.fn().mockResolvedValue({ id: "swipe-2", action: "LEFT", createdAt: new Date() }),
    createOpportunitySwipe: vi.fn().mockResolvedValue({ id: "swipe-3", action: "SUPER_LIKE", createdAt: new Date() }),
    findUserForCompatibility: vi.fn().mockResolvedValue(createUserCandidate()),
    findStartupForCompatibility: vi.fn().mockResolvedValue(createStartupCandidate()),
    ...overrides
  };
}

function createService(repositoryOverrides: Record<string, unknown> = {}) {
  const discovery = createDiscoveryRepository(repositoryOverrides);
  const analytics = {
    discoveryAppearances: vi.fn().mockResolvedValue(undefined)
  };

  return {
    discovery,
    analytics,
    service: new DiscoveryService({
      discovery: discovery as never,
      analytics
    })
  };
}

describe("DiscoveryService", () => {
  it("returns ranked public-safe user discovery results", async () => {
    const { service, analytics } = createService();

    const feed = await service.getRecommendedUsers("user-1", { limit: 20 });

    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]).toMatchObject({
      id: "user-2",
      username: "maya",
      compatibility: {
        skillsScore: 100,
        locationScore: 100
      }
    });
    expect(feed.items[0]).not.toHaveProperty("createdAt");
    expect(feed.items[0]).not.toHaveProperty("founderVision");
    expect(analytics.discoveryAppearances).toHaveBeenCalledWith({
      actorUserId: "user-1",
      targetUserIds: ["user-2"]
    });
  });

  it("prevents duplicate user swipes", async () => {
    const { service } = createService({
      hasUserSwipe: vi.fn().mockResolvedValue(true)
    });

    await expect(
      service.swipeUser("user-1", {
        targetId: "user-2",
        action: "RIGHT"
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects user swipes with startup context the swiper does not own", async () => {
    const { service, discovery } = createService({
      findStartupForSwipe: vi.fn().mockResolvedValue({ id: "startup-1", ownerId: "owner-1", archivedAt: null })
    });

    await expect(
      service.swipeUser("user-1", {
        targetId: "user-2",
        action: "RIGHT",
        startupId: "startup-1"
      })
    ).rejects.toBeInstanceOf(AppError);

    expect(discovery.createUserSwipe).not.toHaveBeenCalled();
  });

  it("prevents swiping owned startups", async () => {
    const { service } = createService({
      findStartupForSwipe: vi.fn().mockResolvedValue({ id: "startup-1", ownerId: "user-1", archivedAt: null })
    });

    await expect(
      service.swipeStartup("user-1", {
        targetId: "startup-1",
        action: "LEFT"
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects startup swipes when the startup is not visible", async () => {
    const { service } = createService({
      findStartupForSwipe: vi.fn().mockResolvedValue(null)
    });

    await expect(
      service.swipeStartup("user-1", {
        targetId: "startup-1",
        action: "RIGHT"
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects opportunity swipes when the opportunity is not visible", async () => {
    const { service } = createService({
      findOpportunityForSwipe: vi.fn().mockResolvedValue(null)
    });

    await expect(
      service.swipeOpportunity("user-1", {
        targetId: "opportunity-1",
        action: "RIGHT"
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("creates opportunity swipes after ownership and duplicate checks pass", async () => {
    const { service, discovery } = createService();

    await service.swipeOpportunity("user-1", {
      targetId: "opportunity-1",
      action: "SUPER_LIKE"
    });

    expect(discovery.createOpportunitySwipe).toHaveBeenCalledWith("user-1", "opportunity-1", "SUPER_LIKE");
  });

  it("keeps compatibility scores within the valid range", async () => {
    const { service } = createService();

    const compatibility = await service.getStartupCompatibility("user-1", "startup-1");

    expect(compatibility.overallScore).toBeGreaterThanOrEqual(0);
    expect(compatibility.overallScore).toBeLessThanOrEqual(100);
  });
});
