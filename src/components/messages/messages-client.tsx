"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConversationList } from "./conversation-list";
import type { ConversationItem, ConversationPageResponse, UnreadCountResponse, ApiFailure } from "./message.types";
import { formatError } from "./message-utils";

export function MessagesClient({ currentUserId }: { currentUserId: string }) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadTotal, setUnreadTotal] = useState<number | null>(null);

  const hasConversations = conversations.length > 0;

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/unread-count", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as UnreadCountResponse | null;

      if (response.ok && payload?.success) {
        setUnreadTotal(payload.data.unread.total);
      }
    } catch {
      setUnreadTotal(null);
    }
  }, []);

  const loadConversations = useCallback(async ({ cursor, mode }: { cursor: string | null; mode: "replace" | "append" }) => {
    if (mode === "replace") {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    setError(null);

    try {
      const params = new URLSearchParams({ limit: "30" });

      if (cursor) {
        params.set("before", cursor);
      }

      const response = await fetch(`/api/conversations?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as ConversationPageResponse | null;

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to load conversations."));

        if (mode === "replace") {
          setConversations([]);
          setNextCursor(null);
        }

        return;
      }

      setConversations((current) => {
        const merged = mode === "append" ? [...current, ...payload.data.items] : payload.data.items;
        const seen = new Set<string>();
        return merged.filter((conversation) => {
          if (seen.has(conversation.id)) {
            return false;
          }

          seen.add(conversation.id);
          return true;
        });
      });
      setNextCursor(payload.data.pageInfo.hasMore ? payload.data.pageInfo.endCursor : null);
    } catch {
      setError("Unable to load conversations. Check your connection and try again.");

      if (mode === "replace") {
        setConversations([]);
        setNextCursor(null);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations({ cursor: null, mode: "replace" });
    void loadUnreadCount();
  }, [loadConversations, loadUnreadCount]);

  const title = useMemo(() => {
    if (unreadTotal === null) {
      return "Messages";
    }

    return unreadTotal > 0 ? `Messages (${unreadTotal} unread)` : "Messages";
  }, [unreadTotal]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Inbox</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Continue conversations created from active matches.
        </p>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-busy={isLoading || isLoadingMore}>
        {error ? (
          <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
            <h2 className="font-semibold">Conversations could not load</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => void loadConversations({ cursor: null, mode: "replace" })}
              className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            >
              Try again
            </button>
          </div>
        ) : null}

        {isLoading && !error ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex gap-3 p-4">
                <div className="h-12 w-12 rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-1/2 rounded bg-slate-100" />
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                  <div className="h-3 w-1/3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && !hasConversations ? (
          <div className="p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-950">No conversations yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Conversations appear after you have an active match and send or receive the first message.
            </p>
          </div>
        ) : null}

        {!isLoading && !error && hasConversations ? (
          <>
            <ConversationList conversations={conversations} currentUserId={currentUserId} />
            <div className="border-t border-slate-100 p-4 text-center">
              {isLoadingMore ? (
                <p className="text-sm font-medium text-slate-500">Loading more conversations...</p>
              ) : nextCursor ? (
                <button
                  type="button"
                  onClick={() => void loadConversations({ cursor: nextCursor, mode: "append" })}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Load older conversations
                </button>
              ) : (
                <p className="text-sm text-slate-500">You have reached the end of your inbox.</p>
              )}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
