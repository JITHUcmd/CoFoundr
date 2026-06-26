import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StartupCreateClient } from "@/components/startups/startup-create-client";

export const dynamic = "force-dynamic";

export default async function NewStartupPage() {
  const session = await auth();

  return (
    <DashboardShell userName={session?.user?.name}>
      <StartupCreateClient />
    </DashboardShell>
  );
}
