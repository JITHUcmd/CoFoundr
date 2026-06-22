"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChartCard } from "./chart-card";
import { DateRangeSelector } from "./date-range-selector";
import { KpiCard } from "./kpi-card";
import type {
  AnalyticsRange,
  ApiFailure,
  OpportunityAnalytics,
  OpportunityAnalyticsResponse,
  StartupAnalytics,
  StartupAnalyticsResponse,
  UserAnalytics,
  UserAnalyticsResponse,
} from "./analytics.types";
import { formatEnum, formatError, formatPercent } from "./analytics-utils";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PanelState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

function createPanelState<T>(): PanelState<T> {
  return {
    data: null,
    isLoading: false,
    error: null,
  };
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-3 w-1/2 rounded bg-slate-100" />
          <div className="mt-4 h-8 w-2/3 rounded bg-slate-100" />
          <div className="mt-4 h-3 w-5/6 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
      <h3 className="font-semibold">Analytics could not load</h3>
      <p className="mt-2 text-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
      >
        Try again
      </button>
    </div>
  );
}

function UserAnalyticsPanel({ analytics }: { analytics: UserAnalytics }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Profile views" value={analytics.profileViews} />
        <KpiCard label="Discovery appearances" value={analytics.discoveryAppearances} />
        <KpiCard label="Matches" value={analytics.matches} />
        <KpiCard label="Messages sent" value={analytics.messagesSent} />
        <KpiCard label="Messages received" value={analytics.messagesReceived} />
        <KpiCard label="Response rate" value={formatPercent(analytics.responseRate)} />
        <KpiCard label="Profile completion" value={formatPercent(analytics.profileCompletion)} />
        <KpiCard label="Builder score" value={formatPercent(analytics.builderScore)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Profile views trend" series={analytics.charts.profileViews} />
        <ChartCard title="Matches trend" series={analytics.charts.matches} />
        <ChartCard title="Messages sent trend" series={analytics.charts.messagesSent} />
      </div>
    </div>
  );
}

