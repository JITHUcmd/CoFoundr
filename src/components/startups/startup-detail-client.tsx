"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  ApiFailure,
  Startup,
  StartupAnalytics,
  StartupAnalyticsResponse,
  StartupOpportunitiesResponse,
  StartupOpportunity,
  StartupResponse,
  StartupVerification,
  StartupVerificationResponse,
} from "./startup.types";
import { formatDate, formatEnum, formatError, formatNumber, locationLabel } from "./startup-utils";

type StartupDetailState = {
  startup: Startup | null;
  opportunities: StartupOpportunity[];
  analytics: StartupAnalytics | null;
  verification: StartupVerification | null;
};

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | ApiFailure | null;
}

function Badge({ value }: { value: string | null | undefined }) {
  return <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{formatEnum(value)}</span>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{formatNumber(value)}</p>
    </article>
  );
}

export function StartupDetailClient({ startupId }: { startupId: string }) {
  const [state, setState] = useState<StartupDetailState>({
    startup: null,
    opportunities: [],
    analytics: null,
    verification: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondaryError, setSecondaryError] = useState<string | null>(null);

  const loadStartup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSecondaryError(null);

    try {
      const startupResponse = await fetch(`/api/startups/${startupId}`, { cache: "no-store" });
      const startupPayload = await readJson<StartupResponse>(startupResponse);

      if (!startupResponse.ok || !startupPayload?.success) {
        setError(formatError(startupPayload as ApiFailure | null, "Unable to load startup."));
        setState({ startup: null, opportunities: [], analytics: null, verification: null });
        return;
      }

      const [opportunitiesResponse, analyticsResponse, verificationResponse] = await Promise.all([
        fetch(`/api/startups/${startupId}/opportunities`, { cache: "no-store" }),
        fetch(`/api/startups/${startupId}/analytics`, { cache: "no-store" }),
        fetch(`/api/startups/${startupId}/verification`, { cache: "no-store" }),
      ]);

      const [opportunitiesPayload, analyticsPayload, verificationPayload] = await Promise.all([
        readJson<StartupOpportunitiesResponse>(opportunitiesResponse),
        readJson<StartupAnalyticsResponse>(analyticsResponse),
        readJson<StartupVerificationResponse>(verificationResponse),
      ]);

      const nextState: StartupDetailState = {
        startup: startupPayload.data.startup,
        opportunities: opportunitiesPayload?.success ? opportunitiesPayload.data.opportunities : [],
        analytics: analyticsPayload?.success ? analyticsPayload.data.analytics : null,
        verification: verificationPayload?.success ? verificationPayload.data.verification : null,
      };

      const failedSecondary = [
        !opportunitiesResponse.ok ? "opportunities" : null,
        !analyticsResponse.ok ? "analytics" : null,
        !verificationResponse.ok ? "verification" : null,
      ].filter(Boolean);

      if (failedSecondary.length) {
        setSecondaryError(`Unable to load ${failedSecondary.join(", ")}.`);
      }

      setState(nextState);
    } catch {
      setError("Unable to load startup. Check your connection and try again.");
      setState({ startup: null, opportunities: [], analytics: null, verification: null });
    } finally {
      setIsLoading(false);
    }
  }, [startupId]);

  useEffect(() => {
    void loadStartup();
  }, [loadStartup]);

  const { startup, opportunities, analytics, verification } = state;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Startup</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Startup details</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/startups" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">All startups</Link>
          <Link href={`/startups/${startupId}/edit`} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Edit startup</Link>
        </div>
      </div>

      <section aria-busy={isLoading}>
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
            <h2 className="font-semibold">Startup could not load</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button type="button" onClick={() => void loadStartup()} className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white">Try again</button>
          </div>
        ) : null}

        {isLoading && !error ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">Loading startup...</div>
        ) : null}

        {!isLoading && !error && !startup ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Startup not found</h2>
            <p className="mt-2 text-sm text-slate-600">This startup may have been archived or you may not have access.</p>
          </div>
        ) : null}

        {!isLoading && !error && startup ? (
          <div className="space-y-6">
            {secondaryError ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="alert">{secondaryError}</div> : null}

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              {startup.coverImageUrl ? <img src={startup.coverImageUrl} alt="" className="h-44 w-full object-cover" /> : <div className="h-20 bg-slate-200" />}
              <div className="p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    {startup.logoUrl ? (
                      <img src={startup.logoUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-teal-100 text-2xl font-bold text-teal-800">
                        {startup.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate text-3xl font-semibold text-slate-950">{startup.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">/{startup.slug}</p>
                      <p className="mt-3 text-sm font-medium text-slate-700">{startup.tagline ?? "Tagline not set"}</p>
                      <p className="mt-2 text-sm text-slate-600">{locationLabel(startup.country, startup.state, startup.city)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge value={verification?.status ?? startup.verificationStatus} />
                    <Badge value={startup.startupStage} />
                    <Badge value={startup.fundingStage} />
                  </div>
                </div>
                <p className="mt-5 max-w-4xl text-sm leading-6 text-slate-600">{startup.description ?? "Description not added yet."}</p>
                <div className="mt-5 flex flex-wrap gap-2 text-sm">
                  {startup.website ? <a href={startup.website} target="_blank" rel="noreferrer" className="font-semibold text-teal-700">Website</a> : null}
                  <span className="text-slate-400">Created {formatDate(startup.createdAt)}</span>
                </div>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Views" value={analytics?.profileViews ?? startup.profileViewsCount} />
              <Metric label="Followers" value={analytics?.follows ?? startup.followersCount} />
              <Metric label="Saves" value={analytics?.saves ?? startup.savesCount} />
              <Metric label="Applications" value={analytics?.applications ?? startup.applicationsCount} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-slate-950">Details</h2>
                <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div><dt className="font-semibold text-slate-950">Industry</dt><dd>{startup.industry?.name ?? "Not set"}</dd></div>
                  <div><dt className="font-semibold text-slate-950">Team size</dt><dd>{startup.teamSize ?? startup.members.length}</dd></div>
                  <div><dt className="font-semibold text-slate-950">Hiring</dt><dd>{formatEnum(startup.hiringStatus)}</dd></div>
                  <div><dt className="font-semibold text-slate-950">Open roles</dt><dd>{formatNumber(startup.openRolesCount)}</dd></div>
                  <div><dt className="font-semibold text-slate-950">Work style</dt><dd>{formatEnum(startup.workStyle)}</dd></div>
                  <div><dt className="font-semibold text-slate-950">Remote</dt><dd>{startup.remoteAllowed ? "Allowed" : "Not allowed"}</dd></div>
                  <div><dt className="font-semibold text-slate-950">Equity</dt><dd>{startup.equityAvailable ? "Available" : "Not available"}</dd></div>
                  <div><dt className="font-semibold text-slate-950">Salary</dt><dd>{startup.salaryAvailable ? "Available" : "Not available"}</dd></div>
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-slate-950">Members</h2>
                {startup.members.length ? (
                  <div className="mt-4 space-y-3">
                    {startup.members.map((member) => (
                      <article key={member.id} className="rounded-lg bg-slate-50 p-3">
                        <p className="font-semibold text-slate-950">{member.user.name}</p>
                        <p className="text-sm text-slate-600">@{member.user.username} - {formatEnum(member.role)}</p>
                        <p className="mt-1 text-xs text-slate-500">Joined {formatDate(member.joinedAt)}</p>
                      </article>
                    ))}
                  </div>
                ) : <p className="mt-4 text-sm text-slate-500">No members added yet.</p>}
              </section>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-950">Opportunities</h2>
              {opportunities.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {opportunities.map((opportunity) => (
                    <article key={opportunity.id} className="rounded-lg border border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-950">{opportunity.roleName}</h3>
                      <p className="mt-1 text-sm text-slate-600">{formatEnum(opportunity.opportunityType)} - {formatEnum(opportunity.status)}</p>
                      <p className="mt-3 text-xs text-slate-500">{formatNumber(opportunity.applicationsCount)} applications</p>
                    </article>
                  ))}
                </div>
              ) : <p className="mt-4 text-sm text-slate-500">No active opportunities returned by the existing API.</p>}
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
