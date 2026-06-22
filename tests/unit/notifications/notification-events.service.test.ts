import { describe, expect, it, vi } from "vitest";
import { NotificationEventsService } from "@/services/notifications/notification-events.service";

function createService() {
  const notifications = {
    create: vi.fn().mockResolvedValue({ id: "notification-1" }),
    createMany: vi.fn().mockResolvedValue({ count: 1 })
  };

  return {
    notifications,
    service: new NotificationEventsService({
      notifications: notifications as never
    })
  };
}

describe("NotificationEventsService", () => {
  it("persists match-created notifications for unique participants", async () => {
    const { service, notifications } = createService();

    await service.matchCreated({
      matchId: "match-1",
      matchType: "USER",
      participantUserIds: ["user-1", "user-2", "user-2"]
    });

    expect(notifications.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: "user-1",
        type: "MATCH_CREATED",
        metadata: expect.objectContaining({ matchId: "match-1" })
      }),
      expect.objectContaining({
        userId: "user-2",
        type: "MATCH_CREATED",
        metadata: expect.objectContaining({ matchType: "USER" })
      })
    ]);
  });

  it("does not notify the sender for new messages", async () => {
    const { service, notifications } = createService();

    await service.messageSent({
      conversationId: "conversation-1",
      messageId: "message-1",
      senderId: "user-1",
      recipientUserIds: ["user-1", "user-2"]
    });

    expect(notifications.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: "user-2",
        type: "NEW_MESSAGE",
        metadata: expect.objectContaining({
          conversationId: "conversation-1",
          messageId: "message-1",
          senderId: "user-1"
        })
      })
    ]);
  });

  it("persists application lifecycle notifications", async () => {
    const { service, notifications } = createService();

    await service.applicationReceived({
      ownerId: "owner-1",
      opportunityId: "opportunity-1",
      applicationId: "application-1",
      applicantId: "applicant-1"
    });
    await service.applicationAccepted({
      applicantId: "applicant-1",
      opportunityId: "opportunity-1",
      applicationId: "application-1"
    });
    await service.applicationRejected({
      applicantId: "applicant-2",
      opportunityId: "opportunity-1",
      applicationId: "application-2"
    });

    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: "owner-1",
      type: "APPLICATION_RECEIVED"
    }));
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: "applicant-1",
      type: "APPLICATION_ACCEPTED"
    }));
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: "applicant-2",
      type: "APPLICATION_REJECTED"
    }));
  });

  it("persists startup verification and profile milestone notifications", async () => {
    const { service, notifications } = createService();

    await service.startupVerificationApproved({
      ownerId: "owner-1",
      startupId: "startup-1",
      verificationId: "verification-1"
    });
    await service.profileMilestoneReached({
      userId: "user-1",
      milestone: "PROFILE_VIEWS",
      value: 100
    });

    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: "owner-1",
      type: "STARTUP_VERIFICATION_APPROVED"
    }));
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user-1",
      type: "PROFILE_VIEW_MILESTONE"
    }));
  });
});
