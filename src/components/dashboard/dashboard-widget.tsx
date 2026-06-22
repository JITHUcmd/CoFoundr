import type { ReactNode } from "react";

type DashboardWidgetProps = {
  title: string;
  value: string;
  description: string;
  accent: "teal" | "amber" | "rose" | "slate" | "emerald";
  children?: ReactNode;
};

const accentClasses = {
  teal: "bg-teal-50 text-teal-700 ring-teal-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export function DashboardWidget({ title, value, description, accent, children }: DashboardWidgetProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-500">{title}</h2>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className={`rounded-lg px-3 py-1 text-xs font-semibold ring-1 ${accentClasses[accent]}`}>Live</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
