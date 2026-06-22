import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { notificationService } from "@/services/notifications/notification.service";
import { notificationIdParamsSchema } from "@/validators/notification.validators";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = notificationIdParamsSchema.parse(await context.params);
    const notification = await notificationService.markRead(user.id, params.id);

    return ok({ notification });
  } catch (error) {
    return fail(error);
  }
}
