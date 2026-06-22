"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NotificationCard } from "./notification-card";
import type {
  ApiFailure,
  MarkAllReadResponse,
  NotificationItem,
  NotificationPageResponse,
  NotificationResponse,
  NotificationType,
  UnreadCountResponse,
} from "./notification.types";
import { formatError, formatNotificationType } from "./notification-utils";

type NotificationTypeFilter = "ALL" | NotificationType;
type ReadFilter = "ALL" | "UNREAD";

const typeOptions: Array<{ value: NotificationTypeFilter; label: string }> = [
  { value: "ALL", label: "All types" },
  { value: "MATCH_CREATED", label: "Matches" },
  { value: "NEW_MESSAGE", label: "Messages" },
  { value: "APPLICATION_RECEIVED", label: "Applications received" },
  { value: "APPLICATION_ACCEPTED", label: "Applications accepted" },
  { value: "APPLICATION_REJECTED", label: "Applications rejected" },
  { value: "SYSTEM", label: "System" },
  { value: "SUPERLIKE_RECEIVED", label: "Superlikes" },
  { value: "STARTUP_VERIFICATION_REQUESTED", label: "Verification requested" },
  { value: "STARTUP_VERIFICATION_APPROVED", label: "Verification approved" },
  { value: "STARTUP_VERIFICATION_REJECTED", label: "Verification rejected" },
  { value: "PROFILE_VIEW_MILESTONE", label: "Profile milestones" },
];

function uniqueNotifications(items: NotificationItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>("ALL");
  const [readFilter, setReadFilter] = useState<ReadFilter>("ALL");
  const [unreadTotal, setUnreadTotal] = useState<number | null>(null);
  const [unreadByType, setUnreadByType] = useState<Map<NotificationType, number>>(() => new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const hasNotifications = notifications.length > 0;

  const queryKey = useMemo(() => JSON.stringify({ typeFilter, readFilter }), [readFilter, typeFilter]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/unread-count", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as UnreadCountResponse | null;

      if (response.ok && payload?.success) {
        setUnreadTotal(payload.data.unread.total);
        setUnreadByType(new Map(payload.data.unread.byType.map((item) => [item.type, item.unreadCount])));
      }
    } catch {
      setUnreadTotal(null);
      setUnreadByType(new Map());
    }
  }, []);

  const loadNotifications = useCallback(
    async ({ cursor, mode }: { cursor: string | null; mode: "replace" | "append" }) => {
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

        if (typeFilter !== "ALL") {
          params.set("type", typeFilter);
        }

        if (readFilter === "UNREAD") {
          params.set("unreadOnly", "true");
        }

        const response = await fetch(`/api/notifications?${params.toString()}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as NotificationPageResponse | null;

        if (!response.ok || !payload?.success) {
          setError(formatError(payload as ApiFailure | null, "Unable to load notifications."));

          if (mode === "replace") {
            setNotifications([]);
            setNextCursor(null);
          }

          return;
        }

        setNotifications((current) => uniqueNotifications(mode === "append" ? [...current, ...payload.data.items] : payload.data.items));
        setNextCursor(payload.data.pageInfo.hasMore ? payload.data.pageInfo.endCursor : null);
      } catch {
        setError("Unable to load notifications. Check your connection and try again.");

        if (mode === "replace") {
          setNotifications([]);
          setNextCursor(null);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [readFilter, typeFilter],
  );

  useEffect(() => {
    setNotice(null);
    void loadNotifications({ cursor: null, mode: "replace" });
    void loadUnreadCount();
  }, [loadNotifications, loadUnreadCount, queryKey]);

  async function markRead(notificationId: string) {
    setUpdatingIds((current) => new Set(current).add(notificationId));
    setNotice(null);

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => null)) as NotificationResponse | null;

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to mark notification as read."));
        return;
      }

      setNotifications((current) => {
        const next = current.map((item) => (item.id === notificationId ? payload.data.notification : item));
        return readFilter === "UNREAD" ? next.filter((item) => !item.isRead) : next;
      });
      setNotice("Notification marked as read.");
      void loadUnreadCount();
    } catch {
      setError("Unable to mark notification as read. Check your connection and try again.");
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(notificationId);
        return next;
      });
    }
  }

  async function markAllRead() {
    setIsMarkingAll(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => null)) as MarkAllReadResponse | null;

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to mark all notifications as read."));
        return;
      }

      setNotifications((current) => {
        if (readFilter === "UNREAD") {
          return [];
        }

        const readAt = new Date().toISOString();
        return current.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? readAt }));
      });
      setUnreadTotal(0);
      setUnreadByType(new Map());
      setNotice(payload.data.updatedCount > 0 ? "All notifications marked as read." : "No unread notifications to update.");
    } catch {
      setError("Unable to mark all notifications as read. Check your connection and try again.");
    } finally {
      setIsMarkingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Notifications</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              Updates{unreadTotal && unreadTotal > 0 ? ` (${unreadTotal} unread)` : ""}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review match, message, application, verification, discovery, and system updates.
            </p>
          </div>

          <button
            type="button"
            disabled={isMarkingAll || !unreadTotal}
            onClick={() => void markAllRead()}
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isMarkingAll ? "Marking..." : "Mark all read"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as NotificationTypeFilter)}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            >
              {typeOptions.map((option) => {
                const count = option.value === "ALL" ? unreadTotal : unreadByType.get(option.value);
                const label = count && count > 0 ? `${option.label} (${count})` : option.label;

                return (
                  <option key={option.value} value={option.value}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Read state</span>
            <select
              value={readFilter}
              onChange={(event) => setReadFilter(event.target.value as ReadFilter)}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            >
              <option value="ALL">All notifications</option>
              <option value="UNREAD">Unread only</option>
            </select>
          </label>
        </div>
      </section>

      {notice ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800" aria-live="polite">
          {notice}
        </div>
      ) : null}

      <section aria-busy={isLoading || isLoadingMore || isMarkingAll}>
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
            <h2 className="font-semibold">Notifications could not load</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => void loadNotifications({ cursor: null, mode: "replace" })}
              className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            >
              Try again
            </button>
          </div>
        ) : null}

        {isLoading && !error ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="h-5 w-1/3 rounded bg-slate-100" />
                <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
                <div className="mt-3 h-3 w-5/6 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && !hasNotifications ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">No notifications found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Match, message, application, and system updates will appear here.
            </p>
          </div>
        ) : null}

        {!isLoading && !error && hasNotifications ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                isUpdating={updatingIds.has(notification.id)}
                onMarkRead={(id) => void markRead(id)}
              />
            ))}

            <div className="pt-2 text-center">
              {isLoadingMore ? (
                <p className="text-sm font-medium text-slate-500">Loading older notifications...</p>
              ) : nextCursor ? (
                <button
                  type="button"
                  onClick={() => void loadNotifications({ cursor: nextCursor, mode: "append" })}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Load older notifications
                </button>
              ) : (
                <p className="text-sm text-slate-500">You have reached the end of your notifications.</p>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
