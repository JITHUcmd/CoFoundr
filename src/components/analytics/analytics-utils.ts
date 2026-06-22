import type { ApiFailure, ChartSeries } from "./analytics.types";

export function formatError(payload: ApiFailure | null, fallback: string) {
  return payload?.error?.message ?? fallback;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

export function formatPercent(value: number) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  return `${safeValue}%`;
}

export function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function hasChartData(series: ChartSeries) {
  return series.labels.length > 0 && series.values.length > 0 && series.values.some((value) => value > 0);
}
