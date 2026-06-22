import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { messageService } from "@/services/messaging/message.service";
import { messagingPaginationSchema } from "@/validators/messaging.validators";

export async function GET(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const pagination = messagingPaginationSchema.parse(query);
    const conversations = await messageService.listConversations(user.id, pagination);

    return ok(conversations);
  } catch (error) {
    return fail(error);
  }
}
