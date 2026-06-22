import type { MessageType } from "@prisma/client";

export type ConversationMatchType = "USER" | "STARTUP" | "OPPORTUNITY";

export type MessagePagination = {
  before?: string;
  after?: string;
  limit: number;
};

export type ConversationPagination = {
  before?: string;
  after?: string;
  limit: number;
};

export type MessageInput = {
  type: Exclude<MessageType, "SYSTEM">;
  content: string;
};

export type ConversationParticipantDto = {
  userId: string;
  role: "MEMBER" | "ADMIN";
  lastReadAt: Date | null;
  user: {
    id: string;
    username: string;
    name: string | null;
    profilePhotoUrl: string | null;
    headline: string | null;
  };
};

export type MessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string | null;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  sender: ConversationParticipantDto["user"];
  readReceipts: Array<{
    userId: string;
    readAt: Date;
  }>;
};

export type ConversationDto = {
  id: string;
  matchId: string;
  matchType: ConversationMatchType;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date | null;
  unreadCount: number;
  participants: ConversationParticipantDto[];
  lastMessage: MessageDto | null;
};
