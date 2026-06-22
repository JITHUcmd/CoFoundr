import type { ChartSeries } from "./analytics.types";
import { formatNumber, hasChartData } from "./analytics-utils";

export function ChartCard({ title, series }: { title: string; series: ChartSeries }) {
  const maxValue = Math.max(...series.values, 1);
  const isEmpty = !hasChartData(series);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      {isEmpty ? (
        <div className="mt-5 rounded-lg bg-slate-50 p-6 text-center">
          <p className="text-sm font-medium text-slate-600">No chart data for this range.</p>
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex h-44 items-end gap-2 border-b border-slate-200 pb-2">
            {series.values.map((value, index) => (
              <div key={`${series.labels[index] ?? "bucket"}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end rounded-t bg-slate-50">
                  <div
                    className="w-full rounded-t bg-teal-500"
                    style={{ height: `${Math.max(4, Math.round((value / maxValue) * 100))}%` }}
                    aria-label={`${series.labels[index] ?? "Bucket"}: ${formatNumber(value)}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between gap-2 text-[11px] font-medium text-slate-500">
            <span className="truncate">{series.labels[0]}</span>
            <span className="truncate text-right">{series.labels[series.labels.length - 1]}</span>
          </div>
        </div>
      )}
    </article>
  );
}
