import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MatchDetailClient } from "@/components/matches/match-detail-client";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [session, resolvedParams] = await Promise.all([auth(), params]);

  return (
    <DashboardShell userName={session?.user?.name}>
      <MatchDetailClient matchId={resolvedParams.id} />
    </DashboardShell>
  );
}
