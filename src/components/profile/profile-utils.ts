import type { ApiFailure } from "./profile.types";

export function formatError(payload: ApiFailure | null, fallback: string) {
  return payload?.error?.message ?? fallback;
}

export function formatEnum(value: string | null | undefined) {
  if (!value) return "Not set";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function compactLocation(country: string | null, state: string | null, city: string | null) {
  return [city, state, country].filter(Boolean).join(", ") || "Location not set";
}

export const locationLabel = compactLocation;

export function splitIds(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function invalidIds(ids: string[]) {
  return ids.filter((id) => !isUuid(id));
}
