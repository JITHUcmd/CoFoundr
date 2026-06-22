import {
  analyticsRepository,
  type AnalyticsRepository
} from "@/repositories/analytics.repository";

type AnalyticsEventsServiceDeps = {
  analytics?: Pick<
    AnalyticsRepository,
    | "createProfileViewEvent"
    | "createDiscoveryAppearanceEvents"
    | "createMatchCreatedEvents"
    | "createMessageSentEvent"
  >;
};

export class AnalyticsEventsService {
  private readonly analytics: NonNullable<AnalyticsEventsServiceDeps["analytics"]>;

  constructor(deps: AnalyticsEventsServiceDeps = {}) {
    this.analytics = deps.analytics ?? analyticsRepository;
  }

  async profileViewed(event: {
    targetUserId: string;
    actorUserId?: string | null;
  }) {
    await this.analytics.createProfileViewEvent(event);
  }

  async discoveryAppearances(event: {
    actorUserId: string;
    targetUserIds?: string[];
    startupIds?: string[];
    opportunityIds?: string[];
  }) {
    await this.analytics.createDiscoveryAppearanceEvents(event);
  }

  async matchCreated(event: {
    matchId: string;
    matchType: string;
    participantUserIds: string[];
  }) {
    await this.analytics.createMatchCreatedEvents(event);
  }

  async messageSent(event: {
    senderId: string;
    conversationId: string;
    messageId: string;
  }) {
    await this.analytics.createMessageSentEvent(event);
  }
}

export const analyticsEvents = new AnalyticsEventsService();
