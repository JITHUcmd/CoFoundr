import { formatNumber } from "./analytics-utils";

export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{typeof value === "number" ? formatNumber(value) : value}</p>
      {hint ? <p className="mt-2 text-sm leading-5 text-slate-500">{hint}</p> : null}
    </article>
  );
}
