"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Startup } from "./startup.types";
import {
  isUuid,
  isValidUrlOrEmpty,
  toNullableNumber,
  toNullableString,
  toOptionalNumber,
} from "./startup-utils";

export type StartupFormValues = {
  name: string;
  slug: string;
  logoUrl: string;
  coverImageUrl: string;
  tagline: string;
  description: string;
  website: string;
  industryId: string;
  startupStage: string;
  foundedDate: string;
  teamSize: string;
  country: string;
  state: string;
  city: string;
  remoteAllowed: boolean;
  workStyle: string;
  fundingStage: string;
  fundingTargetAmount: string;
  hiringStatus: string;
  openRolesCount: string;
  equityAvailable: boolean;
  salaryAvailable: boolean;
};

export const emptyStartupForm: StartupFormValues = {
  name: "",
  slug: "",
  logoUrl: "",
  coverImageUrl: "",
  tagline: "",
  description: "",
  website: "",
  industryId: "",
  startupStage: "IDEA",
  foundedDate: "",
  teamSize: "",
  country: "",
  state: "",
  city: "",
  remoteAllowed: true,
  workStyle: "",
  fundingStage: "BOOTSTRAPPED",
  fundingTargetAmount: "",
  hiringStatus: "NOT_HIRING",
  openRolesCount: "0",
  equityAvailable: false,
  salaryAvailable: false,
};

export function startupToForm(startup: Startup): StartupFormValues {
  return {
    name: startup.name ?? "",
    slug: startup.slug ?? "",
    logoUrl: startup.logoUrl ?? "",
    coverImageUrl: startup.coverImageUrl ?? "",
    tagline: startup.tagline ?? "",
    description: startup.description ?? "",
    website: startup.website ?? "",
    industryId: startup.industryId ?? "",
    startupStage: startup.startupStage ?? "IDEA",
    foundedDate: startup.foundedDate ? startup.foundedDate.slice(0, 10) : "",
    teamSize: startup.teamSize ? String(startup.teamSize) : "",
    country: startup.country ?? "",
    state: startup.state ?? "",
    city: startup.city ?? "",
    remoteAllowed: startup.remoteAllowed ?? true,
    workStyle: startup.workStyle ?? "",
    fundingStage: startup.fundingStage ?? "BOOTSTRAPPED",
    fundingTargetAmount: startup.fundingTargetAmount ? String(startup.fundingTargetAmount) : "",
    hiringStatus: startup.hiringStatus ?? "NOT_HIRING",
    openRolesCount: String(startup.openRolesCount ?? 0),
    equityAvailable: startup.equityAvailable ?? false,
    salaryAvailable: startup.salaryAvailable ?? false,
  };
}

export function buildStartupPayload(values: StartupFormValues) {
  return {
    name: values.name.trim(),
    slug: values.slug.trim().toLowerCase(),
    logoUrl: toNullableString(values.logoUrl),
    coverImageUrl: toNullableString(values.coverImageUrl),
    tagline: toNullableString(values.tagline),
    description: toNullableString(values.description),
    website: toNullableString(values.website),
    industryId: toNullableString(values.industryId),
    startupStage: values.startupStage,
    foundedDate: toNullableString(values.foundedDate),
    teamSize: toNullableNumber(values.teamSize),
    country: toNullableString(values.country),
    state: toNullableString(values.state),
    city: toNullableString(values.city),
    remoteAllowed: values.remoteAllowed,
    workStyle: values.workStyle || null,
    fundingStage: values.fundingStage,
    fundingTargetAmount: toNullableNumber(values.fundingTargetAmount),
    hiringStatus: values.hiringStatus,
    openRolesCount: toOptionalNumber(values.openRolesCount) ?? 0,
    equityAvailable: values.equityAvailable,
    salaryAvailable: values.salaryAvailable,
  };
}

