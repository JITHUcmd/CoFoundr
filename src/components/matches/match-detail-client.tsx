"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MatchScorePanel } from "./match-score-panel";
import type { ApiFailure, ApiSuccess, MatchItem, PublicMatchUser } from "./match.types";

type MatchResponse = ApiSuccess<{ match: MatchItem }> | ApiFailure;

function formatError(payload: ApiFailure | null, fallback: string) {
  return payload?.error?.message ?? fallback;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function UserSummary({ user }: { user: PublicMatchUser }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
      {user.profilePhotoUrl ? (
        <img src={user.profilePhotoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 text-sm font-bold text-teal-800">
          {user.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950">{user.name}</p>
        <p className="text-sm text-slate-500">@{user.username}</p>
        {user.headline ? <p className="mt-1 text-sm text-slate-600">{user.headline}</p> : null}
      </div>
    </div>
  );
}

function MatchOverview({ match }: { match: MatchItem }) {
  if (match.type === "USER") {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">User match</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          {match.participants.map((participant) => participant.name).join(" and ")}
        </h1>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {match.participants.map((participant) => (
            <UserSummary key={participant.id} user={participant} />
          ))}
        </div>
      </section>
    );
  }

  if (match.type === "STARTUP") {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Startup match</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
          {match.startup.logoUrl ? (
            <img src={match.startup.logoUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-teal-100 text-lg font-bold text-teal-800">
              {match.startup.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-950">{match.startup.name}</h1>
            <p className="mt-1 text-sm text-slate-600">{match.startup.tagline ?? "Startup collaboration match"}</p>
            <p className="mt-3 text-sm font-medium text-slate-500">Matched user</p>
            <div className="mt-2">
              <UserSummary user={match.user} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Opportunity match</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950">{match.opportunity.roleName}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {formatEnum(match.opportunity.opportunityType)} at {match.opportunity.startup.name}
      </p>
      <div className="mt-5">
        <UserSummary user={match.user} />
      </div>
    </section>
  );
}

function MetadataPanel({ match }: { match: MatchItem }) {
  const rows = [
    ["Type", formatEnum(match.type)],
    ["Status", formatEnum(match.status)],
    ["Created", formatDate(match.createdAt)],
    ["Archived", formatDate(match.archivedAt)],
    ["Blocked", formatDate(match.blockedAt)],
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Match details</h2>
      <dl className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-2">
            <dt className="text-sm font-medium text-slate-500">{label}</dt>
            <dd className="text-right text-sm font-semibold text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function MatchDetailClient({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<MatchItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadMatch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as MatchResponse | null;

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to load match."));
        setMatch(null);
        return;
      }

      setMatch(payload.data.match);
    } catch {
      setError("Unable to load match. Check your connection and try again.");
      setMatch(null);
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void loadMatch();
  }, [loadMatch]);

  async function updateStatus(action: "archive" | "block") {
    setIsMutating(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/matches/${matchId}/${action}`, { method: "PATCH" });
      const payload = (await response.json().catch(() => null)) as MatchResponse | null;

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, `Unable to ${action} match.`));
        return;
      }

      setMatch(payload.data.match);
      setNotice(action === "archive" ? "Match archived." : "Match blocked.");
    } catch {
      setError(`Unable to ${action} match. Check your connection and try again.`);
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/matches" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
          Back to matches
        </Link>
        {match?.status === "ACTIVE" ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isMutating}
              onClick={() => void updateStatus("archive")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Archive
            </button>
            <button
              type="button"
              disabled={isMutating}
              onClick={() => void updateStatus("block")}
              className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              Block
            </button>
          </div>
        ) : null}
      </div>

      <section aria-busy={isLoading || isMutating}>
        {notice ? (
          <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800" aria-live="polite">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
            <h1 className="font-semibold">Match could not load</h1>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => void loadMatch()}
              className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            >
              Try again
            </button>
          </div>
        ) : null}

        {isLoading && !error ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="h-64 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-5 w-2/3 rounded bg-slate-100" />
              <div className="mt-4 h-4 w-1/2 rounded bg-slate-100" />
              <div className="mt-8 h-28 rounded bg-slate-100" />
            </div>
            <div className="h-64 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-5 w-1/2 rounded bg-slate-100" />
              <div className="mt-5 space-y-3">
                <div className="h-3 rounded bg-slate-100" />
                <div className="h-3 rounded bg-slate-100" />
                <div className="h-3 rounded bg-slate-100" />
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && match ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <MatchOverview match={match} />
              <MatchScorePanel scores={match.scores} />
            </div>
            <MetadataPanel match={match} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
