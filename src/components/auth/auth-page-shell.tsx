import Link from "next/link";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  children: ReactNode;
};

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <section className="hidden bg-slate-950 px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500 text-sm font-bold text-slate-950">
              CF
            </span>
            <span className="text-xl">CoFoundr</span>
          </Link>

          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-300">Founder network</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">
              Find collaborators before momentum gets expensive.
            </h2>
            <div className="mt-8 grid gap-3">
              {["Verified profiles", "Startup opportunities", "Match-first messaging"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-400">Built for founders, operators, investors, and early startup talent.</p>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full">
            <div className="mb-8 flex justify-center lg:hidden">
              <Link href="/" className="flex items-center gap-3 font-semibold text-slate-950">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
                  CF
                </span>
                <span className="text-xl">CoFoundr</span>
              </Link>
            </div>
            <div className="flex justify-center">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
