"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DiscoveryCard } from "./discovery-card";
import type {
  ApiFailure,
  ApiSuccess,
  DiscoveryFeed,
  DiscoveryItem,
  DiscoveryTarget,
  OpportunityDiscoveryItem,
  StartupDiscoveryItem,
  SwipeAction,
  UserDiscoveryItem,
} from "./discovery.types";

type FeedResponse<T> = ApiSuccess<{ feed: DiscoveryFeed<T> }> | ApiFailure;
type SwipeResponse = ApiSuccess<{ swipe: { id: string; action: SwipeAction; createdAt: string } }> | ApiFailure;
type FeedLoadMode = "replace" | "append";

type Filters = {
  country: string;
  state: string;
  city: string;
  availability: string;
  status: string;
  workStyle: string;
  fundingStage: string;
  hiringStatus: string;
  fundraisingOnly: string;
  minTeamSize: string;
  maxTeamSize: string;
  opportunityType: string;
  equityAvailable: string;
  salaryAvailable: string;
  remoteAllowed: string;
};

type TargetFeedState = {
  items: DiscoveryItem[];
  nextCursor: string | null;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
};

const tabs: Array<{ key: DiscoveryTarget; label: string; description: string }> = [
  { key: "users", label: "Users", description: "Founders, advisors, investors, and startup talent" },
  { key: "startups", label: "Startups", description: "Teams looking for collaborators and early believers" },
  { key: "opportunities", label: "Opportunities", description: "Open co-founder, advisor, and startup roles" },
];

const initialFilters: Filters = {
  country: "",
  state: "",
  city: "",
  availability: "",
  status: "",
  workStyle: "",
  fundingStage: "",
  hiringStatus: "",
  fundraisingOnly: "",
  minTeamSize: "",
  maxTeamSize: "",
  opportunityType: "",
  equityAvailable: "",
  salaryAvailable: "",
  remoteAllowed: "",
};

const endpointByTarget: Record<DiscoveryTarget, string> = {
  users: "/api/discovery/users",
  startups: "/api/discovery/startups",
  opportunities: "/api/discovery/opportunities",
};

const swipeEndpointByTarget: Record<DiscoveryTarget, string> = {
  users: "/api/swipes/users",
  startups: "/api/swipes/startups",
  opportunities: "/api/swipes/opportunities",
};

function createFeedState(isInitialLoading = false): TargetFeedState {
  return {
    items: [],
    nextCursor: null,
    isInitialLoading,
    isLoadingMore: false,
    error: null,
  };
}

function createFeedStateByTarget(activeTarget: DiscoveryTarget): Record<DiscoveryTarget, TargetFeedState> {
  return {
    users: createFeedState(activeTarget === "users"),
    startups: createFeedState(activeTarget === "startups"),
    opportunities: createFeedState(activeTarget === "opportunities"),
  };
}

function formatError(payload: ApiFailure | null, fallback: string) {
  return payload?.error?.message ?? fallback;
}

function appendQuery(params: URLSearchParams, key: string, value: string) {
  if (value.trim()) {
    params.set(key, value.trim());
  }
}

function buildQuery(target: DiscoveryTarget, filters: Filters, cursor: string | null) {
  const params = new URLSearchParams({ limit: "12" });

  if (cursor) {
    params.set("cursor", cursor);
  }

  appendQuery(params, "country", filters.country);
  appendQuery(params, "state", filters.state);
  appendQuery(params, "city", filters.city);

  if (target === "users") {
    appendQuery(params, "availability", filters.availability);
    appendQuery(params, "status", filters.status);
    appendQuery(params, "workStyle", filters.workStyle);
  }

  if (target === "startups") {
    appendQuery(params, "fundingStage", filters.fundingStage);
    appendQuery(params, "hiringStatus", filters.hiringStatus);
    appendQuery(params, "fundraisingOnly", filters.fundraisingOnly);
    appendQuery(params, "minTeamSize", filters.minTeamSize);
    appendQuery(params, "maxTeamSize", filters.maxTeamSize);
  }

  if (target === "opportunities") {
    appendQuery(params, "opportunityType", filters.opportunityType);
    appendQuery(params, "equityAvailable", filters.equityAvailable);
    appendQuery(params, "salaryAvailable", filters.salaryAvailable);
    appendQuery(params, "remoteAllowed", filters.remoteAllowed);
  }

  return params;
}

