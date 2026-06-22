"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MatchCard } from "./match-card";
import type { ApiFailure, ApiSuccess, MatchItem, MatchStatus, MatchType } from "./match.types";

type MatchesResponse = ApiSuccess<{ matches: MatchItem[] }> | ApiFailure;

type MatchTypeFilter = "ALL" | MatchType;
type MatchStatusFilter = "ALL" | MatchStatus;

const typeTabs: Array<{ value: MatchTypeFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "USER", label: "Users" },
  { value: "STARTUP", label: "Startups" },
  { value: "OPPORTUNITY", label: "Opportunities" },
];

const statusOptions: Array<{ value: MatchStatusFilter; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "BLOCKED", label: "Blocked" },
];

function formatError(payload: ApiFailure | null, fallback: string) {
  return payload?.error?.message ?? fallback;
}

export function MatchesClient() {
  const [typeFilter, setTypeFilter] = useState<MatchTypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<MatchStatusFilter>("ACTIVE");
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "50" });

    if (typeFilter !== "ALL") {
      params.set("type", typeFilter);
    }

    if (statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }

    return params.toString();
  }, [statusFilter, typeFilter]);

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/matches?${query}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as MatchesResponse | null;

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to load matches."));
        setMatches([]);
        return;
      }

      setMatches(payload.data.matches);
    } catch {
      setError("Unable to load matches. Check your connection and try again.");
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Matches</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Follow up with mutual interest</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review user, startup, and opportunity matches created by the approved matching engine.
            </p>
          </div>

          <label className="block min-w-48">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as MatchStatusFilter)}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:grid-cols-4" role="tablist" aria-label="Match types">
          {typeTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={typeFilter === tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                typeFilter === tab.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section aria-busy={isLoading}>
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
            <h2 className="font-semibold">Matches could not load</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => void loadMatches()}
              className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            >
              Try again
            </button>
          </div>
        ) : null}

        {isLoading && !error ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-slate-100" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                    <div className="h-3 w-5/6 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-5 h-10 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && matches.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">No matches found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              New matches will appear here after mutual interest, startup acceptance, or opportunity acceptance.
            </p>
          </div>
        ) : null}

        {!isLoading && !error && matches.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={`${match.type}-${match.id}`} match={match} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
