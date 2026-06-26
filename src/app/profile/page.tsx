import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProfileViewClient } from "@/components/profile/profile-view-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  return (
    <DashboardShell userName={session?.user?.name}>
      <ProfileViewClient />
    </DashboardShell>
  );
}
