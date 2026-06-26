import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StartupDetailClient } from "@/components/startups/startup-detail-client";

export const dynamic = "force-dynamic";

export default async function StartupDetailPage({
  params,
}: {
  params: Promise<{ startupId: string }>;
}) {
  const [session, resolvedParams] = await Promise.all([auth(), params]);

  return (
    <DashboardShell userName={session?.user?.name}>
      <StartupDetailClient startupId={resolvedParams.startupId} />
    </DashboardShell>
  );
}
