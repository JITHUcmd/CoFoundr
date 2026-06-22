import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { MessageService } from "@/services/messaging/message.service";

const now = new Date();

const user = {
  id: "user-1",
  username: "arya",
  name: "Arya",
  profilePhotoUrl: null,
  headline: "Founder"
};

const peer = {
  id: "user-2",
  username: "maya",
  name: "Maya",
  profilePhotoUrl: null,
  headline: "Builder"
};

function createMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: "message-1",
    conversationId: "conversation-1",
    senderId: "user-1",
    type: "TEXT",
    body: "Hello",
    createdAt: now,
    editedAt: null,
    deletedAt: null,
    sender: user,
    readReceipts: [],
    ...overrides
  };
}

function createConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: "conversation-1",
    type: "MATCH",
    userMatchId: "match-1",
    startupMatchId: null,
    opportunityMatchId: null,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    archivedAt: null,
    participants: [
      {
        userId: "user-1",
        role: "MEMBER",
        lastReadAt: null,
        user
      },
      {
        userId: "user-2",
        role: "MEMBER",
        lastReadAt: null,
        user: peer
      }
    ],
    messages: [createMessage()],
    ...overrides
  };
}

function createRepository(overrides: Record<string, unknown> = {}) {
  return {
    findActiveMatchForUser: vi.fn().mockResolvedValue({
      type: "USER",
      matchId: "match-1",
      participantUserIds: ["user-1", "user-2"]
    }),
    findConversationByIdForUser: vi.fn().mockResolvedValue(createConversation()),
    findConversationByMatch: vi.fn().mockResolvedValue(createConversation()),
    getOrCreateConversationForMatch: vi.fn().mockResolvedValue(createConversation()),
    listConversationsForUser: vi.fn().mockResolvedValue([createConversation()]),
    createMessage: vi.fn().mockResolvedValue(createMessage()),
    listMessages: vi.fn().mockResolvedValue([createMessage()]),
    findMessageByIdForUser: vi.fn().mockResolvedValue(createMessage()),
    updateMessage: vi.fn().mockResolvedValue(createMessage({ body: "Updated", editedAt: now })),
    softDeleteMessage: vi.fn().mockResolvedValue(createMessage({ deletedAt: now })),
    markMessageRead: vi.fn().mockResolvedValue({
      messageId: "message-1",
      userId: "user-1",
      readAt: now
    }),
    getUnreadCounts: vi.fn().mockResolvedValue([
      {
        conversationId: "conversation-1",
        unreadCount: 2
      }
    ]),
    ...overrides
  };
}

function createService(overrides: Record<string, unknown> = {}) {
  const messages = createRepository(overrides);
  const notifications = {
    messageSent: vi.fn().mockResolvedValue(undefined)
  };
  const analytics = {
    messageSent: vi.fn().mockResolvedValue(undefined)
  };

  return {
    messages,
    notifications,
    analytics,
    service: new MessageService({
      messages: messages as never,
      notifications,
      analytics
    })
  };
}

describe("MessageService", () => {
  it("creates or returns a conversation for an active match", async () => {
    const { service, messages } = createService();

    const conversation = await service.getConversationByMatchId("user-1", "match-1");

    expect(conversation).toMatchObject({
      id: "conversation-1",
      matchId: "match-1",
      matchType: "USER",
      unreadCount: 2
    });
    expect(messages.getOrCreateConversationForMatch).toHaveBeenCalledWith({
      type: "USER",
      matchId: "match-1",
      participantUserIds: ["user-1", "user-2"]
    });
  });

  it("rejects conversation creation for inactive or unauthorized matches", async () => {
    const { service } = createService({
      findActiveMatchForUser: vi.fn().mockResolvedValue(null)
    });

    await expect(service.getConversationByMatchId("user-1", "match-1")).rejects.toBeInstanceOf(AppError);
  });

  it("sends messages only after conversation access is verified", async () => {
    const { service, messages, notifications, analytics } = createService();

    const message = await service.sendMessage("user-1", "conversation-1", {
      type: "TEXT",
      content: "Hello"
    });

    expect(message).toMatchObject({
      id: "message-1",
      content: "Hello"
    });
    expect(messages.findActiveMatchForUser).toHaveBeenCalledWith("match-1", "user-1");
    expect(messages.createMessage).toHaveBeenCalledWith("conversation-1", "user-1", {
      type: "TEXT",
      content: "Hello"
    });
    expect(notifications.messageSent).toHaveBeenCalledWith({
      conversationId: "conversation-1",
      messageId: "message-1",
      senderId: "user-1",
      recipientUserIds: ["user-2"]
    });
    expect(analytics.messageSent).toHaveBeenCalledWith({
      conversationId: "conversation-1",
      messageId: "message-1",
      senderId: "user-1"
    });
  });

  it("blocks messages when the linked match is no longer active", async () => {
    const { service, messages } = createService({
      findActiveMatchForUser: vi.fn().mockResolvedValue(null)
    });

    await expect(service.sendMessage("user-1", "conversation-1", {
      type: "TEXT",
      content: "Hello"
    })).rejects.toBeInstanceOf(AppError);
    expect(messages.createMessage).not.toHaveBeenCalled();
  });

  it("lists messages with cursor pagination", async () => {
    const { service, messages } = createService();

    const result = await service.listMessages("user-1", "conversation-1", {
      before: "message-2",
      limit: 20
    });

    expect(result.items).toHaveLength(1);
    expect(result.pageInfo).toMatchObject({
      hasMore: false,
      endCursor: "message-1"
    });
    expect(messages.listMessages).toHaveBeenCalledWith("conversation-1", {
      before: "message-2",
      limit: 20
    });
  });

  it("edits only owned text messages", async () => {
    const { service, messages } = createService();

    const message = await service.editMessage("user-1", "message-1", "Updated");

    expect(message).toMatchObject({
      id: "message-1",
      content: "Updated"
    });
    expect(messages.updateMessage).toHaveBeenCalledWith("message-1", "user-1", "Updated");
  });

  it("rejects edits for messages owned by another participant", async () => {
    const { service, messages } = createService({
      findMessageByIdForUser: vi.fn().mockResolvedValue(createMessage({ senderId: "user-2", sender: peer }))
    });

    await expect(service.editMessage("user-1", "message-1", "Nope")).rejects.toBeInstanceOf(AppError);
    expect(messages.updateMessage).not.toHaveBeenCalled();
  });

  it("soft deletes only owned messages", async () => {
    const { service, messages } = createService();

    const message = await service.deleteMessage("user-1", "message-1");

    expect(message).toMatchObject({
      id: "message-1",
      deletedAt: now
    });
    expect(messages.softDeleteMessage).toHaveBeenCalledWith("message-1", "user-1");
  });

  it("marks accessible messages as read", async () => {
    const { service, messages } = createService();

    const receipt = await service.markMessageRead("user-1", "message-1");

    expect(receipt).toEqual({
      messageId: "message-1",
      userId: "user-1",
      readAt: now
    });
    expect(messages.markMessageRead).toHaveBeenCalledWith("message-1", "user-1");
  });

  it("returns total and per-conversation unread counts", async () => {
    const { service } = createService();

    const unread = await service.getUnreadCount("user-1");

    expect(unread).toEqual({
      total: 2,
      conversations: [
        {
          conversationId: "conversation-1",
          unreadCount: 2
        }
      ]
    });
  });
});
