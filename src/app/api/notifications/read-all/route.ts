import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { notificationService } from "@/services/notifications/notification.service";

export async function PATCH() {
  try {
    const user = await getRequiredSessionUser();
    const result = await notificationService.markAllRead(user.id);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
