import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProfileEditClient } from "@/components/profile/profile-edit-client";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const session = await auth();

  return (
    <DashboardShell userName={session?.user?.name}>
      <ProfileEditClient />
    </DashboardShell>
  );
}
