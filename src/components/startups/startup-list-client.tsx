"use client";

import Link from "next/link";

export function StartupListClient() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Startups</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">My startups</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Startup listing needs an existing owned-startups API. The current backend exposes creation and private startup lookup by ID, but not a list endpoint.
          </p>
        </div>
        <Link href="/startups/new" className="rounded-lg bg-slate-950 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800">
          Create startup
        </Link>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">No startup list API available</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          This page is ready for the owned-startups feed. Create a startup to open its detail page directly after the existing API returns it.
        </p>
        <Link href="/startups/new" className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          Create startup
        </Link>
      </section>
    </div>
  );
}
