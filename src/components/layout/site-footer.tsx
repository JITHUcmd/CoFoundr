import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>CoFoundr connects builders, startups, and early collaborators.</p>
        <div className="flex gap-5">
          <Link href="/login" className="hover:text-slate-950">
            Login
          </Link>
          <Link href="/signup" className="hover:text-slate-950">
            Signup
          </Link>
          <Link href="/dashboard" className="hover:text-slate-950">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
