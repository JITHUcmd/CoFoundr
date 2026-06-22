import type { ApiFailure, NotificationType } from "./notification.types";

export function formatError(payload: ApiFailure | null, fallback: string) {
  return payload?.error?.message ?? fallback;
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatNotificationType(value: NotificationType) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function notificationCategory(type: NotificationType) {
  if (type === "MATCH_CREATED") return "Match";
  if (type === "NEW_MESSAGE") return "Message";
  if (type.startsWith("APPLICATION_")) return "Application";
  if (type === "SYSTEM") return "System";
  if (type.startsWith("STARTUP_VERIFICATION_")) return "Verification";
  if (type === "SUPERLIKE_RECEIVED") return "Discovery";
  if (type === "PROFILE_VIEW_MILESTONE") return "Profile";
  return "Notification";
}

export function notificationAccent(type: NotificationType) {
  const category = notificationCategory(type);

  if (category === "Match") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (category === "Message") return "border-sky-200 bg-sky-50 text-sky-800";
  if (category === "Application") return "border-amber-200 bg-amber-50 text-amber-800";
  if (category === "System") return "border-slate-200 bg-slate-50 text-slate-700";
  if (category === "Verification") return "border-violet-200 bg-violet-50 text-violet-800";
  if (category === "Discovery") return "border-teal-200 bg-teal-50 text-teal-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}
