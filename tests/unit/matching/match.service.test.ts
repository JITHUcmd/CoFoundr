import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { MatchService } from "@/services/matching/match.service";

const now = new Date();

function createContext(id: string) {
  return {
    id,
    country: "India",
    state: "Kerala",
    city: "Kochi",
    skills: [{ skillId: "skill-1" }],
    industries: [{ industryId: "industry-1" }],
    founderVision: {
      startupGoal: "BOOTSTRAPPED_SAAS",
      fundingPreference: "BOOTSTRAPPED",
      riskAppetite: "MEDIUM",
      commitmentLevel: "FULL_TIME",
      workStyle: "REMOTE",
      remotePreference: "REMOTE"
    },
    reputation: {
      builderScore: 70,
      trustScore: 80,
      collaborationScore: 90
    }
  };
}

function scoreFields() {
  return {
    matchScore: 90,
    compatibilityScore: 90,
    skillsScore: 100,
    founderVisionScore: 100,
    locationScore: 100,
    consistencyScore: 90,
    trustScore: 80,
    builderScore: 70
  };
}

function createUserMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: "match-1",
    status: "ACTIVE",
    createdAt: now,
    archivedAt: null,
    blockedAt: null,
    ...scoreFields(),
    userA: {
      id: "user-1",
      username: "arya",
      name: "Arya",
      profilePhotoUrl: null,
      headline: "Founder"
    },
    userB: {
      id: "user-2",
      username: "maya",
      name: "Maya",
      profilePhotoUrl: null,
      headline: "Builder"
    },
    ...overrides
  };
}

function createStartupMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: "startup-match-1",
    status: "ACTIVE",
    createdAt: now,
    archivedAt: null,
    blockedAt: null,
    ...scoreFields(),
    user: {
      id: "user-2",
      username: "maya",
      name: "Maya",
      profilePhotoUrl: null,
      headline: "Builder"
    },
    startup: {
      id: "startup-1",
      slug: "cofoundr-labs",
      name: "CoFoundr Labs",
      logoUrl: null,
      tagline: "Founder discovery",
      ownerId: "owner-1"
    },
    ...overrides
  };
}

function createOpportunityMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: "opportunity-match-1",
    status: "ACTIVE",
    createdAt: now,
    archivedAt: null,
    blockedAt: null,
    ...scoreFields(),
    user: {
      id: "user-2",
      username: "maya",
      name: "Maya",
      profilePhotoUrl: null,
      headline: "Builder"
    },
    opportunity: {
      id: "opportunity-1",
      roleName: "Technical Co-Founder",
      opportunityType: "TECHNICAL_CO_FOUNDER",
      status: "OPEN",
      startup: {
        id: "startup-1",
        slug: "cofoundr-labs",
        name: "CoFoundr Labs",
        logoUrl: null,
        ownerId: "owner-1"
      }
    },
    ...overrides
  };
}

function createRepository(overrides: Record<string, unknown> = {}) {
  return {
    findVisibleUserContext: vi.fn((userId: string) => Promise.resolve(createContext(userId))),
    areUsersBlocked: vi.fn().mockResolvedValue(false),
    hasPositiveUserSwipe: vi.fn().mockResolvedValue(true),
    hasPositiveStartupSwipe: vi.fn().mockResolvedValue(true),
    hasPositiveOpportunitySwipe: vi.fn().mockResolvedValue(true),
    findVisibleStartup: vi.fn().mockResolvedValue({ id: "startup-1", ownerId: "owner-1" }),
    listStartupInterests: vi.fn().mockResolvedValue([{
      id: "startup-interest-1",
      action: "RIGHT",
      createdAt: now,
      swiper: {
        id: "user-2",
        username: "maya",
        name: "Maya",
        profilePhotoUrl: null,
        headline: "Builder"
      }
    }]),
    findVisibleOpportunity: vi.fn().mockResolvedValue({ id: "opportunity-1", startup: { ownerId: "owner-1" } }),
    listOpportunityInterests: vi.fn().mockResolvedValue([{
      id: "interest-1",
      action: "RIGHT",
      createdAt: now,
      swiper: {
        id: "user-2",
        username: "maya",
        name: "Maya",
        profilePhotoUrl: null,
        headline: "Builder"
      }
    }]),
    findStartupReadyForOwnerSwipe: vi.fn().mockResolvedValue({ id: "startup-1", ownerId: "owner-1" }),
    findAcceptedApplication: vi.fn().mockResolvedValue({
      id: "application-1",
      applicantId: "user-2",
      opportunityId: "opportunity-1",
      opportunity: {
        startup: {
          ownerId: "owner-1"
        }
      }
    }),
    findUserMatch: vi.fn().mockResolvedValue(null),
    createUserMatch: vi.fn().mockResolvedValue(createUserMatch()),
    findStartupMatch: vi.fn().mockResolvedValue(null),
    createStartupMatch: vi.fn().mockResolvedValue(createStartupMatch()),
    findOpportunityMatch: vi.fn().mockResolvedValue(null),
    createOpportunityMatch: vi.fn().mockResolvedValue(createOpportunityMatch()),
    listUserMatches: vi.fn().mockResolvedValue([createUserMatch()]),
    listStartupMatches: vi.fn().mockResolvedValue([createStartupMatch()]),
    listOpportunityMatches: vi.fn().mockResolvedValue([createOpportunityMatch()]),
    findMatchByIdForUser: vi.fn().mockResolvedValue({ type: "USER", match: createUserMatch() }),
    updateMatchStatusForUser: vi.fn().mockResolvedValue({ type: "USER", match: createUserMatch({ status: "ARCHIVED" }) }),
    ...overrides
  };
}

