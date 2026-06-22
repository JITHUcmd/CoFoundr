import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { messageService } from "@/services/messaging/message.service";
import {
  messageIdParamsSchema,
  messageUpdateSchema
} from "@/validators/messaging.validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = messageIdParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = messageUpdateSchema.parse(body);
    const message = await messageService.editMessage(user.id, params.id, input.content);

    return ok({ message });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = messageIdParamsSchema.parse(await context.params);
    const message = await messageService.deleteMessage(user.id, params.id);

    return ok({ message });
  } catch (error) {
    return fail(error);
  }
}
