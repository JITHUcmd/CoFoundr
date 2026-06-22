import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { NotificationService } from "@/services/notifications/notification.service";

const now = new Date();

function createNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: "notification-1",
    userId: "user-1",
    type: "MATCH_CREATED",
    title: "New match",
    content: "You have a new match.",
    metadata: { matchId: "match-1" },
    isRead: false,
    readAt: null,
    createdAt: now,
    ...overrides
  };
}

function createRepository(overrides: Record<string, unknown> = {}) {
  return {
    create: vi.fn().mockResolvedValue(createNotification()),
    createMany: vi.fn().mockResolvedValue({ count: 1 }),
    listForUser: vi.fn().mockResolvedValue([createNotification()]),
    findByIdForUser: vi.fn().mockResolvedValue(createNotification()),
    markRead: vi.fn().mockResolvedValue(createNotification({ isRead: true, readAt: now })),
    markAllRead: vi.fn().mockResolvedValue({ count: 3 }),
    getUnreadCount: vi.fn().mockResolvedValue(4),
    getUnreadCountsByType: vi.fn().mockResolvedValue([
      {
        type: "MATCH_CREATED",
        _count: {
          _all: 2
        }
      },
      {
        type: "NEW_MESSAGE",
        _count: {
          _all: 2
        }
      }
    ]),
    ...overrides
  };
}

function createService(overrides: Record<string, unknown> = {}) {
  const notifications = createRepository(overrides);

  return {
    notifications,
    service: new NotificationService({
      notifications: notifications as never
    })
  };
}

describe("NotificationService", () => {
  it("lists notifications for the current user with pagination metadata", async () => {
    const { service, notifications } = createService();

    const result = await service.listNotifications("user-1", {
      type: "MATCH_CREATED",
      unreadOnly: true,
      limit: 20
    });

    expect(result.items).toHaveLength(1);
    expect(result.pageInfo).toEqual({
      hasMore: false,
      startCursor: "notification-1",
      endCursor: "notification-1"
    });
    expect(notifications.listForUser).toHaveBeenCalledWith("user-1", {
      type: "MATCH_CREATED",
      unreadOnly: true,
      limit: 20
    });
  });

  it("marks owned notifications read", async () => {
    const { service, notifications } = createService();

    const notification = await service.markRead("user-1", "notification-1");

    expect(notification).toMatchObject({
      id: "notification-1",
      isRead: true
    });
    expect(notifications.markRead).toHaveBeenCalledWith("notification-1", "user-1");
  });

  it("rejects read updates for missing or unowned notifications", async () => {
    const { service } = createService({
      markRead: vi.fn().mockResolvedValue(null)
    });

    await expect(service.markRead("user-1", "notification-2")).rejects.toBeInstanceOf(AppError);
  });

  it("marks all notifications read for the current user", async () => {
    const { service, notifications } = createService();

    await expect(service.markAllRead("user-1")).resolves.toEqual({
      updatedCount: 3
    });
    expect(notifications.markAllRead).toHaveBeenCalledWith("user-1");
  });

  it("returns unread totals and counts by type", async () => {
    const { service } = createService();

    await expect(service.getUnreadCount("user-1")).resolves.toEqual({
      total: 4,
      byType: [
        {
          type: "MATCH_CREATED",
          unreadCount: 2
        },
        {
          type: "NEW_MESSAGE",
          unreadCount: 2
        }
      ]
    });
  });
});
