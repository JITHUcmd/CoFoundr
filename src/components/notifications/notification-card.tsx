import type { NotificationItem } from "./notification.types";
import {
  formatDateTime,
  formatNotificationType,
  notificationAccent,
  notificationCategory,
} from "./notification-utils";

export function NotificationCard({
  notification,
  isUpdating,
  onMarkRead,
}: {
  notification: NotificationItem;
  isUpdating: boolean;
  onMarkRead: (id: string) => void;
}) {
  return (
    <article
      className={`rounded-lg border p-5 shadow-sm transition ${
        notification.isRead ? "border-slate-200 bg-white" : "border-teal-200 bg-teal-50/60"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${notificationAccent(notification.type)}`}>
              {notificationCategory(notification.type)}
            </span>
            {!notification.isRead ? (
              <span className="rounded-full bg-teal-600 px-2 py-0.5 text-xs font-bold text-white" aria-label="Unread notification">
                Unread
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-lg font-semibold text-slate-950">{notification.title}</h2>
          {notification.content ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">{notification.content}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold">{formatNotificationType(notification.type)}</span>
            <time dateTime={notification.createdAt}>{formatDateTime(notification.createdAt)}</time>
          </div>
        </div>

        {!notification.isRead ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onMarkRead(notification.id)}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating ? "Marking..." : "Mark read"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