type StartupFormProps = {
  initialValues?: StartupFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  error: string | null;
  notice?: string | null;
  onSubmit: (values: StartupFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

const startupStageOptions = ["IDEA", "MVP", "PRE_SEED", "SEED", "SERIES_A_PLUS", "BETA", "REVENUE", "SCALING"];
const fundingStageOptions = ["BOOTSTRAPPED", "FUNDRAISING_NOW", "PRE_SEED", "SEED", "SERIES_A_PLUS", "SERIES_A", "SERIES_B", "FUNDRAISING"];
const hiringStatusOptions = ["NOT_HIRING", "HIRING", "PAUSED"];
const workStyleOptions = ["", "REMOTE", "HYBRID", "IN_PERSON"];

function labelFor(value: string) {
  if (!value) return "Not set";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  required = false,
}: {
  label: string;
  name: keyof StartupFormValues;
  value: string;
  onChange: (name: keyof StartupFormValues, value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  const errorId = error ? `${String(name)}-error` : undefined;

  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 aria-[invalid=true]:border-rose-400"
      />
      {error ? <span id={errorId} className="mt-1 block text-xs font-medium text-rose-700">{error}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: keyof StartupFormValues;
  value: string;
  onChange: (name: keyof StartupFormValues, value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {labelFor(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-teal-700"
      />
      {label}
    </label>
  );
}

export function StartupForm({
  initialValues = emptyStartupForm,
  isSubmitting,
  submitLabel,
  error,
  notice,
  onSubmit,
  onDirtyChange,
}: StartupFormProps) {
  const [values, setValues] = useState<StartupFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLDivElement | null>(null);

  const serializedInitialValues = useMemo(() => JSON.stringify(initialValues), [initialValues]);
  const isDirty = JSON.stringify(values) !== serializedInitialValues;

  useEffect(() => {
    setValues(initialValues);
  }, [serializedInitialValues, initialValues]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  function updateField(name: keyof StartupFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!values.name.trim()) nextErrors.name = "Startup name is required.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim())) {
      nextErrors.slug = "Use lowercase letters, numbers, and single hyphens.";
    }
    if (values.industryId.trim() && !isUuid(values.industryId.trim())) {
      nextErrors.industryId = "Industry ID must be a valid UUID.";
    }
    if (!isValidUrlOrEmpty(values.logoUrl)) nextErrors.logoUrl = "Enter a valid URL.";
    if (!isValidUrlOrEmpty(values.coverImageUrl)) nextErrors.coverImageUrl = "Enter a valid URL.";
    if (!isValidUrlOrEmpty(values.website)) nextErrors.website = "Enter a valid URL.";

    const teamSize = toNullableNumber(values.teamSize);
    if (teamSize !== null && (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > 10000)) {
      nextErrors.teamSize = "Team size must be between 1 and 10000.";
    }

    const fundingTargetAmount = toNullableNumber(values.fundingTargetAmount);
    if (fundingTargetAmount !== null && (Number.isNaN(fundingTargetAmount) || fundingTargetAmount < 0 || fundingTargetAmount > 1_000_000_000)) {
      nextErrors.fundingTargetAmount = "Funding target must be between 0 and 1,000,000,000.";
    }

    const openRolesCount = toOptionalNumber(values.openRolesCount);
    if (openRolesCount !== undefined && (!Number.isInteger(openRolesCount) || openRolesCount < 0 || openRolesCount > 1000)) {
      nextErrors.openRolesCount = "Open roles must be between 0 and 1000.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;
    onSubmit(values);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {notice ? <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800" aria-live="polite">{notice}</div> : null}
      {error ? (
        <div ref={errorRef} tabIndex={-1} className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Core details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Name" name="name" required value={values.name} error={fieldErrors.name} onChange={updateField} />
          <Field label="Slug" name="slug" required value={values.slug} error={fieldErrors.slug} onChange={updateField} />
          <Field label="Logo URL" name="logoUrl" value={values.logoUrl} error={fieldErrors.logoUrl} onChange={updateField} />
          <Field label="Cover Image URL" name="coverImageUrl" value={values.coverImageUrl} error={fieldErrors.coverImageUrl} onChange={updateField} />
          <Field label="Website" name="website" type="url" value={values.website} error={fieldErrors.website} onChange={updateField} />
          <Field label="Industry ID" name="industryId" value={values.industryId} error={fieldErrors.industryId} onChange={updateField} />
          <div className="md:col-span-2">
            <Field label="Tagline" name="tagline" value={values.tagline} onChange={updateField} />
          </div>
          <label className="block md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
            <textarea
              value={values.description}
              rows={5}
              onChange={(event) => updateField("description", event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Stage and location</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField label="Startup stage" name="startupStage" value={values.startupStage} options={startupStageOptions} onChange={updateField} />
          <SelectField label="Funding stage" name="fundingStage" value={values.fundingStage} options={fundingStageOptions} onChange={updateField} />
          <SelectField label="Hiring status" name="hiringStatus" value={values.hiringStatus} options={hiringStatusOptions} onChange={updateField} />
          <SelectField label="Work style" name="workStyle" value={values.workStyle} options={workStyleOptions} onChange={updateField} />
          <Field label="Founded date" name="foundedDate" type="date" value={values.foundedDate} onChange={updateField} />
          <Field label="Team size" name="teamSize" type="number" value={values.teamSize} error={fieldErrors.teamSize} onChange={updateField} />
          <Field label="Country" name="country" value={values.country} onChange={updateField} />
          <Field label="State" name="state" value={values.state} onChange={updateField} />
          <Field label="City" name="city" value={values.city} onChange={updateField} />
          <Field label="Open roles" name="openRolesCount" type="number" value={values.openRolesCount} error={fieldErrors.openRolesCount} onChange={updateField} />
          <Field label="Funding target amount" name="fundingTargetAmount" type="number" value={values.fundingTargetAmount} error={fieldErrors.fundingTargetAmount} onChange={updateField} />
          <div className="grid gap-3 sm:grid-cols-3 md:col-span-2">
            <ToggleField label="Remote allowed" checked={values.remoteAllowed} onChange={(remoteAllowed) => setValues((current) => ({ ...current, remoteAllowed }))} />
            <ToggleField label="Equity available" checked={values.equityAvailable} onChange={(equityAvailable) => setValues((current) => ({ ...current, equityAvailable }))} />
            <ToggleField label="Salary available" checked={values.salaryAvailable} onChange={(salaryAvailable) => setValues((current) => ({ ...current, salaryAvailable }))} />
          </div>
        </div>
      </section>

      <button disabled={isSubmitting} className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400">
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
