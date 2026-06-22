import type { UserType } from "@prisma/client";
import type { Session } from "next-auth";
import { AppError } from "@/lib/errors/app-error";

export function requireAuthenticated(session: Session | null) {
  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "Authentication is required.", 401);
  }

  return session.user;
}

export function requireAnyRole(session: Session | null, allowedRoles: UserType[]) {
  const user = requireAuthenticated(session);
  const hasRole = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    throw new AppError("FORBIDDEN", "You do not have access to this resource.", 403);
  }

  return user;
}
