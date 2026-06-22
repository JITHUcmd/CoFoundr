import { auth } from "@/auth";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();

  return (
    <DashboardShell userName={session?.user?.name}>
      <AnalyticsClient />
    </DashboardShell>
  );
}
