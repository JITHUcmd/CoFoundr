import { AppError } from "@/lib/errors/app-error";
import {
  notificationRepository,
  type NotificationRecord,
  type NotificationRepository
} from "@/repositories/notification.repository";
import type {
  NotificationCreateInput,
  NotificationDto,
  NotificationListFilters
} from "@/types/notification.types";

type NotificationServiceDeps = {
  notifications?: NotificationRepository;
};

function trimPage<T>(items: T[], limit: number) {
  return {
    items: items.slice(0, limit),
    hasMore: items.length > limit
  };
}

export class NotificationService {
  private readonly notifications: NotificationRepository;

  constructor(deps: NotificationServiceDeps = {}) {
    this.notifications = deps.notifications ?? notificationRepository;
  }

  async createNotification(input: NotificationCreateInput) {
    const notification = await this.notifications.create(input);
    return this.toDto(notification);
  }

  async listNotifications(userId: string, filters: NotificationListFilters) {
    const notifications = await this.notifications.listForUser(userId, filters);
    const page = trimPage(notifications, filters.limit);

    return {
      items: page.items.map((notification) => this.toDto(notification)),
      pageInfo: {
        hasMore: page.hasMore,
        startCursor: page.items[0]?.id ?? null,
        endCursor: page.items.at(-1)?.id ?? null
      }
    };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.notifications.markRead(notificationId, userId);

    if (!notification) {
      throw new AppError("NOT_FOUND", "Notification not found.", 404);
    }

    return this.toDto(notification);
  }

  async markAllRead(userId: string) {
    const result = await this.notifications.markAllRead(userId);

    return {
      updatedCount: result.count
    };
  }

  async getUnreadCount(userId: string) {
    const [total, byType] = await Promise.all([
      this.notifications.getUnreadCount(userId),
      this.notifications.getUnreadCountsByType(userId)
    ]);

    return {
      total,
      byType: byType.map((item) => ({
        type: item.type,
        unreadCount: item._count._all
      }))
    };
  }

  private toDto(notification: NotificationRecord): NotificationDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      metadata: notification.metadata,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt
    };
  }
}

export const notificationService = new NotificationService();
