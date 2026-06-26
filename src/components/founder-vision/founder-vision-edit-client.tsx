"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiFailure, FounderVision, FounderVisionResponse } from "./founder-vision.types";

type VisionForm = {
  startupGoal: string;
  fundingPreference: string;
  riskAppetite: string;
  commitmentLevel: string;
  workStyle: string;
  preferredTeamSize: string;
  preferredCoFounderType: string;
  remotePreference: string;
};

const emptyForm: VisionForm = {
  startupGoal: "",
  fundingPreference: "",
  riskAppetite: "",
  commitmentLevel: "",
  workStyle: "",
  preferredTeamSize: "",
  preferredCoFounderType: "",
  remotePreference: "",
};

function formatError(payload: ApiFailure | null, fallback: string) {
  return payload?.error?.message ?? fallback;
}

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
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
        className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
      >
        <option value="">Not set</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function hydrateForm(vision: FounderVision): VisionForm {
  return {
    startupGoal: vision.startupGoal ?? "",
    fundingPreference: vision.fundingPreference ?? "",
    riskAppetite: vision.riskAppetite ?? "",
    commitmentLevel: vision.commitmentLevel ?? "",
    workStyle: vision.workStyle ?? "",
    preferredTeamSize: vision.preferredTeamSize ? String(vision.preferredTeamSize) : "",
    preferredCoFounderType: vision.preferredCoFounderType ?? "",
    remotePreference: vision.remotePreference ?? "",
  };
}

export function FounderVisionEditClient() {
  const [form, setForm] = useState<VisionForm>(emptyForm);
  const [exists, setExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadVision = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/founder-vision/me", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as FounderVisionResponse | null;

      if (response.status === 404) {
        setExists(false);
        setForm(emptyForm);
        return;
      }

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to load founder vision."));
        return;
      }

      setExists(true);
      setForm(hydrateForm(payload.data.founderVision));
    } catch {
      setError("Unable to load founder vision. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVision();
  }, [loadVision]);

  async function saveVision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);

    const preferredTeamSize = form.preferredTeamSize.trim() ? Number(form.preferredTeamSize) : null;

    if (preferredTeamSize !== null && (!Number.isInteger(preferredTeamSize) || preferredTeamSize < 1 || preferredTeamSize > 20)) {
      setError("Preferred team size must be a whole number between 1 and 20.");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/founder-vision/me", {
        method: exists ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupGoal: form.startupGoal || null,
          fundingPreference: form.fundingPreference || null,
          riskAppetite: form.riskAppetite || null,
          commitmentLevel: form.commitmentLevel || null,
          workStyle: form.workStyle || null,
          preferredTeamSize,
          preferredCoFounderType: nullable(form.preferredCoFounderType),
          remotePreference: form.remotePreference || null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as FounderVisionResponse | null;

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to save founder vision."));
        return;
      }

      setExists(true);
      setForm(hydrateForm(payload.data.founderVision));
      setNotice("Founder vision saved.");
    } catch {
      setError("Unable to save founder vision. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Founder Vision</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Edit founder preferences</h1>
      </section>

      {notice ? <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800" aria-live="polite">{notice}</div> : null}
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{error}</div> : null}

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500" aria-busy="true">
          Loading founder vision...
        </div>
      ) : (
        <form onSubmit={saveVision} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Startup goal"
              value={form.startupGoal}
              onChange={(startupGoal) => setForm((current) => ({ ...current, startupGoal }))}
              options={[
                { value: "UNICORN", label: "Unicorn" },
                { value: "VENTURE_BACKED_STARTUP", label: "Venture Backed Startup" },
                { value: "BOOTSTRAPPED_SAAS", label: "Bootstrapped SaaS" },
                { value: "LIFESTYLE_BUSINESS", label: "Lifestyle Business" },
                { value: "AGENCY", label: "Agency" },
                { value: "OPEN_SOURCE", label: "Open Source" },
                { value: "SOCIAL_IMPACT", label: "Social Impact" },
                { value: "AI_STARTUP", label: "AI Startup" },
                { value: "E_COMMERCE", label: "E-Commerce" },
                { value: "SIDE_PROJECT", label: "Side Project" },
              ]}
            />
            <SelectField
              label="Funding preference"
              value={form.fundingPreference}
              onChange={(fundingPreference) => setForm((current) => ({ ...current, fundingPreference }))}
              options={[
                { value: "BOOTSTRAPPED", label: "Bootstrapped" },
                { value: "ANGEL_FUNDING", label: "Angel Funding" },
                { value: "VENTURE_CAPITAL", label: "Venture Capital" },
                { value: "CROWDFUNDING", label: "Crowdfunding" },
              ]}
            />
            <SelectField
              label="Risk appetite"
              value={form.riskAppetite}
              onChange={(riskAppetite) => setForm((current) => ({ ...current, riskAppetite }))}
              options={[
                { value: "LOW", label: "Low" },
                { value: "MEDIUM", label: "Medium" },
                { value: "HIGH", label: "High" },
              ]}
            />
            <SelectField
              label="Commitment"
              value={form.commitmentLevel}
              onChange={(commitmentLevel) => setForm((current) => ({ ...current, commitmentLevel }))}
              options={[
                { value: "EXPLORING", label: "Exploring" },
                { value: "PART_TIME", label: "Part Time" },
                { value: "FULL_TIME", label: "Full Time" },
              ]}
            />
            <SelectField
              label="Work style"
              value={form.workStyle}
              onChange={(workStyle) => setForm((current) => ({ ...current, workStyle }))}
              options={[
                { value: "REMOTE", label: "Remote" },
                { value: "HYBRID", label: "Hybrid" },
                { value: "IN_PERSON", label: "In Person" },
              ]}
            />
            <SelectField
              label="Remote preference"
              value={form.remotePreference}
              onChange={(remotePreference) => setForm((current) => ({ ...current, remotePreference }))}
              options={[
                { value: "REMOTE", label: "Remote" },
                { value: "HYBRID", label: "Hybrid" },
                { value: "IN_PERSON", label: "In Person" },
              ]}
            />
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred team size</span>
              <input
                type="number"
                min={1}
                max={20}
                value={form.preferredTeamSize}
                onChange={(event) => setForm((current) => ({ ...current, preferredTeamSize: event.target.value }))}
                className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred co-founder type</span>
              <input
                type="text"
                value={form.preferredCoFounderType}
                onChange={(event) => setForm((current) => ({ ...current, preferredCoFounderType: event.target.value }))}
                className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </label>
          </div>
          <button disabled={isSaving} className="mt-5 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">
            {isSaving ? "Saving..." : "Save founder vision"}
          </button>
        </form>
      )}
    </div>
  );
}
