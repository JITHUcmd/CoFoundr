import type { NotificationType, Prisma } from "@prisma/client";

export type NotificationPagination = {
  before?: string;
  after?: string;
  limit: number;
};

export type NotificationListFilters = NotificationPagination & {
  type?: NotificationType;
  unreadOnly?: boolean;
};

export type NotificationCreateInput = {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export type NotificationDto = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string | null;
  metadata: Prisma.JsonValue | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationUnreadCounts = {
  total: number;
  byType: Array<{
    type: NotificationType;
    unreadCount: number;
  }>;
};

export type PageInfo = {
  hasMore: boolean;
  startCursor: string | null;
  endCursor: string | null;
};
