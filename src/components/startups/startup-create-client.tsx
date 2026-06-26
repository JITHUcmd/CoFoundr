"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildStartupPayload, StartupForm } from "./startup-form";
import type { ApiFailure, StartupResponse } from "./startup.types";
import { formatError } from "./startup-utils";

async function readJson(response: Response) {
  return (await response.json().catch(() => null)) as StartupResponse | ApiFailure | null;
}

export function StartupCreateClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function createStartup(values: Parameters<typeof buildStartupPayload>[0]) {
    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/startups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildStartupPayload(values)),
      });
      const payload = await readJson(response);

      if (!response.ok || !payload?.success) {
        setError(formatError(payload as ApiFailure | null, "Unable to create startup."));
        return;
      }

      setNotice("Startup created. Opening details...");
      router.push(`/startups/${payload.data.startup.id}`);
      router.refresh();
    } catch {
      setError("Unable to create startup. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Startups</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Create startup</h1>
        </div>
        <Link href="/startups" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700">
          Back to startups
        </Link>
      </div>

      <StartupForm
        isSubmitting={isSubmitting}
        submitLabel="Create startup"
        error={error}
        notice={notice}
        onSubmit={(values) => void createStartup(values)}
      />
    </div>
  );
}
