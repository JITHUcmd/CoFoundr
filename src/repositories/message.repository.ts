import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  ConversationPagination,
  MessageInput,
  MessagePagination
} from "@/types/messaging.types";

const userPublicSelect = {
  id: true,
  username: true,
  name: true,
  profilePhotoUrl: true,
  headline: true
} satisfies Prisma.UserSelect;

const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  type: true,
  body: true,
  createdAt: true,
  editedAt: true,
  deletedAt: true,
  sender: {
    select: userPublicSelect
  },
  readReceipts: {
    select: {
      userId: true,
      readAt: true
    }
  }
} satisfies Prisma.MessageSelect;

const participantSelect = {
  userId: true,
  role: true,
  lastReadAt: true,
  user: {
    select: userPublicSelect
  }
} satisfies Prisma.ConversationParticipantSelect;

const conversationSelect = {
  id: true,
  type: true,
  userMatchId: true,
  startupMatchId: true,
  opportunityMatchId: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
  archivedAt: true,
  participants: {
    where: {
      user: {
        deletedAt: null
      }
    },
    select: participantSelect
  },
  messages: {
    where: {
      deletedAt: null
    },
    orderBy: [
      { createdAt: "desc" as const },
      { id: "desc" as const }
    ],
    take: 1,
    select: messageSelect
  }
} satisfies Prisma.ConversationSelect;

export type MessageRecord = Prisma.MessageGetPayload<{
  select: typeof messageSelect;
}>;

export type ConversationRecord = Prisma.ConversationGetPayload<{
  select: typeof conversationSelect;
}>;

export type MatchConversationRef = {
  type: "USER" | "STARTUP" | "OPPORTUNITY";
  matchId: string;
  participantUserIds: string[];
};

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function conversationMatchWhere(match: MatchConversationRef): Prisma.ConversationWhereInput {
  if (match.type === "USER") return { userMatchId: match.matchId };
  if (match.type === "STARTUP") return { startupMatchId: match.matchId };
  return { opportunityMatchId: match.matchId };
}

function conversationMatchCreate(match: MatchConversationRef): Pick<
  Prisma.ConversationCreateInput,
  "userMatch" | "startupMatch" | "opportunityMatch"
> {
  if (match.type === "USER") {
    return {
      userMatch: {
        connect: {
          id: match.matchId
        }
      }
    };
  }

  if (match.type === "STARTUP") {
    return {
      startupMatch: {
        connect: {
          id: match.matchId
        }
      }
    };
  }

  return {
    opportunityMatch: {
      connect: {
        id: match.matchId
      }
    }
  };
}

const conversationOrderBy = [
  { lastMessageAt: { sort: "desc" as const, nulls: "last" as const } },
  { id: "desc" as const }
] satisfies Prisma.ConversationOrderByWithRelationInput[];

const messageOrderBy = [
  { createdAt: "desc" as const },
  { id: "desc" as const }
] satisfies Prisma.MessageOrderByWithRelationInput[];

const noRowsWhere = { id: { in: [] } };

function activeConversationWhere(userId: string): Prisma.ConversationWhereInput {
  return {
    archivedAt: null,
    OR: [
      {
        userMatch: {
          is: {
            status: "ACTIVE",
            OR: [
              { userAId: userId },
              { userBId: userId }
            ],
            userA: {
              deletedAt: null
            },
            userB: {
              deletedAt: null
            }
          }
        }
      },
      {
        startupMatch: {
          is: {
            status: "ACTIVE",
            OR: [
              { userId },
              { startup: { ownerId: userId } }
            ],
            user: {
              deletedAt: null
            },
            startup: {
              archivedAt: null,
              owner: {
                deletedAt: null
              }
            }
          }
        }
      },
      {
        opportunityMatch: {
          is: {
            status: "ACTIVE",
            OR: [
              { userId },
              { opportunity: { startup: { ownerId: userId } } }
            ],
            user: {
              deletedAt: null
            },
            opportunity: {
              startup: {
                archivedAt: null,
                owner: {
                  deletedAt: null
                }
              }
            }
          }
        }
      }
    ],
    participants: {
      some: {
        userId,
        user: {
          deletedAt: null
        }
      }
    }
  };
}

