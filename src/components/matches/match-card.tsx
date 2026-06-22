import Link from "next/link";
import type { MatchItem, MatchScores, PublicMatchUser } from "./match.types";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently matched";
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

function Avatar({ user, imageUrl, label }: { user?: PublicMatchUser; imageUrl?: string | null; label: string }) {
  const src = user?.profilePhotoUrl ?? imageUrl;
  const fallback = (user?.name ?? label).slice(0, 1).toUpperCase();

  if (src) {
    return <img src={src} alt="" className="h-12 w-12 rounded-lg object-cover" />;
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 text-sm font-bold text-teal-800">
      {fallback}
    </div>
  );
}

function ScorePill({ scores }: { scores: MatchScores }) {
  const score = clampScore(scores.compatibilityScore || scores.matchScore);

  return (
    <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-right">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Match</p>
      <p className="text-2xl font-semibold text-teal-900">{score}%</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "BLOCKED"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${styles}`}>
      {formatEnum(status)}
    </span>
  );
}

function matchCopy(match: MatchItem) {
  if (match.type === "USER") {
    const names = match.participants.map((participant) => participant.name).join(" and ");

    return {
      title: names || "User match",
      subtitle: "Founder or collaborator match",
      description: match.participants.map((participant) => participant.headline).filter(Boolean).join(" | ") || "A mutual user match is ready for follow-up.",
      imageUser: match.participants[0],
      imageUrl: null,
    };
  }

  if (match.type === "STARTUP") {
    return {
      title: match.startup.name,
      subtitle: `Startup match with ${match.user.name}`,
      description: match.startup.tagline ?? match.user.headline ?? "A startup match is ready for a conversation.",
      imageUser: undefined,
      imageUrl: match.startup.logoUrl,
    };
  }

  return {
    title: match.opportunity.roleName,
    subtitle: `${formatEnum(match.opportunity.opportunityType)} at ${match.opportunity.startup.name}`,
    description: match.user.headline ?? "An opportunity match is ready for review.",
    imageUser: undefined,
    imageUrl: match.opportunity.startup.logoUrl,
  };
}

export function MatchCard({ match }: { match: MatchItem }) {
  const copy = matchCopy(match);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <Avatar user={copy.imageUser} imageUrl={copy.imageUrl} label={copy.title} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-slate-950">{copy.title}</h2>
              <StatusBadge status={match.status} />
            </div>
            <p className="mt-1 text-sm font-medium text-slate-600">{copy.subtitle}</p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{copy.description}</p>
          </div>
        </div>
        <ScorePill scores={match.scores} />
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          <span className="rounded-md bg-slate-100 px-2 py-1">{formatEnum(match.type)}</span>
          <span className="rounded-md bg-slate-100 px-2 py-1">{formatDate(match.createdAt)}</span>
        </div>
        <Link
          href={`/matches/${match.id}`}
          className="inline-flex justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
