import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardWidget } from "@/components/dashboard/dashboard-widget";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type CountApiResponse = {
  success: boolean;
  data?: {
    unread?: number;
  };
};

async function fetchUnreadCount(path: string) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  if (!host) {
    return null;
  }

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const cookie = requestHeaders.get("cookie") ?? "";
  const response = await fetch(`${protocol}://${host}${path}`, {
    cache: "no-store",
    headers: {
      cookie,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as CountApiResponse | null;
  return payload?.success ? (payload.data?.unread ?? null) : null;
}

const baseWidgets = [
  {
    title: "Profile Completion",
    value: "Ready",
    description: "Complete your profile, skills, portfolio links, and founder vision to improve discovery quality.",
    accent: "teal" as const,
  },
  {
    title: "Discovery",
    value: "Open",
    description: "Browse recommended founders, startups, and opportunities once your profile is ready.",
    accent: "amber" as const,
  },
  {
    title: "Matches",
    value: "Active",
    description: "Accepted matches and mutual right swipes will appear here with compatibility context.",
    accent: "emerald" as const,
  },
  {
    title: "Messages",
    value: "Synced",
    description: "Matched conversations use the existing messaging routes and unread-count visibility rules.",
    accent: "slate" as const,
  },
  {
    title: "Notifications",
    value: "Live",
    description: "Match, message, application, discovery, verification, and system updates are grouped here.",
    accent: "rose" as const,
  },
];

export default async function DashboardPage() {
  const [session, unreadMessages, unreadNotifications] = await Promise.all([
    auth(),
    fetchUnreadCount("/api/messages/unread-count"),
    fetchUnreadCount("/api/notifications/unread-count"),
  ]);

  const widgets = baseWidgets.map((widget) => {
    if (widget.title === "Messages" && unreadMessages !== null) {
      return { ...widget, value: String(unreadMessages) };
    }

    if (widget.title === "Notifications" && unreadNotifications !== null) {
      return { ...widget, value: String(unreadNotifications) };
    }

    return widget;
  });

  return (
    <DashboardShell userName={session?.user?.name}>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Overview</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Welcome{session?.user?.name ? `, ${session.user.name}` : ""}.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This workspace is ready for profile completion, discovery, matching, messaging, and notifications as the
            product modules come online.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {widgets.map((widget) => (
            <DashboardWidget key={widget.title} {...widget} />
          ))}
        </section>
      </div>
    </DashboardShell>
  );
}
