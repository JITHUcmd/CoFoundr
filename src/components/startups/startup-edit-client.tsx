"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildStartupPayload,
  StartupForm,
  startupToForm,
  type StartupFormValues,
} from "./startup-form";
import type {
  ApiFailure,
  Startup,
  StartupMember,
  StartupMemberResponse,
  StartupResponse,
  StartupVerificationResponse,
} from "./startup.types";
import { formatDate, formatEnum, formatError, isUuid, isValidUrlOrEmpty } from "./startup-utils";

const memberRoleOptions = [
  "CEO",
  "CTO",
  "COO",
  "TECHNICAL_CO_FOUNDER",
  "PRODUCT_LEAD",
  "ADVISOR",
  "INVESTOR",
];

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | ApiFailure | null;
}

function labelFor(value: string) {
  return formatEnum(value);
}

function MemberManager({
  startupId,
  members,
  onChanged,
}: {
  startupId: string;
  members: StartupMember[];
  onChanged: () => void;
}) {
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("ADVISOR");
  const [newIsFounder, setNewIsFounder] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!isUuid(newUserId.trim())) {
      setError("User ID must be a valid UUID.");
      return;
    }

    setBusyKey("add");

    try {
      const response = await fetch(`/api/startups/${startupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: newUserId.trim(),
          role: newRole,
          isFounder: newIsFounder,
        }),
      });
      const payload = await readJson<StartupMemberResponse>(response);

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to add member."));
        return;
      }

      setNotice("Member added.");
      setNewUserId("");
      onChanged();
    } catch {
      setError("Unable to add member. Check your connection and try again.");
    } finally {
      setBusyKey(null);
    }
  }

  async function updateMember(member: StartupMember, role: string, isFounder: boolean) {
    setBusyKey(member.id);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/startups/${startupId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, isFounder }),
      });
      const payload = await readJson<StartupMemberResponse>(response);

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to update member."));
        return;
      }

      setNotice("Member updated.");
      onChanged();
    } catch {
      setError("Unable to update member. Check your connection and try again.");
    } finally {
      setBusyKey(null);
    }
  }

  async function removeMember(member: StartupMember) {
    const confirmed = window.confirm(`Remove ${member.user.name} from this startup?`);
    if (!confirmed) return;

    setBusyKey(member.id);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/startups/${startupId}/members/${member.id}`, {
        method: "DELETE",
      });
      const payload = await readJson<{ success: true; data: { removed: boolean } }>(response);

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to remove member."));
        return;
      }

      setNotice("Member removed.");
      onChanged();
    } catch {
      setError("Unable to remove member. Check your connection and try again.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Members</h2>
      {notice ? <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800" aria-live="polite">{notice}</div> : null}
      {error ? <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{error}</div> : null}

      <form onSubmit={addMember} className="mt-4 grid gap-4 md:grid-cols-[1fr_220px_auto_auto] md:items-end">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</span>
          <input
            value={newUserId}
            onChange={(event) => setNewUserId(event.target.value)}
            aria-invalid={Boolean(newUserId && !isUuid(newUserId))}
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 aria-[invalid=true]:border-rose-400"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
          <select value={newRole} onChange={(event) => setNewRole(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
            {memberRoleOptions.map((role) => <option key={role} value={role}>{labelFor(role)}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={newIsFounder} onChange={(event) => setNewIsFounder(event.target.checked)} />
          Founder
        </label>
        <button disabled={busyKey === "add"} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">
          {busyKey === "add" ? "Adding..." : "Add member"}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {members.length ? members.map((member) => (
          <article key={member.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{member.user.name}</p>
                <p className="text-sm text-slate-600">@{member.user.username} - joined {formatDate(member.joinedAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  defaultValue={member.role}
                  onChange={(event) => void updateMember(member, event.target.value, member.isFounder)}
                  disabled={busyKey === member.id}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  aria-label={`Role for ${member.user.name}`}
                >
                  {memberRoleOptions.map((role) => <option key={role} value={role}>{labelFor(role)}</option>)}
                </select>
                <button
                  type="button"
                  disabled={busyKey === member.id}
                  onClick={() => void updateMember(member, member.role, !member.isFounder)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:text-slate-400"
                >
                  {member.isFounder ? "Founder" : "Mark founder"}
                </button>
                <button
                  type="button"
                  disabled={busyKey === member.id}
                  onClick={() => void removeMember(member)}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 disabled:text-rose-300"
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        )) : <p className="text-sm text-slate-500">No members returned by the startup detail API.</p>}
      </div>
    </section>
  );
}

function VerificationPanel({
  startupId,
  status,
  onChanged,
}: {
  startupId: string;
  status: string;
  onChanged: () => void;
}) {
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function requestVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!isValidUrlOrEmpty(evidenceUrl)) {
      setError("Evidence URL must be a valid URL.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/startups/${startupId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceUrl: evidenceUrl.trim() || null }),
      });
      const payload = await readJson<StartupVerificationResponse>(response);

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to request verification."));
        return;
      }

      setNotice("Verification request submitted.");
      setEvidenceUrl("");
      onChanged();
    } catch {
      setError("Unable to request verification. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Verification</h2>
      <p className="mt-2 text-sm text-slate-600">Current status: <span className="font-semibold text-slate-950">{formatEnum(status)}</span></p>
      {notice ? <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800" aria-live="polite">{notice}</div> : null}
      {error ? <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{error}</div> : null}
      <form onSubmit={requestVerification} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evidence URL</span>
          <input
            type="url"
            value={evidenceUrl}
            onChange={(event) => setEvidenceUrl(event.target.value)}
            aria-invalid={Boolean(evidenceUrl && !isValidUrlOrEmpty(evidenceUrl))}
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 aria-[invalid=true]:border-rose-400"
          />
        </label>
        <button disabled={isSubmitting} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">
          {isSubmitting ? "Submitting..." : "Request verification"}
        </button>
      </form>
    </section>
  );
}

export function StartupEditClient({ startupId }: { startupId: string }) {
  const [startup, setStartup] = useState<Startup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const initialValues = useMemo(() => startup ? startupToForm(startup) : undefined, [startup]);

  const loadStartup = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/startups/${startupId}`, { cache: "no-store" });
      const payload = await readJson<StartupResponse>(response);

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to load startup."));
        setStartup(null);
        return;
      }

      setStartup(payload.data.startup);
      setIsDirty(false);
    } catch {
      setError("Unable to load startup. Check your connection and try again.");
      setStartup(null);
    } finally {
      setIsLoading(false);
    }
  }, [startupId]);

  useEffect(() => {
    void loadStartup();
  }, [loadStartup]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function saveStartup(values: StartupFormValues) {
    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/startups/${startupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildStartupPayload(values)),
      });
      const payload = await readJson<StartupResponse>(response);

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to save startup."));
        return;
      }

      setStartup(payload.data.startup);
      setIsDirty(false);
      setNotice("Startup saved.");
    } catch {
      setError("Unable to save startup. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmCancel(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!isDirty) return;
    const confirmed = window.confirm("Discard unsaved startup changes?");
    if (!confirmed) event.preventDefault();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Startups</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Edit startup</h1>
        </div>
        <Link href={`/startups/${startupId}`} onClick={confirmCancel} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700">
          Cancel
        </Link>
      </div>

      {error ? <div ref={errorRef} tabIndex={-1} className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{error}</div> : null}
      {isLoading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500" aria-busy="true">Loading startup editor...</div> : null}

      {!isLoading && !startup ? (
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Startup not found</h2>
          <p className="mt-2 text-sm text-slate-600">This startup may have been archived or you may not have access.</p>
        </section>
      ) : null}

      {!isLoading && startup && initialValues ? (
        <div className="space-y-6">
          <StartupForm
            initialValues={initialValues}
            isSubmitting={isSubmitting}
            submitLabel="Save startup"
            error={null}
            notice={notice}
            onDirtyChange={setIsDirty}
            onSubmit={(values) => void saveStartup(values)}
          />
          <VerificationPanel startupId={startupId} status={startup.verificationStatus} onChanged={() => void loadStartup()} />
          <MemberManager startupId={startupId} members={startup.members} onChanged={() => void loadStartup()} />
        </div>
      ) : null}
    </div>
  );
}