export class MessageRepository {
  private async conversationCursorWhere(
    userId: string,
    pagination: ConversationPagination
  ): Promise<Prisma.ConversationWhereInput> {
    const cursorId = pagination.before ?? pagination.after;

    if (!cursorId) return {};

    const cursor = await prisma.conversation.findFirst({
      where: {
        id: cursorId,
        ...activeConversationWhere(userId)
      },
      select: {
        id: true,
        lastMessageAt: true
      }
    });

    if (!cursor) return noRowsWhere;

    if (pagination.before) {
      if (!cursor.lastMessageAt) {
        return {
          lastMessageAt: null,
          id: {
            lt: cursor.id
          }
        };
      }

      return {
        OR: [
          {
            lastMessageAt: {
              lt: cursor.lastMessageAt
            }
          },
          {
            lastMessageAt: cursor.lastMessageAt,
            id: {
              lt: cursor.id
            }
          },
          {
            lastMessageAt: null
          }
        ]
      };
    }

    if (!cursor.lastMessageAt) {
      return {
        OR: [
          {
            lastMessageAt: {
              not: null
            }
          },
          {
            lastMessageAt: null,
            id: {
              gt: cursor.id
            }
          }
        ]
      };
    }

    return {
      OR: [
        {
          lastMessageAt: {
            gt: cursor.lastMessageAt
          }
        },
        {
          lastMessageAt: cursor.lastMessageAt,
          id: {
            gt: cursor.id
          }
        }
      ]
    };
  }

