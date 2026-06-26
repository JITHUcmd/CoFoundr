import Link from "next/link";
import type { ReactNode } from "react";

const sidebarItems = [
  { href: "/dashboard", label: "Overview", icon: "O" },
  { href: "/profile", label: "Profile", icon: "P" },
  { href: "/profile/edit", label: "Edit Profile", icon: "E" },
  { href: "/founder-vision/edit", label: "Founder Vision", icon: "V" },
  { href: "/discover", label: "Discovery", icon: "D" },
  { href: "/matches", label: "Matches", icon: "M" },
  { href: "/messages", label: "Messages", icon: "C" },
  { href: "/notifications", label: "Notifications", icon: "N" },
  { href: "/analytics", label: "Analytics", icon: "A" },
  { href: "/settings", label: "Settings", icon: "S" },
];

type DashboardShellProps = {
  children: ReactNode;
  userName?: string | null;
};

export function DashboardShell({ children, userName }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
            CF
          </span>
          <span className="text-xl">CoFoundr</span>
        </Link>

        <nav className="mt-10 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-teal-700">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Workspace</p>
              <h1 className="text-lg font-semibold text-slate-950">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-950">{userName ?? "Founder"}</p>
                <p className="text-xs text-slate-500">Builder workspace</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-sm font-bold text-amber-800">
                {(userName ?? "F").slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
