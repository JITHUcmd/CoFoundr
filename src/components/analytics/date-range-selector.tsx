import type { AnalyticsRange } from "./analytics.types";

const ranges: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "lifetime", label: "Lifetime" },
];

export function DateRangeSelector({
  value,
  onChange,
}: {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:grid-cols-4" role="radiogroup" aria-label="Analytics date range">
      {ranges.map((range) => (
        <button
          key={range.value}
          type="button"
          role="radio"
          aria-checked={value === range.value}
          onClick={() => onChange(range.value)}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
            value === range.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
