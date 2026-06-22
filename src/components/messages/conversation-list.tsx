"use client";

import Link from "next/link";
import type { ConversationItem } from "./message.types";
import {
  conversationSubtitle,
  conversationTitle,
  formatDateTime,
  formatMatchType,
  messagePreview,
  otherParticipants,
} from "./message-utils";

function ConversationAvatar({ conversation, currentUserId }: { conversation: ConversationItem; currentUserId: string }) {
  const participant = otherParticipants(conversation, currentUserId)[0] ?? conversation.participants[0];
  const name = participant?.user.name ?? participant?.user.username ?? "C";

  if (participant?.user.profilePhotoUrl) {
    return <img src={participant.user.profilePhotoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />;
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 text-sm font-bold text-teal-800">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function ConversationList({
  conversations,
  currentUserId,
  activeConversationId,
}: {
  conversations: ConversationItem[];
  currentUserId: string;
  activeConversationId?: string;
}) {
  return (
    <div className="divide-y divide-slate-100">
      {conversations.map((conversation) => {
        const isActive = conversation.id === activeConversationId;

        return (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            aria-current={isActive ? "page" : undefined}
            className={`block p-4 transition hover:bg-slate-50 ${isActive ? "bg-teal-50" : "bg-white"}`}
          >
            <div className="flex gap-3">
              <ConversationAvatar conversation={conversation} currentUserId={currentUserId} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-slate-950">
                      {conversationTitle(conversation, currentUserId)}
                    </h2>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      {conversationSubtitle(conversation, currentUserId)}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 ? (
                    <span className="rounded-full bg-teal-600 px-2 py-0.5 text-xs font-bold text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{messagePreview(conversation.lastMessage)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold">{formatMatchType(conversation.matchType)}</span>
                  {conversation.lastMessageAt ? <time dateTime={conversation.lastMessageAt}>{formatDateTime(conversation.lastMessageAt)}</time> : null}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