function StartupAnalyticsPanel({ analytics }: { analytics: StartupAnalytics }) {
  const funnelRows = [
    ["Viewed", analytics.hiringFunnel.viewed, "100%"],
    ["Saved", analytics.hiringFunnel.saved, formatPercent(analytics.hiringFunnelPercentages.viewedToSaved)],
    ["Applied", analytics.hiringFunnel.applied, formatPercent(analytics.hiringFunnelPercentages.savedToApplied)],
    ["Matched", analytics.hiringFunnel.matched, formatPercent(analytics.hiringFunnelPercentages.appliedToMatched)],
    ["Joined", analytics.hiringFunnel.joined, formatPercent(analytics.hiringFunnelPercentages.matchedToJoined)],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Startup views" value={analytics.startupViews} />
        <KpiCard label="Followers" value={analytics.followers} />
        <KpiCard label="Saves" value={analytics.saves} />
        <KpiCard label="Applications" value={analytics.applications} />
        <KpiCard label="Matches" value={analytics.matches} />
        <KpiCard label="Team size" value={analytics.teamSize} />
        <KpiCard label="Active opportunities" value={analytics.activeOpportunities} />
        <KpiCard label="Verification" value={formatEnum(analytics.verificationStatus)} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Hiring funnel</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {funnelRows.map(([label, value, percent]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{percent}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Startup views trend" series={analytics.charts.views} />
        <ChartCard title="Applications trend" series={analytics.charts.applications} />
        <ChartCard title="Matches trend" series={analytics.charts.matches} />
      </div>
    </div>
  );
}

function OpportunityAnalyticsPanel({ analytics }: { analytics: OpportunityAnalytics }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Views" value={analytics.views} />
        <KpiCard label="Saves" value={analytics.saves} />
        <KpiCard label="Applications" value={analytics.applications} />
        <KpiCard label="Accepted" value={analytics.acceptedApplications} />
        <KpiCard label="Rejected" value={analytics.rejectedApplications} />
        <KpiCard label="Matches" value={analytics.matches} />
        <KpiCard label="Conversion rate" value={formatPercent(analytics.conversionRate)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Opportunity views trend" series={analytics.charts.views} />
        <ChartCard title="Applications trend" series={analytics.charts.applications} />
        <ChartCard title="Matches trend" series={analytics.charts.matches} />
      </div>
    </div>
  );
}

function EntityLookup({
  label,
  value,
  onChange,
  onSubmit,
  isLoading,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const isValid = uuidPattern.test(value.trim());

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste an ID"
          className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
        />
      </label>
      <button
        type="button"
        disabled={!isValid || isLoading}
        onClick={onSubmit}
        className="mt-4 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isLoading ? "Loading..." : "Load analytics"}
      </button>
    </div>
  );
}

export function AnalyticsClient() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [startupId, setStartupId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [loadedStartupId, setLoadedStartupId] = useState<string | null>(null);
  const [loadedOpportunityId, setLoadedOpportunityId] = useState<string | null>(null);
  const [userState, setUserState] = useState<PanelState<UserAnalytics>>(() => createPanelState());
  const [startupState, setStartupState] = useState<PanelState<StartupAnalytics>>(() => createPanelState());
  const [opportunityState, setOpportunityState] = useState<PanelState<OpportunityAnalytics>>(() => createPanelState());
  const previousRangeRef = useRef(range);

  const rangeQuery = useMemo(() => `range=${encodeURIComponent(range)}`, [range]);

  const loadUserAnalytics = useCallback(async () => {
    setUserState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/analytics/me?${rangeQuery}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as UserAnalyticsResponse | null;

      if (!response.ok || !payload?.success) {
        setUserState({ data: null, isLoading: false, error: formatError(payload as ApiFailure | null, "Unable to load user analytics.") });
        return;
      }

      setUserState({ data: payload.data.analytics, isLoading: false, error: null });
    } catch {
      setUserState({ data: null, isLoading: false, error: "Unable to load user analytics. Check your connection and try again." });
    }
  }, [rangeQuery]);

  const fetchStartupAnalytics = useCallback(async (id: string) => {
    setStartupState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/analytics/startups/${id}?${rangeQuery}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as StartupAnalyticsResponse | null;

      if (!response.ok || !payload?.success) {
        setStartupState({ data: null, isLoading: false, error: formatError(payload as ApiFailure | null, "Unable to load startup analytics.") });
        return;
      }

      setStartupState({ data: payload.data.analytics, isLoading: false, error: null });
    } catch {
      setStartupState({ data: null, isLoading: false, error: "Unable to load startup analytics. Check your connection and try again." });
    }
  }, [rangeQuery]);

  const loadStartupAnalytics = useCallback(async () => {
    const id = startupId.trim();

    if (!uuidPattern.test(id)) {
      setStartupState({ data: null, isLoading: false, error: "Enter a valid startup ID." });
      return;
    }

    setLoadedStartupId(id);
    await fetchStartupAnalytics(id);
  }, [fetchStartupAnalytics, startupId]);

  const fetchOpportunityAnalytics = useCallback(async (id: string) => {
    setOpportunityState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/analytics/opportunities/${id}?${rangeQuery}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as OpportunityAnalyticsResponse | null;

      if (!response.ok || !payload?.success) {
        setOpportunityState({ data: null, isLoading: false, error: formatError(payload as ApiFailure | null, "Unable to load opportunity analytics.") });
        return;
      }

      setOpportunityState({ data: payload.data.analytics, isLoading: false, error: null });
    } catch {
      setOpportunityState({ data: null, isLoading: false, error: "Unable to load opportunity analytics. Check your connection and try again." });
    }
  }, [rangeQuery]);

  const loadOpportunityAnalytics = useCallback(async () => {
    const id = opportunityId.trim();

    if (!uuidPattern.test(id)) {
      setOpportunityState({ data: null, isLoading: false, error: "Enter a valid opportunity ID." });
      return;
    }

    setLoadedOpportunityId(id);
    await fetchOpportunityAnalytics(id);
  }, [fetchOpportunityAnalytics, opportunityId]);

  useEffect(() => {
    void loadUserAnalytics();
  }, [loadUserAnalytics]);

  useEffect(() => {
    if (previousRangeRef.current === range) {
      return;
    }

    previousRangeRef.current = range;

    if (loadedStartupId) {
      void fetchStartupAnalytics(loadedStartupId);
    }

    if (loadedOpportunityId) {
      void fetchOpportunityAnalytics(loadedOpportunityId);
    }
  }, [fetchOpportunityAnalytics, fetchStartupAnalytics, loadedOpportunityId, loadedStartupId, range]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Analytics</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Measure discovery, matches, and conversion</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review personal, startup, and opportunity analytics using the existing analytics API.
            </p>
          </div>
          <DateRangeSelector value={range} onChange={setRange} />
        </div>
      </section>

      <section className="space-y-4" aria-busy={userState.isLoading}>
        <h2 className="text-xl font-semibold text-slate-950">User analytics</h2>
        {userState.error ? <ErrorState message={userState.error} onRetry={() => void loadUserAnalytics()} /> : null}
        {userState.isLoading && !userState.error ? <LoadingGrid /> : null}
        {!userState.isLoading && !userState.error && userState.data ? <UserAnalyticsPanel analytics={userState.data} /> : null}
      </section>

      <section className="space-y-4" aria-busy={startupState.isLoading}>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Startup analytics</h2>
          <p className="mt-1 text-sm text-slate-600">Load analytics for a startup you own.</p>
        </div>
        <EntityLookup
          label="Startup ID"
          value={startupId}
          onChange={setStartupId}
          onSubmit={() => void loadStartupAnalytics()}
          isLoading={startupState.isLoading}
        />
        {startupState.error ? <ErrorState message={startupState.error} onRetry={() => void loadStartupAnalytics()} /> : null}
        {startupState.isLoading && !startupState.error ? <LoadingGrid /> : null}
        {!startupState.isLoading && !startupState.error && startupState.data ? <StartupAnalyticsPanel analytics={startupState.data} /> : null}
        {!startupState.isLoading && !startupState.error && !startupState.data ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-600">Enter a startup ID to view startup views, applications, conversion, and hiring funnel metrics.</p>
          </div>
        ) : null}
      </section>

      <section className="space-y-4" aria-busy={opportunityState.isLoading}>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Opportunity analytics</h2>
          <p className="mt-1 text-sm text-slate-600">Load analytics for an opportunity owned by one of your startups.</p>
        </div>
        <EntityLookup
          label="Opportunity ID"
          value={opportunityId}
          onChange={setOpportunityId}
          onSubmit={() => void loadOpportunityAnalytics()}
          isLoading={opportunityState.isLoading}
        />
        {opportunityState.error ? <ErrorState message={opportunityState.error} onRetry={() => void loadOpportunityAnalytics()} /> : null}
        {opportunityState.isLoading && !opportunityState.error ? <LoadingGrid /> : null}
        {!opportunityState.isLoading && !opportunityState.error && opportunityState.data ? <OpportunityAnalyticsPanel analytics={opportunityState.data} /> : null}
        {!opportunityState.isLoading && !opportunityState.error && !opportunityState.data ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-600">Enter an opportunity ID to view views, applications, matches, and conversion rate.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
