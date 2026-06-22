import type { MatchNotificationEvent } from "@/types/match.types";
import { notificationEvents } from "@/services/notifications/notification-events.service";

export interface MatchNotificationHooks {
  matchCreated(event: MatchNotificationEvent): Promise<void>;
}

export class PersistentMatchNotificationHooks implements MatchNotificationHooks {
  async matchCreated(event: MatchNotificationEvent) {
    await notificationEvents.matchCreated(event);
  }
}

export const matchNotificationHooks = new PersistentMatchNotificationHooks();
