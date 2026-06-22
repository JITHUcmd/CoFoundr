import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { messageService } from "@/services/messaging/message.service";
import { messageIdParamsSchema } from "@/validators/messaging.validators";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = messageIdParamsSchema.parse(await context.params);
    const receipt = await messageService.markMessageRead(user.id, params.id);

    return ok({ receipt });
  } catch (error) {
    return fail(error);
  }
}
