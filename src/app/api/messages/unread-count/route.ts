import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { messageService } from "@/services/messaging/message.service";

export async function GET() {
  try {
    const user = await getRequiredSessionUser();
    const unread = await messageService.getUnreadCount(user.id);

    return ok({ unread });
  } catch (error) {
    return fail(error);
  }
}
