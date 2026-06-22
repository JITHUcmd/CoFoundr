import type { ApiFailure, ConversationItem, MessageItem } from "./message.types";

export function formatError(payload: ApiFailure | null, fallback: string) {
  return payload?.error?.message ?? fallback;
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatMatchType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function otherParticipants(conversation: ConversationItem, currentUserId: string) {
  return conversation.participants.filter((participant) => participant.userId !== currentUserId);
}

export function conversationTitle(conversation: ConversationItem, currentUserId: string) {
  const others = otherParticipants(conversation, currentUserId);
  const names = others.map((participant) => participant.user.name ?? participant.user.username).filter(Boolean);

  return names.length ? names.join(", ") : "Conversation";
}

export function conversationSubtitle(conversation: ConversationItem, currentUserId: string) {
  const others = otherParticipants(conversation, currentUserId);
  const headlines = others.map((participant) => participant.user.headline).filter(Boolean);

  return headlines.length ? headlines.join(" | ") : `${formatMatchType(conversation.matchType)} match`;
}

export function messagePreview(message: MessageItem | null) {
  if (!message) {
    return "No messages yet.";
  }

  if (message.deletedAt) {
    return "Message deleted.";
  }

  if (message.type !== "TEXT") {
    return formatMatchType(message.type);
  }

  return message.content ?? "";
}