function uniqueItems<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
      >
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}

function DiscoveryFilters({
  target,
  filters,
  onChange,
  onReset,
  onApply,
}: {
  target: DiscoveryTarget;
  filters: Filters;
  onChange: (key: keyof Filters, value: string) => void;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-950">Filters</h2>
          <p className="text-sm text-slate-500">Refine the active feed.</p>
        </div>
        <button type="button" onClick={onReset} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
          Reset
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        <TextField label="Country" value={filters.country} onChange={(value) => onChange("country", value)} placeholder="India" />
        <TextField label="State" value={filters.state} onChange={(value) => onChange("state", value)} placeholder="Kerala" />
        <TextField label="City" value={filters.city} onChange={(value) => onChange("city", value)} placeholder="Kochi" />

        {target === "users" ? (
          <>
            <SelectField
              label="Availability"
              value={filters.availability}
              onChange={(value) => onChange("availability", value)}
              options={[
                { value: "FULL_TIME", label: "Full Time" },
                { value: "PART_TIME", label: "Part Time" },
                { value: "CONTRACT", label: "Contract" },
                { value: "ADVISORY", label: "Advisory" },
                { value: "INVESTOR_ONLY", label: "Investor Only" },
              ]}
            />
            <SelectField
              label="Status"
              value={filters.status}
              onChange={(value) => onChange("status", value)}
              options={[
                { value: "ACTIVELY_LOOKING", label: "Actively Looking" },
                { value: "OPEN_TO_OPPORTUNITIES", label: "Open To Opportunities" },
              ]}
            />
            <SelectField
              label="Work Style"
              value={filters.workStyle}
              onChange={(value) => onChange("workStyle", value)}
              options={[
                { value: "REMOTE", label: "Remote" },
                { value: "HYBRID", label: "Hybrid" },
                { value: "IN_PERSON", label: "In Person" },
              ]}
            />
          </>
        ) : null}

        {target === "startups" ? (
          <>
            <SelectField
              label="Funding"
              value={filters.fundingStage}
              onChange={(value) => onChange("fundingStage", value)}
              options={[
                { value: "BOOTSTRAPPED", label: "Bootstrapped" },
                { value: "FUNDRAISING_NOW", label: "Fundraising Now" },
                { value: "PRE_SEED", label: "Pre-Seed" },
                { value: "SEED", label: "Seed" },
                { value: "SERIES_A_PLUS", label: "Series A+" },
                { value: "FUNDRAISING", label: "Fundraising" },
              ]}
            />
            <SelectField
              label="Hiring"
              value={filters.hiringStatus}
              onChange={(value) => onChange("hiringStatus", value)}
              options={[
                { value: "HIRING", label: "Hiring" },
                { value: "NOT_HIRING", label: "Not Hiring" },
                { value: "PAUSED", label: "Paused" },
              ]}
            />
            <SelectField
              label="Fundraising Only"
              value={filters.fundraisingOnly}
              onChange={(value) => onChange("fundraisingOnly", value)}
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
            />
            <TextField label="Min Team" type="number" value={filters.minTeamSize} onChange={(value) => onChange("minTeamSize", value)} />
            <TextField label="Max Team" type="number" value={filters.maxTeamSize} onChange={(value) => onChange("maxTeamSize", value)} />
          </>
        ) : null}

        {target === "opportunities" ? (
          <>
            <SelectField
              label="Role Type"
              value={filters.opportunityType}
              onChange={(value) => onChange("opportunityType", value)}
              options={[
                { value: "TECHNICAL_CO_FOUNDER", label: "Technical Co-Founder" },
                { value: "BUSINESS_CO_FOUNDER", label: "Business Co-Founder" },
                { value: "ADVISOR", label: "Advisor" },
                { value: "INVESTOR", label: "Investor" },
                { value: "DEVELOPER", label: "Developer" },
                { value: "DESIGNER", label: "Designer" },
                { value: "PRODUCT_MANAGER", label: "Product Manager" },
                { value: "MARKETING", label: "Marketing" },
                { value: "OTHER", label: "Other" },
              ]}
            />
            <SelectField
              label="Remote"
              value={filters.remoteAllowed}
              onChange={(value) => onChange("remoteAllowed", value)}
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
            />
            <SelectField
              label="Equity"
              value={filters.equityAvailable}
              onChange={(value) => onChange("equityAvailable", value)}
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
            />
            <SelectField
              label="Salary"
              value={filters.salaryAvailable}
              onChange={(value) => onChange("salaryAvailable", value)}
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
            />
          </>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onApply}
        className="mt-5 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Apply filters
      </button>
    </aside>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-lg bg-slate-100" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-1/2 rounded bg-slate-100" />
              <div className="h-3 w-1/3 rounded bg-slate-100" />
              <div className="h-3 w-2/3 rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-3 rounded bg-slate-100" />
            <div className="h-3 w-5/6 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DiscoveryExplorer() {
  const [target, setTarget] = useState<DiscoveryTarget>("users");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);
  const [feedByTarget, setFeedByTarget] = useState<Record<DiscoveryTarget, TargetFeedState>>(() =>
    createFeedStateByTarget("users"),
  );
  const [swipingIds, setSwipingIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestKey = useMemo(() => JSON.stringify({ target, appliedFilters }), [target, appliedFilters]);
  const inFlightLoadsRef = useRef<Set<string>>(new Set());
  const requestSequenceRef = useRef<Record<DiscoveryTarget, number>>({
    users: 0,
    startups: 0,
    opportunities: 0,
  });

  const loadFeed = useCallback(
    async ({
      cursor,
      mode,
      target: loadTarget,
    }: {
      cursor: string | null;
      mode: FeedLoadMode;
      target: DiscoveryTarget;
    }) => {
      const loadKey = `${loadTarget}:${mode}:${cursor ?? "first"}`;

      if (inFlightLoadsRef.current.has(loadKey)) {
        return;
      }

      inFlightLoadsRef.current.add(loadKey);
      requestSequenceRef.current[loadTarget] += 1;
      const requestId = requestSequenceRef.current[loadTarget];

      setFeedByTarget((current) => ({
        ...current,
        [loadTarget]: {
          ...current[loadTarget],
          error: null,
          isInitialLoading: mode === "replace",
          isLoadingMore: mode === "append",
          items: mode === "replace" ? [] : current[loadTarget].items,
          nextCursor: mode === "replace" ? null : current[loadTarget].nextCursor,
        },
      }));

      try {
        const params = buildQuery(loadTarget, appliedFilters, cursor);
        const response = await fetch(`${endpointByTarget[loadTarget]}?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as FeedResponse<DiscoveryItem> | null;

        if (requestId !== requestSequenceRef.current[loadTarget]) {
          return;
        }

        if (!response.ok || !payload?.success) {
          setFeedByTarget((current) => ({
            ...current,
            [loadTarget]: {
              ...current[loadTarget],
              error: formatError(payload as ApiFailure | null, "Unable to load discovery feed."),
              isInitialLoading: false,
              isLoadingMore: false,
            },
          }));
          return;
        }

        const feed = payload.data.feed;
        setFeedByTarget((current) => ({
          ...current,
          [loadTarget]: {
            ...current[loadTarget],
            items: uniqueItems(mode === "append" ? [...current[loadTarget].items, ...feed.items] : feed.items),
            nextCursor: feed.nextCursor,
            isInitialLoading: false,
            isLoadingMore: false,
            error: null,
          },
        }));
      } catch {
        setFeedByTarget((current) => ({
          ...current,
          [loadTarget]: {
            ...current[loadTarget],
            error: "Unable to load discovery feed. Check your connection and try again.",
            isInitialLoading: false,
            isLoadingMore: false,
          },
        }));
      } finally {
        inFlightLoadsRef.current.delete(loadKey);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    setNotice(null);
    void loadFeed({ cursor: null, mode: "replace", target });
  }, [loadFeed, requestKey]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const activeFeed = feedByTarget[target];

    if (!sentinel || !activeFeed.nextCursor || activeFeed.isInitialLoading || activeFeed.isLoadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadFeed({ cursor: activeFeed.nextCursor, mode: "append", target });
        }
      },
      { rootMargin: "320px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [feedByTarget, loadFeed, target]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setFeedByTarget(createFeedStateByTarget(target));
  }

  function handleTargetChange(nextTarget: DiscoveryTarget) {
    if (nextTarget === target) {
      return;
    }

    setNotice(null);
    setTarget(nextTarget);
  }

  async function handleSwipe(renderedTarget: DiscoveryTarget, targetId: string, action: SwipeAction) {
    setSwipingIds((current) => new Set(current).add(targetId));
    setNotice(null);

    try {
      const response = await fetch(swipeEndpointByTarget[renderedTarget], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, action }),
      });
      const payload = (await response.json().catch(() => null)) as SwipeResponse | null;

      if (!response.ok || !payload?.success) {
        setNotice(formatError(payload as ApiFailure | null, "Unable to record swipe."));
        return;
      }

      setFeedByTarget((current) => ({
        ...current,
        [renderedTarget]: {
          ...current[renderedTarget],
          items: current[renderedTarget].items.filter((item) => item.id !== targetId),
        },
      }));
      setNotice(action === "LEFT" ? "Passed." : action === "RIGHT" ? "Interest sent." : "Superlike sent.");
    } catch {
      setNotice("Unable to record swipe. Check your connection and try again.");
    } finally {
      setSwipingIds((current) => {
        const next = new Set(current);
        next.delete(targetId);
        return next;
      });
    }
  }

  const activeTab = tabs.find((tab) => tab.key === target) ?? tabs[0];
  const activeFeed = feedByTarget[target];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Discovery</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950">Find your next collaborator</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Explore recommended profiles, startups, and opportunities from the existing discovery engine.
              </p>
            </div>
            <div className="grid grid-cols-3 rounded-lg border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Discovery feeds">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={target === tab.key}
                  onClick={() => handleTargetChange(tab.key)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                    target === tab.key ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <DiscoveryFilters
          target={target}
          filters={filters}
          onChange={updateFilter}
          onReset={resetFilters}
          onApply={() => setAppliedFilters(filters)}
        />

        <section className="min-w-0" aria-busy={activeFeed.isInitialLoading || activeFeed.isLoadingMore}>
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-950">{activeTab.label}</h2>
            <p className="mt-1 text-sm text-slate-600">{activeTab.description}</p>
          </div>

          {notice ? (
            <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800" aria-live="polite">
              {notice}
            </div>
          ) : null}

          {activeFeed.error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
              <h2 className="font-semibold">Discovery could not load</h2>
              <p className="mt-2 text-sm">{activeFeed.error}</p>
              <button
                type="button"
                onClick={() => void loadFeed({ cursor: null, mode: "replace", target })}
                className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
              >
                Try again
              </button>
            </div>
          ) : null}

          {activeFeed.isInitialLoading && !activeFeed.error ? <LoadingCards /> : null}

          {!activeFeed.isInitialLoading && !activeFeed.error && activeFeed.items.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">No recommendations found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Adjust your filters or check back after more profiles, startups, and opportunities enter the discovery pool.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Clear filters
              </button>
            </div>
          ) : null}

          {!activeFeed.isInitialLoading && !activeFeed.error && activeFeed.items.length > 0 ? (
            <>
              <div className="grid gap-5 xl:grid-cols-2">
                {activeFeed.items.map((item) => (
                  <DiscoveryCard
                    key={item.id}
                    target={target}
                    item={
                      target === "users"
                        ? (item as UserDiscoveryItem)
                        : target === "startups"
                          ? (item as StartupDiscoveryItem)
                          : (item as OpportunityDiscoveryItem)
                    }
                    isSwiping={swipingIds.has(item.id)}
                    onSwipe={handleSwipe}
                  />
                ))}
              </div>

              <div ref={sentinelRef} className="h-8" />

              <div className="mt-4 flex justify-center">
                {activeFeed.isLoadingMore ? (
                  <p className="text-sm font-medium text-slate-500">Loading more recommendations...</p>
                ) : activeFeed.nextCursor ? (
                  <button
                    type="button"
                    onClick={() => void loadFeed({ cursor: activeFeed.nextCursor, mode: "append", target })}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Load more
                  </button>
                ) : (
                  <p className="text-sm text-slate-500">You have reached the end of this feed.</p>
                )}
              </div>
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
