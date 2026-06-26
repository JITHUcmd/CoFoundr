import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StartupListClient } from "@/components/startups/startup-list-client";

export const dynamic = "force-dynamic";

export default async function StartupsPage() {
  const session = await auth();

  return (
    <DashboardShell userName={session?.user?.name}>
      <StartupListClient />
    </DashboardShell>
  );
}
