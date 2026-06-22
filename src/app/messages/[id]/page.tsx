import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ConversationDetailClient } from "@/components/messages/conversation-detail-client";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const [session, resolvedParams] = await Promise.all([auth(), params]);
  const userId = session?.user?.id ?? "";

  return (
    <DashboardShell userName={session?.user?.name}>
      <ConversationDetailClient conversationId={resolvedParams.id} currentUserId={userId} />
    </DashboardShell>
  );
}
