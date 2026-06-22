import { AppError } from "@/lib/errors/app-error";
import {
  messageRepository,
  type ConversationRecord,
  type MatchConversationRef,
  type MessageRecord,
  type MessageRepository
} from "@/repositories/message.repository";
import type {
  ConversationDto,
  ConversationPagination,
  MessageDto,
  MessageInput,
  MessagePagination
} from "@/types/messaging.types";
import {
  notificationEvents,
  type NotificationEventsService
} from "@/services/notifications/notification-events.service";
import {
  analyticsEvents,
  type AnalyticsEventsService
} from "@/services/analytics/analytics-events.service";

type MessageServiceDeps = {
  messages?: MessageRepository;
  notifications?: Pick<NotificationEventsService, "messageSent">;
  analytics?: Pick<AnalyticsEventsService, "messageSent">;
};

function getConversationMatch(conversation: ConversationRecord): MatchConversationRef | null {
  if (conversation.userMatchId) {
    return {
      type: "USER",
      matchId: conversation.userMatchId,
      participantUserIds: conversation.participants.map((participant) => participant.userId)
    };
  }

  if (conversation.startupMatchId) {
    return {
      type: "STARTUP",
      matchId: conversation.startupMatchId,
      participantUserIds: conversation.participants.map((participant) => participant.userId)
    };
  }

  if (conversation.opportunityMatchId) {
    return {
      type: "OPPORTUNITY",
      matchId: conversation.opportunityMatchId,
      participantUserIds: conversation.participants.map((participant) => participant.userId)
    };
  }

  return null;
}

function trimPage<T>(items: T[], limit: number) {
  return {
    items: items.slice(0, limit),
    hasMore: items.length > limit
  };
}

export class MessageService {
  private readonly messages: MessageRepository;
  private readonly notifications: Pick<NotificationEventsService, "messageSent">;
  private readonly analytics: Pick<AnalyticsEventsService, "messageSent">;

  constructor(deps: MessageServiceDeps = {}) {
    this.messages = deps.messages ?? messageRepository;
    this.notifications = deps.notifications ?? notificationEvents;
    this.analytics = deps.analytics ?? analyticsEvents;
  }

  async listConversations(userId: string, pagination: ConversationPagination) {
    const conversations = await this.messages.listConversationsForUser(userId, pagination);
    const unreadCounts = await this.unreadCountMap(userId);
    const page = trimPage(conversations, pagination.limit);

    return {
      items: page.items.map((conversation) => this.toConversationDto(conversation, unreadCounts)),
      pageInfo: this.pageInfo(page.items, page.hasMore)
    };
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.requireConversation(userId, conversationId);
    const unreadCounts = await this.unreadCountMap(userId);

    return this.toConversationDto(conversation, unreadCounts);
  }

  async getConversationByMatchId(userId: string, matchId: string) {
    const match = await this.messages.findActiveMatchForUser(matchId, userId);

    if (!match) {
      throw new AppError("NOT_FOUND", "Active match not found.", 404);
    }

    const conversation = await this.messages.getOrCreateConversationForMatch(match);
    const unreadCounts = await this.unreadCountMap(userId);

    return this.toConversationDto(conversation, unreadCounts);
  }

  async sendMessage(userId: string, conversationId: string, input: MessageInput) {
    const conversation = await this.requireConversation(userId, conversationId);
    const message = await this.messages.createMessage(conversationId, userId, input);
    const recipientUserIds = conversation.participants
      .map((participant) => participant.userId)
      .filter((participantUserId) => participantUserId !== userId);

    await Promise.all([
      this.notifications.messageSent({
        conversationId,
        messageId: message.id,
        senderId: userId,
        recipientUserIds
      }),
      this.analytics.messageSent({
        conversationId,
        messageId: message.id,
        senderId: userId
      })
    ]);

    return this.toMessageDto(message);
  }

  async listMessages(userId: string, conversationId: string, pagination: MessagePagination) {
    await this.requireConversation(userId, conversationId);
    const messages = await this.messages.listMessages(conversationId, pagination);
    const page = trimPage(messages, pagination.limit);

    return {
      items: page.items.map((message) => this.toMessageDto(message)),
      pageInfo: this.pageInfo(page.items, page.hasMore)
    };
  }

