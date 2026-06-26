import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FounderVisionEditClient } from "@/components/founder-vision/founder-vision-edit-client";

export const dynamic = "force-dynamic";

export default async function FounderVisionEditPage() {
  const session = await auth();

  return (
    <DashboardShell userName={session?.user?.name}>
      <FounderVisionEditClient />
    </DashboardShell>
  );
}
