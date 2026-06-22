import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MessagesClient } from "@/components/messages/messages-client";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  return (
    <DashboardShell userName={session?.user?.name}>
      <MessagesClient currentUserId={userId} />
    </DashboardShell>
  );
}
