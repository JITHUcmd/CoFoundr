import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const features = [
  {
    title: "Founder discovery",
    description: "Explore builders by skills, industries, location, availability, and founder vision.",
  },
  {
    title: "Startup opportunities",
    description: "Browse startup roles across co-founder, advisor, investor, developer, and product tracks.",
  },
  {
    title: "Match-first messaging",
    description: "Start conversations only after mutual interest or accepted opportunity workflows.",
  },
];

const workflow = ["Create profile", "Define founder vision", "Discover people and startups", "Match and collaborate"];

function ProductPreview() {
  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-6 mx-auto hidden max-w-5xl opacity-95 lg:block">
      <div className="rounded-lg border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
        <div className="grid gap-4 lg:grid-cols-[240px_1fr_260px]">
          <div className="rounded-lg bg-white p-4 text-slate-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Profile</p>
            <div className="mt-4 h-3 w-28 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-40 rounded bg-slate-100" />
            <div className="mt-6 space-y-2">
              <div className="h-2 rounded bg-teal-100" />
              <div className="h-2 rounded bg-amber-100" />
              <div className="h-2 rounded bg-rose-100" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 text-slate-950">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Discovery</p>
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">92%</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["Technical Co-Founder", "AI Startup", "Remote"].map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 p-3">
                  <div className="h-16 rounded-md bg-slate-100" />
                  <p className="mt-3 text-xs font-semibold text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 text-slate-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Activity</p>
            <div className="mt-4 space-y-3">
              {["3 new matches", "8 unread messages", "2 applications"].map((item) => (
                <div key={item} className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <SiteHeader />

      <main>
        <section className="relative isolate flex min-h-[calc(100vh-4rem)] items-start overflow-hidden bg-slate-950 px-4 pb-72 pt-20 text-white sm:px-6 lg:px-8 lg:pb-80">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-300">CoFoundr</p>
              <h1 className="mt-5 text-5xl font-semibold leading-tight sm:text-6xl">
                Build your startup team with signal, context, and momentum.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                CoFoundr helps founders discover collaborators, publish startup opportunities, match with the right
                people, and move conversations into focused execution.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="rounded-lg bg-teal-500 px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-teal-400"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
          <ProductPreview />
        </section>

        <section id="features" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Core workflows</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Everything starts with qualified intent.</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-950">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-slate-200 bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">A clearer path from profile to partnership.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {workflow.map((item, index) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="text-sm font-semibold text-amber-700">0{index + 1}</span>
                  <p className="mt-3 font-semibold text-slate-950">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-lg border border-slate-200 bg-slate-950 p-8 text-white md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Start from a sharper network.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Create your profile, define your founder vision, and start discovering collaborators.
              </p>
            </div>
            <Link
              href="/signup"
              className="rounded-lg bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
            >
              Join CoFoundr
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
