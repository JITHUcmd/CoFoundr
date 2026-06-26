"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ApiFailure, PrivateProfile, ProfileResponse } from "./profile.types";
import { formatError, invalidIds, splitIds } from "./profile-utils";

type BasicForm = {
  name: string;
  username: string;
  profilePhotoUrl: string;
  headline: string;
  bio: string;
  country: string;
  state: string;
  city: string;
  status: string;
  availability: string;
};

const emptyBasicForm: BasicForm = {
  name: "",
  username: "",
  profilePhotoUrl: "",
  headline: "",
  bio: "",
  country: "",
  state: "",
  city: "",
  status: "OPEN_TO_OPPORTUNITIES",
  availability: "",
};

function cleanNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function readJson(response: Response) {
  return (await response.json().catch(() => null)) as ProfileResponse | ApiFailure | null;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ProfileEditClient() {
  const [profile, setProfile] = useState<PrivateProfile | null>(null);
  const [basicForm, setBasicForm] = useState<BasicForm>(emptyBasicForm);
  const [skillIds, setSkillIds] = useState("");
  const [industryIds, setIndustryIds] = useState("");
  const [interestIds, setInterestIds] = useState("");
  const [communityIds, setCommunityIds] = useState("");
  const [experienceForm, setExperienceForm] = useState({ companyName: "", title: "", industryId: "", startDate: "", endDate: "", description: "" });
  const [educationForm, setEducationForm] = useState({ institution: "", degree: "", field: "", startDate: "", endDate: "", description: "" });
  const [portfolioForm, setPortfolioForm] = useState({ type: "WEBSITE", label: "", url: "", isPrimary: false });
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function hydrate(profileData: PrivateProfile) {
    setProfile(profileData);
    setBasicForm({
      name: profileData.name ?? "",
      username: profileData.username ?? "",
      profilePhotoUrl: profileData.profilePhotoUrl ?? "",
      headline: profileData.headline ?? "",
      bio: profileData.bio ?? "",
      country: profileData.country ?? "",
      state: profileData.state ?? "",
      city: profileData.city ?? "",
      status: profileData.status ?? "OPEN_TO_OPPORTUNITIES",
      availability: profileData.availability ?? "",
    });
    setSkillIds(profileData.skills.map((item) => item.skillId).join("\n"));
    setIndustryIds(profileData.industries.map((item) => item.industryId).join("\n"));
    setInterestIds(profileData.interests.map((item) => item.interestId).join("\n"));
    setCommunityIds(profileData.communityMemberships.map((item) => item.communityId).join("\n"));
  }

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profiles/me", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as ProfileResponse | null;

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to load profile."));
        return;
      }

      hydrate(payload.data.profile);
    } catch {
      setError("Unable to load profile. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function submitRequest(key: string, request: () => Promise<Response>, successMessage: string) {
    setSavingKey(key);
    setError(null);
    setNotice(null);

    try {
      const response = await request();
      const payload = await readJson(response);

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to save changes."));
        return false;
      }

      if ("profile" in payload.data) {
        hydrate(payload.data.profile);
      }

      setNotice(successMessage);
      return true;
    } catch {
      setError("Unable to save changes. Check your connection and try again.");
      return false;
    } finally {
      setSavingKey(null);
    }
  }

  async function saveBasic(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!basicForm.name.trim() || !basicForm.username.trim()) {
      setError("Name and username are required.");
      return;
    }

    await submitRequest(
      "basic",
      () =>
        fetch("/api/profiles/me", {
          method: profile ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: basicForm.name.trim(),
            username: basicForm.username.trim(),
            profilePhotoUrl: cleanNullable(basicForm.profilePhotoUrl),
            headline: cleanNullable(basicForm.headline),
            bio: cleanNullable(basicForm.bio),
            country: cleanNullable(basicForm.country),
            state: cleanNullable(basicForm.state),
            city: cleanNullable(basicForm.city),
            status: basicForm.status,
            availability: basicForm.availability || null,
          }),
        }),
      "Profile updated.",
    );
  }

  async function replaceIds(key: string, endpoint: string, value: string, successMessage: string) {
    const ids = splitIds(value);
    const badIds = invalidIds(ids);

    if (badIds.length) {
      setError(`Invalid IDs: ${badIds.join(", ")}`);
      return;
    }

    await submitRequest(
      key,
      () =>
        fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        }),
      successMessage,
    );
  }

  async function replaceSkills() {
    const ids = splitIds(skillIds);
    const badIds = invalidIds(ids);

    if (badIds.length) {
      setError(`Invalid skill IDs: ${badIds.join(", ")}`);
      return;
    }

    await submitRequest(
      "skills",
      () =>
        fetch("/api/profiles/me/skills", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skills: ids.map((skillId, index) => ({ skillId, isPrimary: index === 0 })) }),
        }),
      "Skills updated.",
    );
  }

  async function addExperience(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await submitRequest(
      "experience",
      () =>
        fetch("/api/profiles/me/experience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: experienceForm.companyName.trim(),
            title: experienceForm.title.trim(),
            industryId: cleanNullable(experienceForm.industryId),
            startDate: cleanNullable(experienceForm.startDate),
            endDate: cleanNullable(experienceForm.endDate),
            description: cleanNullable(experienceForm.description),
          }),
        }),
      "Experience added.",
    );
  }

  async function addEducation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await submitRequest(
      "education",
      () =>
        fetch("/api/profiles/me/education", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            institution: educationForm.institution.trim(),
            degree: cleanNullable(educationForm.degree),
            field: cleanNullable(educationForm.field),
            startDate: cleanNullable(educationForm.startDate),
            endDate: cleanNullable(educationForm.endDate),
            description: cleanNullable(educationForm.description),
          }),
        }),
      "Education added.",
    );
  }

  async function addPortfolio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await submitRequest(
      "portfolio",
      () =>
        fetch("/api/profiles/me/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: portfolioForm.type,
            label: cleanNullable(portfolioForm.label),
            url: portfolioForm.url.trim(),
            isPrimary: portfolioForm.isPrimary,
          }),
        }),
      "Portfolio link added.",
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Profile</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Edit profile</h1>
        </div>
        <Link href="/profile" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700">
          View profile
        </Link>
      </div>

      {notice ? <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800" aria-live="polite">{notice}</div> : null}
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{error}</div> : null}

      {isLoading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500" aria-busy="true">Loading profile editor...</div> : null}

      {!isLoading ? (
        <div className="space-y-5">
          <Section title="Basic profile">
            <form onSubmit={saveBasic} className="grid gap-4 md:grid-cols-2">
              <Field label="Name" value={basicForm.name} required onChange={(name) => setBasicForm((current) => ({ ...current, name }))} />
              <Field label="Username" value={basicForm.username} required onChange={(username) => setBasicForm((current) => ({ ...current, username }))} />
              <Field label="Profile photo URL" value={basicForm.profilePhotoUrl} onChange={(profilePhotoUrl) => setBasicForm((current) => ({ ...current, profilePhotoUrl }))} />
              <Field label="Headline" value={basicForm.headline} onChange={(headline) => setBasicForm((current) => ({ ...current, headline }))} />
              <Field label="Country" value={basicForm.country} onChange={(country) => setBasicForm((current) => ({ ...current, country }))} />
              <Field label="State" value={basicForm.state} onChange={(state) => setBasicForm((current) => ({ ...current, state }))} />
              <Field label="City" value={basicForm.city} onChange={(city) => setBasicForm((current) => ({ ...current, city }))} />
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                <select value={basicForm.status} onChange={(event) => setBasicForm((current) => ({ ...current, status: event.target.value }))} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                  <option value="ACTIVELY_LOOKING">Actively Looking</option>
                  <option value="OPEN_TO_OPPORTUNITIES">Open To Opportunities</option>
                  <option value="NOT_LOOKING">Not Looking</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Availability</span>
                <select value={basicForm.availability} onChange={(event) => setBasicForm((current) => ({ ...current, availability: event.target.value }))} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                  <option value="">Not set</option>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="ADVISORY">Advisory</option>
                  <option value="INVESTOR_ONLY">Investor Only</option>
                </select>
              </label>
              <div className="md:col-span-2">
                <TextArea label="Bio" value={basicForm.bio} onChange={(bio) => setBasicForm((current) => ({ ...current, bio }))} />
              </div>
              <button disabled={savingKey === "basic"} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">
                {savingKey === "basic" ? "Saving..." : "Save profile"}
              </button>
            </form>
          </Section>

          <Section title="Skills, industries, interests, and communities">
            <div className="grid gap-4 lg:grid-cols-2">
              <TextArea label="Skill IDs" value={skillIds} onChange={setSkillIds} rows={5} />
              <TextArea label="Industry IDs" value={industryIds} onChange={setIndustryIds} rows={5} />
              <TextArea label="Interest IDs" value={interestIds} onChange={setInterestIds} rows={5} />
              <TextArea label="Community IDs" value={communityIds} onChange={setCommunityIds} rows={5} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void replaceSkills()} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Save skills</button>
              <button type="button" onClick={() => void replaceIds("industries", "/api/profiles/me/industries", industryIds, "Industries updated.")} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Save industries</button>
              <button type="button" onClick={() => void replaceIds("interests", "/api/profiles/me/interests", interestIds, "Interests updated.")} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Save interests</button>
              <button type="button" onClick={() => void replaceIds("communities", "/api/profiles/me/communities", communityIds, "Communities updated.")} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Save communities</button>
            </div>
          </Section>

          <Section title="Add experience">
            <form onSubmit={addExperience} className="grid gap-4 md:grid-cols-2">
              <Field label="Company" required value={experienceForm.companyName} onChange={(companyName) => setExperienceForm((current) => ({ ...current, companyName }))} />
              <Field label="Title" required value={experienceForm.title} onChange={(title) => setExperienceForm((current) => ({ ...current, title }))} />
              <Field label="Industry ID" value={experienceForm.industryId} onChange={(industryId) => setExperienceForm((current) => ({ ...current, industryId }))} />
              <Field label="Start date" type="date" value={experienceForm.startDate} onChange={(startDate) => setExperienceForm((current) => ({ ...current, startDate }))} />
              <Field label="End date" type="date" value={experienceForm.endDate} onChange={(endDate) => setExperienceForm((current) => ({ ...current, endDate }))} />
              <div className="md:col-span-2">
                <TextArea label="Description" value={experienceForm.description} onChange={(description) => setExperienceForm((current) => ({ ...current, description }))} />
              </div>
              <button disabled={savingKey === "experience"} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">Add experience</button>
            </form>
          </Section>

          <Section title="Add education">
            <form onSubmit={addEducation} className="grid gap-4 md:grid-cols-2">
              <Field label="Institution" required value={educationForm.institution} onChange={(institution) => setEducationForm((current) => ({ ...current, institution }))} />
              <Field label="Degree" value={educationForm.degree} onChange={(degree) => setEducationForm((current) => ({ ...current, degree }))} />
              <Field label="Field" value={educationForm.field} onChange={(field) => setEducationForm((current) => ({ ...current, field }))} />
              <Field label="Start date" type="date" value={educationForm.startDate} onChange={(startDate) => setEducationForm((current) => ({ ...current, startDate }))} />
              <Field label="End date" type="date" value={educationForm.endDate} onChange={(endDate) => setEducationForm((current) => ({ ...current, endDate }))} />
              <div className="md:col-span-2">
                <TextArea label="Description" value={educationForm.description} onChange={(description) => setEducationForm((current) => ({ ...current, description }))} />
              </div>
              <button disabled={savingKey === "education"} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">Add education</button>
            </form>
          </Section>

          <Section title="Add portfolio link">
            <form onSubmit={addPortfolio} className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
                <select value={portfolioForm.type} onChange={(event) => setPortfolioForm((current) => ({ ...current, type: event.target.value }))} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                  <option value="GITHUB">GitHub</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="WEBSITE">Website</option>
                  <option value="RESUME">Resume</option>
                  <option value="PITCH_DECK">Pitch Deck</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <Field label="Label" value={portfolioForm.label} onChange={(label) => setPortfolioForm((current) => ({ ...current, label }))} />
              <Field label="URL" required type="url" value={portfolioForm.url} onChange={(url) => setPortfolioForm((current) => ({ ...current, url }))} />
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={portfolioForm.isPrimary} onChange={(event) => setPortfolioForm((current) => ({ ...current, isPrimary: event.target.checked }))} />
                Primary link
              </label>
              <button disabled={savingKey === "portfolio"} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">Add portfolio</button>
            </form>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