  private async messageCursorWhere(
    conversationId: string,
    pagination: MessagePagination
  ): Promise<Prisma.MessageWhereInput> {
    const cursorId = pagination.before ?? pagination.after;

    if (!cursorId) return {};

    const cursor = await prisma.message.findFirst({
      where: {
        id: cursorId,
        conversationId,
        deletedAt: null
      },
      select: {
        id: true,
        createdAt: true
      }
    });

    if (!cursor) return noRowsWhere;

    if (pagination.before) {
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

  async findActiveMatchForUser(matchId: string, userId: string): Promise<MatchConversationRef | null> {
    const userMatch = await prisma.userMatch.findFirst({
      where: {
        id: matchId,
        status: "ACTIVE",
        OR: [
          { userAId: userId },
          { userBId: userId }
        ],
        userA: {
          deletedAt: null
        },
        userB: {
          deletedAt: null
        }
      },
      select: {
        id: true,
        userAId: true,
        userBId: true
      }
    });

    if (userMatch) {
      return {
        type: "USER",
        matchId: userMatch.id,
        participantUserIds: [userMatch.userAId, userMatch.userBId]
      };
    }

    const startupMatch = await prisma.userStartupMatch.findFirst({
      where: {
        id: matchId,
        status: "ACTIVE",
        OR: [
          { userId },
          { startup: { ownerId: userId } }
        ],
        user: {
          deletedAt: null
        },
        startup: {
          archivedAt: null,
          owner: {
            deletedAt: null
          }
        }
      },
      select: {
        id: true,
        userId: true,
        startup: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (startupMatch) {
      return {
        type: "STARTUP",
        matchId: startupMatch.id,
        participantUserIds: [startupMatch.userId, startupMatch.startup.ownerId]
      };
    }

    const opportunityMatch = await prisma.userOpportunityMatch.findFirst({
      where: {
        id: matchId,
        status: "ACTIVE",
        OR: [
          { userId },
          { opportunity: { startup: { ownerId: userId } } }
        ],
        user: {
          deletedAt: null
        },
        opportunity: {
          startup: {
            archivedAt: null,
            owner: {
              deletedAt: null
            }
          }
        }
      },
      select: {
        id: true,
        userId: true,
        opportunity: {
          select: {
            startup: {
              select: {
                ownerId: true
              }
            }
          }
        }
      }
    });

    if (opportunityMatch) {
      return {
        type: "OPPORTUNITY",
        matchId: opportunityMatch.id,
        participantUserIds: [opportunityMatch.userId, opportunityMatch.opportunity.startup.ownerId]
      };
    }

    return null;
  }

  async findConversationByIdForUser(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        archivedAt: null,
        participants: {
          some: {
            userId,
            user: {
              deletedAt: null
            }
          }
        }
      },
      select: conversationSelect
    });
  }

  async findConversationByMatch(match: MatchConversationRef) {
    return prisma.conversation.findFirst({
      where: {
        ...conversationMatchWhere(match),
        archivedAt: null
      },
      select: conversationSelect
    });
  }

  async getOrCreateConversationForMatch(match: MatchConversationRef) {
    const existing = await this.findConversationByMatch(match);

    if (existing) return existing;

    try {
      return await prisma.conversation.create({
        data: {
          type: "MATCH",
          ...conversationMatchCreate(match),
          participants: {
            createMany: {
              data: match.participantUserIds.map((participantUserId) => ({
                userId: participantUserId
              })),
              skipDuplicates: true
            }
          }
        },
        select: conversationSelect
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;

      const createdByOtherRequest = await this.findConversationByMatch(match);
      if (!createdByOtherRequest) throw error;
      return createdByOtherRequest;
    }
  }

  async listConversationsForUser(userId: string, pagination: ConversationPagination) {
    const cursorWhere = await this.conversationCursorWhere(userId, pagination);

    const conversations = await prisma.conversation.findMany({
      where: {
        AND: [
          activeConversationWhere(userId),
          cursorWhere
        ]
      },
      orderBy: conversationOrderBy,
      take: pagination.limit + 1,
      select: conversationSelect
    });

    return conversations;
  }

  async createMessage(conversationId: string, senderId: string, input: MessageInput) {
    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          type: input.type,
          body: input.content
        },
        select: messageSelect
      });

      await tx.conversation.update({
        where: {
          id: conversationId
        },
        data: {
          lastMessageAt: message.createdAt
        }
      });

      await tx.messageReadReceipt.upsert({
        where: {
          messageId_userId: {
            messageId: message.id,
            userId: senderId
          }
        },
        update: {
          readAt: message.createdAt
        },
        create: {
          messageId: message.id,
          userId: senderId,
          readAt: message.createdAt
        }
      });

      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: senderId
          }
        },
        data: {
          lastReadAt: message.createdAt,
          lastReadMessageId: message.id
        }
      });

      return message;
    });
  }

  async listMessages(conversationId: string, pagination: MessagePagination) {
    const cursorWhere = await this.messageCursorWhere(conversationId, pagination);

    const messages = await prisma.message.findMany({
      where: {
        AND: [
          {
            conversationId,
            deletedAt: null
          },
          cursorWhere
        ]
      },
      orderBy: messageOrderBy,
      take: pagination.limit + 1,
      select: messageSelect
    });

    return messages;
  }

  async findMessageByIdForUser(messageId: string, userId: string) {
    return prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: {
          archivedAt: null,
          participants: {
            some: {
              userId,
              user: {
                deletedAt: null
              }
            }
          }
        }
      },
      select: messageSelect
    });
  }

  async updateMessage(messageId: string, senderId: string, content: string) {
    const updated = await prisma.message.updateMany({
      where: {
        id: messageId,
        senderId,
        deletedAt: null,
        type: "TEXT"
      },
      data: {
        body: content,
        editedAt: new Date()
      }
    });

    if (updated.count !== 1) return null;
    return this.findMessageByIdForUser(messageId, senderId);
  }

  async softDeleteMessage(messageId: string, senderId: string) {
    const deleted = await prisma.message.updateMany({
      where: {
        id: messageId,
        senderId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    });

    if (deleted.count !== 1) return null;
    return this.findMessageByIdForUser(messageId, senderId);
  }

  async markMessageRead(messageId: string, userId: string) {
    const message = await this.findMessageByIdForUser(messageId, userId);

    if (!message || message.deletedAt) return null;

    const readAt = new Date();

    await prisma.$transaction([
      prisma.messageReadReceipt.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId
          }
        },
        update: {
          readAt
        },
        create: {
          messageId,
          userId,
          readAt
        }
      }),
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: message.conversationId,
            userId
          }
        },
        data: {
          lastReadAt: readAt,
          lastReadMessageId: messageId
        }
      })
    ]);

    return {
      messageId,
      userId,
      readAt
    };
  }

  async getUnreadCounts(userId: string) {
    return prisma.$queryRaw<Array<{ conversationId: string; unreadCount: number }>>`
      SELECT
        cp."conversationId",
        COUNT(m.id)::int AS "unreadCount"
      FROM "ConversationParticipant" cp
      INNER JOIN "User" viewer ON viewer.id = cp."userId"
      INNER JOIN "Conversation" c ON c.id = cp."conversationId"
      INNER JOIN "Message" m ON m."conversationId" = cp."conversationId"
      LEFT JOIN "UserMatch" um ON um.id = c."userMatchId"
      LEFT JOIN "User" um_a ON um_a.id = um."userAId"
      LEFT JOIN "User" um_b ON um_b.id = um."userBId"
      LEFT JOIN "UserStartupMatch" sm ON sm.id = c."startupMatchId"
      LEFT JOIN "User" sm_user ON sm_user.id = sm."userId"
      LEFT JOIN "Startup" sm_startup ON sm_startup.id = sm."startupId"
      LEFT JOIN "User" sm_owner ON sm_owner.id = sm_startup."ownerId"
      LEFT JOIN "UserOpportunityMatch" om ON om.id = c."opportunityMatchId"
      LEFT JOIN "User" om_user ON om_user.id = om."userId"
      LEFT JOIN "StartupOpportunity" om_opportunity ON om_opportunity.id = om."opportunityId"
      LEFT JOIN "Startup" om_startup ON om_startup.id = om_opportunity."startupId"
      LEFT JOIN "User" om_owner ON om_owner.id = om_startup."ownerId"
      WHERE cp."userId" = ${userId}
        AND viewer."deletedAt" IS NULL
        AND c."archivedAt" IS NULL
        AND m."senderId" <> ${userId}
        AND m."deletedAt" IS NULL
        AND (cp."lastReadAt" IS NULL OR m."createdAt" > cp."lastReadAt")
        AND (
          (
            c."userMatchId" IS NOT NULL
            AND um.status = 'ACTIVE'
            AND (um."userAId" = ${userId} OR um."userBId" = ${userId})
            AND um_a."deletedAt" IS NULL
            AND um_b."deletedAt" IS NULL
          )
          OR (
            c."startupMatchId" IS NOT NULL
            AND sm.status = 'ACTIVE'
            AND (sm."userId" = ${userId} OR sm_startup."ownerId" = ${userId})
            AND sm_user."deletedAt" IS NULL
            AND sm_startup."archivedAt" IS NULL
            AND sm_owner."deletedAt" IS NULL
          )
          OR (
            c."opportunityMatchId" IS NOT NULL
            AND om.status = 'ACTIVE'
            AND (om."userId" = ${userId} OR om_startup."ownerId" = ${userId})
            AND om_user."deletedAt" IS NULL
            AND om_startup."archivedAt" IS NULL
            AND om_owner."deletedAt" IS NULL
          )
        )
      GROUP BY cp."conversationId"
    `;
  }
}

export const messageRepository = new MessageRepository();
