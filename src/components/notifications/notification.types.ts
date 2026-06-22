export type NotificationType =
  | "MATCH_CREATED"
  | "NEW_MESSAGE"
  | "APPLICATION_RECEIVED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "SUPERLIKE_RECEIVED"
  | "STARTUP_VERIFICATION_REQUESTED"
  | "STARTUP_VERIFICATION_APPROVED"
  | "STARTUP_VERIFICATION_REJECTED"
  | "PROFILE_VIEW_MILESTONE"
  | "SYSTEM";

export type PageInfo = {
  hasMore: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string | null;
  metadata: unknown;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error?: {
    message?: string;
  };
};

export type NotificationPageResponse = ApiSuccess<{
  items: NotificationItem[];
  pageInfo: PageInfo;
}> | ApiFailure;

export type NotificationResponse = ApiSuccess<{
  notification: NotificationItem;
}> | ApiFailure;

export type MarkAllReadResponse = ApiSuccess<{
  updatedCount: number;
}> | ApiFailure;

export type UnreadCountResponse = ApiSuccess<{
  unread: {
    total: number;
    byType: Array<{
      type: NotificationType;
      unreadCount: number;
    }>;
  };
}> | ApiFailure;
