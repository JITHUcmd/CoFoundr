import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { notificationService } from "@/services/notifications/notification.service";
import { notificationListQuerySchema } from "@/validators/notification.validators";

export async function GET(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const filters = notificationListQuerySchema.parse(query);
    const notifications = await notificationService.listNotifications(user.id, filters);

    return ok(notifications);
  } catch (error) {
    return fail(error);
  }
}
