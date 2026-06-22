export type ConversationMatchType = "USER" | "STARTUP" | "OPPORTUNITY";

export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM";

export type PageInfo = {
  hasMore: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

export type ConversationParticipant = {
  userId: string;
  role: "MEMBER" | "ADMIN";
  lastReadAt: string | null;
  user: {
    id: string;
    username: string;
    name: string | null;
    profilePhotoUrl: string | null;
    headline: string | null;
  };
};

export type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  sender: ConversationParticipant["user"];
  readReceipts: Array<{
    userId: string;
    readAt: string;
  }>;
};

export type ConversationItem = {
  id: string;
  matchId: string;
  matchType: ConversationMatchType;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  unreadCount: number;
  participants: ConversationParticipant[];
  lastMessage: MessageItem | null;
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

export type ConversationPageResponse = ApiSuccess<{
  items: ConversationItem[];
  pageInfo: PageInfo;
}> | ApiFailure;

export type ConversationResponse = ApiSuccess<{
  conversation: ConversationItem;
}> | ApiFailure;

export type MessagePageResponse = ApiSuccess<{
  items: MessageItem[];
  pageInfo: PageInfo;
}> | ApiFailure;

export type MessageResponse = ApiSuccess<{
  message: MessageItem;
}> | ApiFailure;

export type UnreadCountResponse = ApiSuccess<{
  unread: {
    total: number;
    conversations: Array<{
      conversationId: string;
      unreadCount: number;
    }>;
  };
}> | ApiFailure;
