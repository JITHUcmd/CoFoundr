import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MatchesClient } from "@/components/matches/matches-client";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const session = await auth();

  return (
    <DashboardShell userName={session?.user?.name}>
      <MatchesClient />
    </DashboardShell>
  );
}
