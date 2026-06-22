import type { NotificationType, Prisma } from "@prisma/client";
import {
  notificationRepository,
  type NotificationRepository
} from "@/repositories/notification.repository";
import type { NotificationCreateInput } from "@/types/notification.types";

type NotificationEventsDeps = {
  notifications?: Pick<NotificationRepository, "create" | "createMany">;
};

type BaseMetadata = Record<string, string | number | boolean | null>;

function uniqueUserIds(userIds: string[]) {
  return [...new Set(userIds.filter(Boolean))];
}

function notification(
  userId: string,
  type: NotificationType,
  title: string,
  content: string,
  metadata: BaseMetadata
): NotificationCreateInput {
  return {
    userId,
    type,
    title,
    content,
    metadata: metadata as Prisma.InputJsonObject
  };
}

export class NotificationEventsService {
  private readonly notifications: Pick<NotificationRepository, "create" | "createMany">;

  constructor(deps: NotificationEventsDeps = {}) {
    this.notifications = deps.notifications ?? notificationRepository;
  }

  async matchCreated(event: {
    matchId: string;
    matchType: string;
    participantUserIds: string[];
  }) {
    const items = uniqueUserIds(event.participantUserIds).map((userId) => notification(
      userId,
      "MATCH_CREATED",
      "New match",
      "You have a new match on CoFoundr.",
      {
        matchId: event.matchId,
        matchType: event.matchType
      }
    ));

    await this.notifications.createMany(items);
  }

  async messageSent(event: {
    conversationId: string;
    messageId: string;
    senderId: string;
    recipientUserIds: string[];
  }) {
    const recipients = uniqueUserIds(event.recipientUserIds).filter((userId) => userId !== event.senderId);
    const items = recipients.map((userId) => notification(
      userId,
      "NEW_MESSAGE",
      "New message",
      "You received a new message.",
      {
        conversationId: event.conversationId,
        messageId: event.messageId,
        senderId: event.senderId
      }
    ));

    await this.notifications.createMany(items);
  }

  async applicationReceived(event: {
    ownerId: string;
    opportunityId: string;
    applicationId: string;
    applicantId: string;
  }) {
    await this.notifications.create(notification(
      event.ownerId,
      "APPLICATION_RECEIVED",
      "New application",
      "A candidate applied to your opportunity.",
      {
        opportunityId: event.opportunityId,
        applicationId: event.applicationId,
        applicantId: event.applicantId
      }
    ));
  }

  async applicationAccepted(event: {
    applicantId: string;
    opportunityId: string;
    applicationId: string;
  }) {
    await this.notifications.create(notification(
      event.applicantId,
      "APPLICATION_ACCEPTED",
      "Application accepted",
      "Your application was accepted.",
      {
        opportunityId: event.opportunityId,
        applicationId: event.applicationId
      }
    ));
  }

  async applicationRejected(event: {
    applicantId: string;
    opportunityId: string;
    applicationId: string;
  }) {
    await this.notifications.create(notification(
      event.applicantId,
      "APPLICATION_REJECTED",
      "Application rejected",
      "Your application was not selected.",
      {
        opportunityId: event.opportunityId,
        applicationId: event.applicationId
      }
    ));
  }

  async superlikeReceived(event: {
    userId: string;
    actorUserId: string;
    targetType: string;
    targetId: string;
  }) {
    await this.notifications.create(notification(
      event.userId,
      "SUPERLIKE_RECEIVED",
      "Superlike received",
      "Someone superliked you on CoFoundr.",
      {
        actorUserId: event.actorUserId,
        targetType: event.targetType,
        targetId: event.targetId
      }
    ));
  }

  async startupVerificationRequested(event: {
    ownerId: string;
    startupId: string;
    verificationId?: string | null;
  }) {
    await this.startupVerificationUpdated({
      userId: event.ownerId,
      startupId: event.startupId,
      verificationId: event.verificationId ?? null,
      type: "STARTUP_VERIFICATION_REQUESTED",
      title: "Verification requested",
      content: "Your startup verification request was received."
    });
  }

  async startupVerificationApproved(event: {
    ownerId: string;
    startupId: string;
    verificationId?: string | null;
  }) {
    await this.startupVerificationUpdated({
      userId: event.ownerId,
      startupId: event.startupId,
      verificationId: event.verificationId ?? null,
      type: "STARTUP_VERIFICATION_APPROVED",
      title: "Verification approved",
      content: "Your startup verification was approved."
    });
  }

  async startupVerificationRejected(event: {
    ownerId: string;
    startupId: string;
    verificationId?: string | null;
  }) {
    await this.startupVerificationUpdated({
      userId: event.ownerId,
      startupId: event.startupId,
      verificationId: event.verificationId ?? null,
      type: "STARTUP_VERIFICATION_REJECTED",
      title: "Verification rejected",
      content: "Your startup verification was rejected."
    });
  }

  async startupVerificationUpdated(event: {
    userId: string;
    startupId: string;
    verificationId?: string | null;
    type: Extract<
      NotificationType,
      | "STARTUP_VERIFICATION_REQUESTED"
      | "STARTUP_VERIFICATION_APPROVED"
      | "STARTUP_VERIFICATION_REJECTED"
    >;
    title: string;
    content: string;
  }) {
    await this.notifications.create(notification(
      event.userId,
      event.type,
      event.title,
      event.content,
      {
        startupId: event.startupId,
        verificationId: event.verificationId ?? null
      }
    ));
  }

  async profileMilestoneReached(event: {
    userId: string;
    milestone: string;
    value: number;
  }) {
    await this.notifications.create(notification(
      event.userId,
      "PROFILE_VIEW_MILESTONE",
      "Profile milestone reached",
      "Your profile reached a new milestone.",
      {
        milestone: event.milestone,
        value: event.value
      }
    ));
  }

  async system(event: {
    userId: string;
    title: string;
    content: string;
    metadata?: BaseMetadata;
  }) {
    await this.notifications.create(notification(
      event.userId,
      "SYSTEM",
      event.title,
      event.content,
      event.metadata ?? {}
    ));
  }
}

export const notificationEvents = new NotificationEventsService();
