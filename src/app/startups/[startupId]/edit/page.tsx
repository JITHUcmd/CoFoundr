import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StartupEditClient } from "@/components/startups/startup-edit-client";

export const dynamic = "force-dynamic";

export default async function StartupEditPage({
  params,
}: {
  params: Promise<{ startupId: string }>;
}) {
  const [session, resolvedParams] = await Promise.all([auth(), params]);

  return (
    <DashboardShell userName={session?.user?.name}>
      <StartupEditClient startupId={resolvedParams.startupId} />
    </DashboardShell>
  );
}
