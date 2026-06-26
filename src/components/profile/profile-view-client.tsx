"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ApiFailure, PrivateProfile, ProfileResponse } from "./profile.types";
import { formatDate, formatEnum, formatError, locationLabel } from "./profile-utils";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyList({ label }: { label: string }) {
  return <p className="text-sm text-slate-500">{label} not added yet.</p>;
}

function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return <EmptyList label="Items" />;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {tag}
        </span>
      ))}
    </div>
  );
}

function ProfileContent({ profile }: { profile: PrivateProfile }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            {profile.profilePhotoUrl ? (
              <img src={profile.profilePhotoUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-teal-100 text-2xl font-bold text-teal-800">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Profile</p>
              <h1 className="mt-1 truncate text-3xl font-semibold text-slate-950">{profile.name}</h1>
              <p className="mt-1 text-sm text-slate-500">@{profile.username}</p>
              <p className="mt-3 text-sm font-medium text-slate-700">{profile.headline ?? "Headline not set"}</p>
              <p className="mt-2 text-sm text-slate-600">{locationLabel(profile.country, profile.state, profile.city)}</p>
            </div>
          </div>
          <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Completion</p>
            <p className="text-2xl font-semibold text-teal-900">{profile.completion.score}%</p>
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">{profile.bio ?? "Bio not added yet."}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-md bg-slate-100 px-2 py-1">{formatEnum(profile.status)}</span>
          <span className="rounded-md bg-slate-100 px-2 py-1">{formatEnum(profile.availability)}</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Skills">
          <TagList tags={profile.skills.map((item) => `${item.skill.name}${item.proficiency ? ` - ${formatEnum(item.proficiency)}` : ""}`)} />
        </Section>
        <Section title="Industries">
          <TagList tags={profile.industries.map((item) => item.industry.name)} />
        </Section>
        <Section title="Interests">
          <TagList tags={profile.interests.map((item) => item.interest.name)} />
        </Section>
        <Section title="Communities">
          <TagList tags={profile.communityMemberships.map((item) => item.community.name)} />
        </Section>
      </div>

      <Section title="Experience">
        {profile.experiences.length ? (
          <div className="space-y-4">
            {profile.experiences.map((item) => (
              <article key={item.id} className="rounded-lg bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-950">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.companyName}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {formatDate(item.startDate)} - {item.isCurrent ? "Present" : formatDate(item.endDate)}
                </p>
                {item.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyList label="Experience" />
        )}
      </Section>

      <Section title="Education">
        {profile.education.length ? (
          <div className="space-y-4">
            {profile.education.map((item) => (
              <article key={item.id} className="rounded-lg bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-950">{item.institution}</h3>
                <p className="text-sm text-slate-600">{[item.degree, item.field].filter(Boolean).join(" - ") || "Education details"}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyList label="Education" />
        )}
      </Section>

      <Section title="Portfolio Links">
        {profile.portfolioLinks.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.portfolioLinks.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-200 p-4 text-sm font-semibold text-teal-700 transition hover:bg-slate-50"
              >
                {item.label ?? formatEnum(item.type)}
              </a>
            ))}
          </div>
        ) : (
          <EmptyList label="Portfolio links" />
        )}
      </Section>
    </div>
  );
}

export function ProfileViewClient() {
  const [profile, setProfile] = useState<PrivateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsMissing(false);

    try {
      const response = await fetch("/api/profiles/me", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as ProfileResponse | null;

      if (!response.ok || !payload?.success) {
        const failure = payload as ApiFailure | null;
        if (response.status === 404 || failure?.error?.code === "NOT_FOUND") {
          setIsMissing(true);
          setProfile(null);
          return;
        }

        setError(formatError(failure, "Unable to load profile."));
        setProfile(null);
        return;
      }

      setProfile(payload.data.profile);
    } catch {
      setError("Unable to load profile. Check your connection and try again.");
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Profile</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Your founder profile</h1>
        </div>
        <Link href="/profile/edit" className="rounded-lg bg-slate-950 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800">
          Edit profile
        </Link>
      </div>

      <section aria-busy={isLoading}>
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
            <h2 className="font-semibold">Profile could not load</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button type="button" onClick={() => void loadProfile()} className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">
              Try again
            </button>
          </div>
        ) : null}

        {isLoading && !error ? (
          <div className="space-y-5">
            <div className="h-56 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-20 w-20 rounded-lg bg-slate-100" />
              <div className="mt-5 h-6 w-1/2 rounded bg-slate-100" />
              <div className="mt-3 h-4 w-2/3 rounded bg-slate-100" />
            </div>
          </div>
        ) : null}

        {!isLoading && !error && isMissing ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Profile not initialized</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Start by adding your name, headline, location, and collaboration preferences.
            </p>
            <Link href="/profile/edit" className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Create profile
            </Link>
          </div>
        ) : null}

        {!isLoading && !error && profile ? <ProfileContent profile={profile} /> : null}
      </section>
    </div>
  );
}
