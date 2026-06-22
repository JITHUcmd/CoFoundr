import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { messageService } from "@/services/messaging/message.service";
import { conversationIdParamsSchema } from "@/validators/messaging.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = conversationIdParamsSchema.parse(await context.params);
    const conversation = await messageService.getConversation(user.id, params.id);

    return ok({ conversation });
  } catch (error) {
    return fail(error);
  }
}
