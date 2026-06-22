import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  NotificationCreateInput,
  NotificationListFilters
} from "@/types/notification.types";

const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  content: true,
  metadata: true,
  isRead: true,
  readAt: true,
  createdAt: true
} satisfies Prisma.NotificationSelect;

export type NotificationRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

const notificationOrderBy = [
  { createdAt: "desc" as const },
  { id: "desc" as const }
] satisfies Prisma.NotificationOrderByWithRelationInput[];

const noRowsWhere = { id: { in: [] } };

function toCreateInput(data: NotificationCreateInput): Prisma.NotificationUncheckedCreateInput {
  return {
    userId: data.userId,
    type: data.type,
    title: data.title,
    content: data.content ?? null,
    ...(data.metadata === undefined
      ? {}
      : { metadata: data.metadata === null ? Prisma.JsonNull : data.metadata })
  };
}

export class NotificationRepository {
  private async cursorWhere(
    userId: string,
    filters: NotificationListFilters
  ): Promise<Prisma.NotificationWhereInput> {
    const cursorId = filters.before ?? filters.after;

    if (!cursorId) return {};

    const cursor = await prisma.notification.findFirst({
      where: {
        id: cursorId,
        userId,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.unreadOnly ? { isRead: false } : {})
      },
      select: {
        id: true,
        createdAt: true
      }
    });

    if (!cursor) return noRowsWhere;

    if (filters.before) {
      return {
        OR: [
          {
            createdAt: {
              lt: cursor.createdAt
            }
          },
          {
            createdAt: cursor.createdAt,
            id: {
              lt: cursor.id
            }
          }
        ]
      };
    }

    return {
      OR: [
        {
          createdAt: {
            gt: cursor.createdAt
          }
        },
        {
          createdAt: cursor.createdAt,
          id: {
            gt: cursor.id
          }
        }
      ]
    };
  }

  async create(data: NotificationCreateInput) {
    return prisma.notification.create({
      data: toCreateInput(data),
      select: notificationSelect
    });
  }

  async createMany(items: NotificationCreateInput[]) {
    if (items.length === 0) {
      return { count: 0 };
    }

    return prisma.notification.createMany({
      data: items.map(toCreateInput)
    });
  }

  async listForUser(userId: string, filters: NotificationListFilters) {
    const cursorWhere = await this.cursorWhere(userId, filters);

    return prisma.notification.findMany({
      where: {
        userId,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.unreadOnly ? { isRead: false } : {}),
        ...cursorWhere
      },
      orderBy: notificationOrderBy,
      take: filters.limit + 1,
      select: notificationSelect
    });
  }

  async findByIdForUser(notificationId: string, userId: string) {
    return prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      },
      select: notificationSelect
    });
  }

  async markRead(notificationId: string, userId: string) {
    const existing = await this.findByIdForUser(notificationId, userId);

    if (!existing) return null;
    if (existing.isRead) return existing;

    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return this.findByIdForUser(notificationId, userId);
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }

  async getUnreadCountsByType(userId: string) {
    return prisma.notification.groupBy({
      by: ["type"],
      where: {
        userId,
        isRead: false
      },
      _count: {
        _all: true
      }
    });
  }
}

export const notificationRepository = new NotificationRepository();
