import { describe, expect, it, vi } from "vitest";
import { AnalyticsEventsService } from "@/services/analytics/analytics-events.service";

function createService() {
  const analytics = {
    createProfileViewEvent: vi.fn().mockResolvedValue({ id: 1 }),
    createDiscoveryAppearanceEvents: vi.fn().mockResolvedValue({ count: 1 }),
    createMatchCreatedEvents: vi.fn().mockResolvedValue({ count: 1 }),
    createMessageSentEvent: vi.fn().mockResolvedValue({ id: 1 })
  };

  return {
    analytics,
    service: new AnalyticsEventsService({
      analytics: analytics as never
    })
  };
}

describe("AnalyticsEventsService", () => {
  it("records profile views", async () => {
    const { service, analytics } = createService();

    await service.profileViewed({
      actorUserId: "viewer-1",
      targetUserId: "user-1"
    });

    expect(analytics.createProfileViewEvent).toHaveBeenCalledWith({
      actorUserId: "viewer-1",
      targetUserId: "user-1"
    });
  });

  it("records discovery appearances", async () => {
    const { service, analytics } = createService();

    await service.discoveryAppearances({
      actorUserId: "viewer-1",
      targetUserIds: ["user-1"],
      startupIds: ["startup-1"],
      opportunityIds: ["opportunity-1"]
    });

    expect(analytics.createDiscoveryAppearanceEvents).toHaveBeenCalledWith({
      actorUserId: "viewer-1",
      targetUserIds: ["user-1"],
      startupIds: ["startup-1"],
      opportunityIds: ["opportunity-1"]
    });
  });

  it("records match and message events", async () => {
    const { service, analytics } = createService();

    await service.matchCreated({
      matchId: "match-1",
      matchType: "USER",
      participantUserIds: ["user-1", "user-2"]
    });
    await service.messageSent({
      senderId: "user-1",
      conversationId: "conversation-1",
      messageId: "message-1"
    });

    expect(analytics.createMatchCreatedEvents).toHaveBeenCalledWith({
      matchId: "match-1",
      matchType: "USER",
      participantUserIds: ["user-1", "user-2"]
    });
    expect(analytics.createMessageSentEvent).toHaveBeenCalledWith({
      senderId: "user-1",
      conversationId: "conversation-1",
      messageId: "message-1"
    });
  });
});