function createService(overrides: Record<string, unknown> = {}) {
  const matches = createRepository(overrides);
  const notifications = {
    matchCreated: vi.fn().mockResolvedValue(undefined)
  };
  const analytics = {
    matchCreated: vi.fn().mockResolvedValue(undefined)
  };
  const conversations = {
    getOrCreateConversationForMatch: vi.fn().mockResolvedValue({ id: "conversation-1" })
  };

  return {
    matches,
    notifications,
    analytics,
    conversations,
    service: new MatchService({
      matches: matches as never,
      notifications,
      conversations,
      analytics
    })
  };
}

describe("MatchService", () => {
  it("creates user matches only after reciprocal positive swipes", async () => {
    const { service, matches, notifications, conversations, analytics } = createService();

    const match = await service.createUserMatchFromSwipe("user-1", "user-2");

    expect(match).toMatchObject({
      id: "match-1",
      type: "USER",
      scores: {
        compatibilityScore: 90
      }
    });
    expect(matches.createUserMatch).toHaveBeenCalled();
    expect(conversations.getOrCreateConversationForMatch).toHaveBeenCalledWith({
      type: "USER",
      matchId: "match-1",
      participantUserIds: ["user-1", "user-2"]
    });
    expect(notifications.matchCreated).toHaveBeenCalledWith({
      matchId: "match-1",
      matchType: "USER",
      participantUserIds: ["user-1", "user-2"]
    });
    expect(analytics.matchCreated).toHaveBeenCalledWith({
      matchId: "match-1",
      matchType: "USER",
      participantUserIds: ["user-1", "user-2"]
    });
  });

  it("does not create duplicate user matches", async () => {
    const { service, matches } = createService({
      findUserMatch: vi.fn().mockResolvedValue(createUserMatch())
    });

    const match = await service.createUserMatchFromSwipe("user-1", "user-2");

    expect(match).toMatchObject({ id: "match-1" });
    expect(matches.createUserMatch).not.toHaveBeenCalled();
  });

  it("does not match blocked users", async () => {
    const { service, matches } = createService({
      areUsersBlocked: vi.fn().mockResolvedValue(true)
    });

    const match = await service.createUserMatchFromSwipe("user-1", "user-2");

    expect(match).toBeNull();
    expect(matches.createUserMatch).not.toHaveBeenCalled();
  });

  it("keeps startup RIGHT swipes as owner-reviewed interest", async () => {
    const { service, matches } = createService();

    const match = await service.createStartupMatchFromStartupSwipe("user-2", "startup-1");

    expect(match).toBeNull();
    expect(matches.createStartupMatch).not.toHaveBeenCalled();
  });

  it("lists startup interests for the owning startup user", async () => {
    const { service, matches } = createService();

    const interests = await service.listStartupInterests("owner-1", "startup-1");

    expect(interests).toEqual([{
      id: "startup-interest-1",
      action: "RIGHT",
      createdAt: now,
      user: {
        id: "user-2",
        username: "maya",
        name: "Maya",
        profilePhotoUrl: null,
        headline: "Builder"
      }
    }]);
    expect(matches.listStartupInterests).toHaveBeenCalledWith("startup-1");
  });

  it("creates startup matches when owners accept startup interest", async () => {
    const { service, matches, notifications, conversations } = createService();

    const match = await service.acceptStartupInterest("owner-1", "startup-1", "user-2");

    expect(match).toMatchObject({
      id: "startup-match-1",
      type: "STARTUP",
      startup: {
        id: "startup-1"
      }
    });
    expect(matches.createStartupMatch).toHaveBeenCalledWith(
      "user-2",
      "startup-1",
      "owner-1",
      expect.objectContaining({
        compatibilityScore: 90
      })
    );
    expect(conversations.getOrCreateConversationForMatch).toHaveBeenCalledWith({
      type: "STARTUP",
      matchId: "startup-match-1",
      participantUserIds: ["user-2", "owner-1"]
    });
    expect(notifications.matchCreated).toHaveBeenCalledWith({
      matchId: "startup-match-1",
      matchType: "STARTUP",
      participantUserIds: ["user-2", "owner-1"]
    });
  });

  it("creates one explicit startup match from an owner user swipe", async () => {
    const { service, matches } = createService();

    const match = await service.createStartupMatchFromOwnerUserSwipe("owner-1", "user-2", "startup-1");

    expect(match).toMatchObject({
      id: "startup-match-1",
      type: "STARTUP",
      startup: {
        id: "startup-1"
      }
    });
    expect(matches.findStartupReadyForOwnerSwipe).toHaveBeenCalledWith("owner-1", "user-2", "startup-1");
    expect(matches.createStartupMatch).toHaveBeenCalledTimes(1);
  });

  it("does not create startup matches without a matching explicit startup context", async () => {
    const { service, matches } = createService({
      findStartupReadyForOwnerSwipe: vi.fn().mockResolvedValue(null)
    });

    const match = await service.createStartupMatchFromOwnerUserSwipe("owner-1", "user-2", "startup-2");

    expect(match).toBeNull();
    expect(matches.createStartupMatch).not.toHaveBeenCalled();
  });

  it("creates opportunity matches from accepted applications", async () => {
    const { service, matches } = createService();

    const match = await service.createOpportunityMatchFromAcceptedApplication("application-1", "owner-1");

    expect(match).toMatchObject({
      id: "opportunity-match-1",
      type: "OPPORTUNITY"
    });
    expect(matches.createOpportunityMatch).toHaveBeenCalled();
  });

  it("keeps opportunity RIGHT swipes as owner-reviewed interest", async () => {
    const { service, matches } = createService();

    const match = await service.createOpportunityMatchFromOpportunitySwipe("user-2", "opportunity-1");

    expect(match).toBeNull();
    expect(matches.createOpportunityMatch).not.toHaveBeenCalled();
  });

  it("lists opportunity interests for the owning startup user", async () => {
    const { service, matches } = createService();

    const interests = await service.listOpportunityInterests("owner-1", "opportunity-1");

    expect(interests).toEqual([{
      id: "interest-1",
      action: "RIGHT",
      createdAt: now,
      user: {
        id: "user-2",
        username: "maya",
        name: "Maya",
        profilePhotoUrl: null,
        headline: "Builder"
      }
    }]);
    expect(matches.listOpportunityInterests).toHaveBeenCalledWith("opportunity-1");
  });

  it("creates opportunity matches when owners accept swipe interest", async () => {
    const { service, matches, notifications, conversations } = createService();

    const match = await service.acceptOpportunityInterest("owner-1", "opportunity-1", "user-2");

    expect(match).toMatchObject({
      id: "opportunity-match-1",
      type: "OPPORTUNITY"
    });
    expect(matches.createOpportunityMatch).toHaveBeenCalledWith(
      "user-2",
      "opportunity-1",
      "owner-1",
      expect.objectContaining({
        compatibilityScore: 90
      })
    );
    expect(conversations.getOrCreateConversationForMatch).toHaveBeenCalledWith({
      type: "OPPORTUNITY",
      matchId: "opportunity-match-1",
      participantUserIds: ["user-2", "owner-1"]
    });
    expect(notifications.matchCreated).toHaveBeenCalledWith({
      matchId: "opportunity-match-1",
      matchType: "OPPORTUNITY",
      participantUserIds: ["user-2", "owner-1"]
    });
  });

  it("rejects opportunity interest acceptance by non-owners", async () => {
    const { service, matches } = createService();

    await expect(service.acceptOpportunityInterest("other-owner", "opportunity-1", "user-2"))
      .rejects.toBeInstanceOf(AppError);
    expect(matches.createOpportunityMatch).not.toHaveBeenCalled();
  });

  it("does not create duplicate opportunity matches from accepted interest", async () => {
    const { service, matches } = createService({
      findOpportunityMatch: vi.fn().mockResolvedValue(createOpportunityMatch())
    });

    const match = await service.acceptOpportunityInterest("owner-1", "opportunity-1", "user-2");

    expect(match).toMatchObject({ id: "opportunity-match-1" });
    expect(matches.createOpportunityMatch).not.toHaveBeenCalled();
  });

  it("enforces participant authorization when reading a match", async () => {
    const { service } = createService({
      findMatchByIdForUser: vi.fn().mockResolvedValue(null)
    });

    await expect(service.getMatch("user-1", "match-1")).rejects.toBeInstanceOf(AppError);
  });

  it("archives active matches for participants", async () => {
    const { service, matches } = createService();

    const match = await service.archiveMatch("user-1", "match-1");

    expect(match).toMatchObject({
      id: "match-1",
      status: "ARCHIVED"
    });
    expect(matches.updateMatchStatusForUser).toHaveBeenCalledWith("match-1", "user-1", "ARCHIVED");
  });

  it("blocks active matches for participants", async () => {
    const { service, matches } = createService({
      updateMatchStatusForUser: vi.fn().mockResolvedValue({
        type: "USER",
        match: createUserMatch({ status: "BLOCKED" })
      })
    });

    const match = await service.blockMatch("user-1", "match-1");

    expect(match).toMatchObject({
      id: "match-1",
      status: "BLOCKED"
    });
    expect(matches.updateMatchStatusForUser).toHaveBeenCalledWith("match-1", "user-1", "BLOCKED");
  });
});
