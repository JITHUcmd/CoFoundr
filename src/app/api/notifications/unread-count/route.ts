import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { notificationService } from "@/services/notifications/notification.service";

export async function GET() {
  try {
    const user = await getRequiredSessionUser();
    const unread = await notificationService.getUnreadCount(user.id);

    return ok({ unread });
  } catch (error) {
    return fail(error);
  }
}
