"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

type SignupFormProps = {
  callbackUrl?: string;
};

type SignupFields = {
  name: string;
  username: string;
  email: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof SignupFields | "form", string>>;

type ApiErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

export function SignupForm({ callbackUrl = "/dashboard" }: SignupFormProps) {
  const router = useRouter();
  const [fields, setFields] = useState<SignupFields>({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const canSubmit = useMemo(
    () =>
      fields.name.trim().length > 0 &&
      fields.username.trim().length > 0 &&
      fields.email.trim().length > 0 &&
      fields.password.length > 0,
    [fields],
  );

  function updateField(field: keyof SignupFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function validate() {
    const nextErrors: FieldErrors = {};

    if (fields.name.trim().length < 1) {
      nextErrors.name = "Enter your name.";
    }

    if (!/^[a-zA-Z0-9_]{3,32}$/.test(fields.username.trim())) {
      nextErrors.username = "Use 3-32 letters, numbers, or underscores.";
    }

    if (!fields.email.includes("@")) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (fields.password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    } else if (!/[A-Z]/.test(fields.password) || !/[a-z]/.test(fields.password) || !/[0-9]/.test(fields.password)) {
      nextErrors.password = "Use uppercase, lowercase, and a number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/auth/email/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fields.name.trim(),
        username: fields.username.trim().toLowerCase(),
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
        roles: ["FOUNDER"],
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      setErrors({ form: payload?.error?.message ?? "Unable to create your account." });
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email: fields.email.trim().toLowerCase(),
      password: fields.password,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      router.push("/login");
      return;
    }

    router.push(result.url ?? callbackUrl);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Start building</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Create your CoFoundr account</h1>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={fields.name}
            onChange={(event) => updateField("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            placeholder="Aditi Menon"
          />
          {errors.name ? <p className="mt-2 text-sm text-rose-600">{errors.name}</p> : null}
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-700">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={fields.username}
            onChange={(event) => updateField("username", event.target.value)}
            aria-invalid={Boolean(errors.username)}
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            placeholder="aditi_builder"
          />
          {errors.username ? <p className="mt-2 text-sm text-rose-600">{errors.username}</p> : null}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            placeholder="you@company.com"
          />
          {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email}</p> : null}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={fields.password}
            onChange={(event) => updateField("password", event.target.value)}
            aria-invalid={Boolean(errors.password)}
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            placeholder="Create a strong password"
          />
          {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password}</p> : null}
        </div>

        {errors.form ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errors.form}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting || isGoogleLoading}
          className="flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting || isGoogleLoading}
        className="mt-3 flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGoogleLoading ? "Connecting..." : "Continue with Google"}
      </button>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">
          Log in
        </Link>
      </p>
    </div>
  );
}
