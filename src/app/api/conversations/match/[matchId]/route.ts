import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { messageService } from "@/services/messaging/message.service";
import { conversationMatchParamsSchema } from "@/validators/messaging.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = conversationMatchParamsSchema.parse(await context.params);
    const conversation = await messageService.getConversationByMatchId(user.id, params.matchId);

    return ok({ conversation });
  } catch (error) {
    return fail(error);
  }
}