  async editMessage(userId: string, messageId: string, content: string) {
    const existing = await this.messages.findMessageByIdForUser(messageId, userId);

    if (!existing || existing.deletedAt) {
      throw new AppError("NOT_FOUND", "Message not found.", 404);
    }

    await this.requireConversation(userId, existing.conversationId);

    if (existing.senderId !== userId) {
      throw new AppError("FORBIDDEN", "You can only edit your own messages.", 403);
    }

    if (existing.type !== "TEXT") {
      throw new AppError("VALIDATION_ERROR", "Only text messages can be edited.", 400);
    }

    const updated = await this.messages.updateMessage(messageId, userId, content);

    if (!updated) {
      throw new AppError("NOT_FOUND", "Message not found.", 404);
    }

    return this.toMessageDto(updated);
  }

  async deleteMessage(userId: string, messageId: string) {
    const existing = await this.messages.findMessageByIdForUser(messageId, userId);

    if (!existing || existing.deletedAt) {
      throw new AppError("NOT_FOUND", "Message not found.", 404);
    }

    await this.requireConversation(userId, existing.conversationId);

    if (existing.senderId !== userId) {
      throw new AppError("FORBIDDEN", "You can only delete your own messages.", 403);
    }

    const deleted = await this.messages.softDeleteMessage(messageId, userId);

    if (!deleted) {
      throw new AppError("NOT_FOUND", "Message not found.", 404);
    }

    return this.toMessageDto(deleted);
  }

  async markMessageRead(userId: string, messageId: string) {
    const existing = await this.messages.findMessageByIdForUser(messageId, userId);

    if (!existing || existing.deletedAt) {
      throw new AppError("NOT_FOUND", "Message not found.", 404);
    }

    await this.requireConversation(userId, existing.conversationId);

    const receipt = await this.messages.markMessageRead(messageId, userId);

    if (!receipt) {
      throw new AppError("NOT_FOUND", "Message not found.", 404);
    }

    return receipt;
  }

  async getUnreadCount(userId: string) {
    const counts = await this.messages.getUnreadCounts(userId);

    return {
      total: counts.reduce((sum, item) => sum + Number(item.unreadCount), 0),
      conversations: counts.map((item) => ({
        conversationId: item.conversationId,
        unreadCount: Number(item.unreadCount)
      }))
    };
  }

  private async requireConversation(userId: string, conversationId: string) {
    const conversation = await this.messages.findConversationByIdForUser(conversationId, userId);

    if (!conversation) {
      throw new AppError("NOT_FOUND", "Conversation not found.", 404);
    }

    const match = getConversationMatch(conversation);

    if (!match) {
      throw new AppError("FORBIDDEN", "Conversation is not linked to an active match.", 403);
    }

    const activeMatch = await this.messages.findActiveMatchForUser(match.matchId, userId);

    if (!activeMatch || activeMatch.type !== match.type) {
      throw new AppError("FORBIDDEN", "Conversation is not available.", 403);
    }

    return conversation;
  }

  private async unreadCountMap(userId: string) {
    const counts = await this.messages.getUnreadCounts(userId);
    return new Map(counts.map((item) => [item.conversationId, Number(item.unreadCount)]));
  }

  private toConversationDto(conversation: ConversationRecord, unreadCounts: Map<string, number>): ConversationDto {
    const match = getConversationMatch(conversation);

    if (!match) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Conversation is missing match context.", 500);
    }

    return {
      id: conversation.id,
      matchId: match.matchId,
      matchType: match.type,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: unreadCounts.get(conversation.id) ?? 0,
      participants: conversation.participants.map((participant) => ({
        userId: participant.userId,
        role: participant.role,
        lastReadAt: participant.lastReadAt,
        user: participant.user
      })),
      lastMessage: conversation.messages[0] ? this.toMessageDto(conversation.messages[0]) : null
    };
  }

  private toMessageDto(message: MessageRecord): MessageDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      content: message.body,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      sender: message.sender,
      readReceipts: message.readReceipts
    };
  }

  private pageInfo(items: Array<{ id: string }>, hasMore: boolean) {
    return {
      hasMore,
      startCursor: items[0]?.id ?? null,
      endCursor: items[items.length - 1]?.id ?? null
    };
  }
}

export const messageService = new MessageService();
