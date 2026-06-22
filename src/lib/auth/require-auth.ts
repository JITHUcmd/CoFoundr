import { auth } from "@/auth";
import { requireAnyRole, requireAuthenticated } from "@/services/auth/auth.policy";
import type { UserType } from "@prisma/client";

export async function getRequiredSessionUser() {
  const session = await auth();
  return requireAuthenticated(session);
}

export async function getRequiredRoleUser(allowedRoles: UserType[]) {
  const session = await auth();
  return requireAnyRole(session, allowedRoles);
}
