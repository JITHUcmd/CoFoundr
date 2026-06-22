import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NotificationsClient } from "@/components/notifications/notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();

  return (
    <DashboardShell userName={session?.user?.name}>
      <NotificationsClient />
    </DashboardShell>
  );
}
