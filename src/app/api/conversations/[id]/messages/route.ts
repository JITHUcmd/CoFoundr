import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { created, fail, ok } from "@/lib/http/api-response";
import { messageService } from "@/services/messaging/message.service";
import {
  conversationIdParamsSchema,
  messageCreateSchema,
  messagingPaginationSchema
} from "@/validators/messaging.validators";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = conversationIdParamsSchema.parse(await context.params);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const pagination = messagingPaginationSchema.parse(query);
    const messages = await messageService.listMessages(user.id, params.id, pagination);

    return ok(messages);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = conversationIdParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = messageCreateSchema.parse(body);
    const message = await messageService.sendMessage(user.id, params.id, input);

    return created({ message });
  } catch (error) {
    return fail(error);
  }
}
