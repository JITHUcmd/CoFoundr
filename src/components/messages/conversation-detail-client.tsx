"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageBubble } from "./message-bubble";
import { MessageComposer } from "./message-composer";
import type {
  ApiFailure,
  ConversationItem,
  ConversationResponse,
  MessageItem,
  MessagePageResponse,
  MessageResponse,
} from "./message.types";
import { conversationSubtitle, conversationTitle, formatError } from "./message-utils";

function sortMessages(messages: MessageItem[]) {
  return [...messages].sort((a, b) => {
    const createdDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    if (createdDiff !== 0) {
      return createdDiff;
    }

    return a.id.localeCompare(b.id);
  });
}

export function ConversationDetailClient({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [conversation, setConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToBottomRef = useRef(true);

  const title = useMemo(() => (conversation ? conversationTitle(conversation, currentUserId) : "Conversation"), [conversation, currentUserId]);
  const subtitle = useMemo(() => (conversation ? conversationSubtitle(conversation, currentUserId) : ""), [conversation, currentUserId]);

  const markMessagesRead = useCallback(
    async (items: MessageItem[]) => {
      const unreadReceived = items.filter(
        (message) =>
          message.senderId !== currentUserId &&
          !message.deletedAt &&
          !message.readReceipts.some((receipt) => receipt.userId === currentUserId),
      );

      await Promise.allSettled(
        unreadReceived.map((message) =>
          fetch(`/api/messages/${message.id}/read`, {
            method: "POST",
          }),
        ),
      );
    },
    [currentUserId],
  );

  const loadConversation = useCallback(async () => {
    setIsLoadingConversation(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as ConversationResponse | null;

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to load conversation."));
        setConversation(null);
        return;
      }

      setConversation(payload.data.conversation);
    } catch {
      setError("Unable to load conversation. Check your connection and try again.");
      setConversation(null);
    } finally {
      setIsLoadingConversation(false);
    }
  }, [conversationId]);

  const loadMessages = useCallback(
    async ({ cursor, mode }: { cursor: string | null; mode: "replace" | "prepend" }) => {
      if (mode === "replace") {
        setIsLoadingMessages(true);
        shouldScrollToBottomRef.current = true;
      } else {
        setIsLoadingOlder(true);
        shouldScrollToBottomRef.current = false;
      }

      setError(null);

      try {
        const params = new URLSearchParams({ limit: "50" });

        if (cursor) {
          params.set("before", cursor);
        }

        const response = await fetch(`/api/conversations/${conversationId}/messages?${params.toString()}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as MessagePageResponse | null;

        if (!response.ok || !payload?.success) {
          setError(formatError(payload as ApiFailure | null, "Unable to load messages."));

          if (mode === "replace") {
            setMessages([]);
            setOlderCursor(null);
          }

          return;
        }

        const sorted = sortMessages(payload.data.items);
        setMessages((current) => {
          const merged = mode === "prepend" ? [...sorted, ...current] : sorted;
          const seen = new Set<string>();
          return merged.filter((message) => {
            if (seen.has(message.id)) {
              return false;
            }

            seen.add(message.id);
            return true;
          });
        });
        setOlderCursor(payload.data.pageInfo.hasMore ? payload.data.pageInfo.endCursor : null);
        void markMessagesRead(payload.data.items);
      } catch {
        setError("Unable to load messages. Check your connection and try again.");

        if (mode === "replace") {
          setMessages([]);
          setOlderCursor(null);
        }
      } finally {
        setIsLoadingMessages(false);
        setIsLoadingOlder(false);
      }
    },
    [conversationId, markMessagesRead],
  );

  useEffect(() => {
    void loadConversation();
    void loadMessages({ cursor: null, mode: "replace" });
  }, [loadConversation, loadMessages]);

  useEffect(() => {
    if (!isLoadingMessages && shouldScrollToBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isLoadingMessages, messages.length]);

  async function sendMessage(content: string) {
    setComposerError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "TEXT", content }),
      });
      const payload = (await response.json().catch(() => null)) as MessageResponse | null;

      if (!response.ok || !payload?.success) {
        setComposerError(formatError(payload as ApiFailure | null, "Unable to send message."));
        return false;
      }

      shouldScrollToBottomRef.current = true;
      setMessages((current) => sortMessages([...current, payload.data.message]));
      void loadConversation();
      return true;
    } catch {
      setComposerError("Unable to send message. Check your connection and try again.");
      return false;
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 p-4">
        <Link href="/messages" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
          Back to messages
        </Link>
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{conversation?.matchType ?? "Conversation"}</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </header>

      <section className="flex-1 overflow-y-auto bg-slate-50 p-4" aria-busy={isLoadingConversation || isLoadingMessages || isLoadingOlder}>
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
            <h2 className="font-semibold">Conversation could not load</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => {
                void loadConversation();
                void loadMessages({ cursor: null, mode: "replace" });
              }}
              className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            >
              Try again
            </button>
          </div>
        ) : null}

        {(isLoadingConversation || isLoadingMessages) && !error ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div className="h-16 w-2/3 rounded-lg bg-slate-200 sm:w-1/2" />
              </div>
            ))}
          </div>
        ) : null}

        {!isLoadingMessages && !error && messages.length === 0 ? (
          <div className="flex min-h-80 items-center justify-center text-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">No messages yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Send the first message to start this match conversation.</p>
            </div>
          </div>
        ) : null}

        {!isLoadingMessages && !error && messages.length > 0 ? (
          <div className="space-y-4">
            {olderCursor ? (
              <div className="text-center">
                <button
                  type="button"
                  disabled={isLoadingOlder}
                  onClick={() => void loadMessages({ cursor: olderCursor, mode: "prepend" })}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingOlder ? "Loading..." : "Load older messages"}
                </button>
              </div>
            ) : null}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} currentUserId={currentUserId} />
            ))}
            <div ref={bottomRef} />
          </div>
        ) : null}
      </section>

      {composerError ? (
        <div className="border-t border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">
          {composerError}
        </div>
      ) : null}
      <MessageComposer disabled={Boolean(error) || isLoadingConversation || isLoadingMessages} onSend={sendMessage} />
    </div>
  );
}
