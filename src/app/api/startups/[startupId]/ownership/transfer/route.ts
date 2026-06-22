import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { startupService } from "@/services/startup/startup.service";
import {
  startupIdParamsSchema,
  transferOwnershipSchema
} from "@/validators/startup.validators";

export async function POST(
  request: Request,
  context: { params: Promise<{ startupId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupIdParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = transferOwnershipSchema.parse(body);
    const startup = await startupService.transferOwnership(user.id, params.startupId, input.newOwnerId);

    return ok({ startup });
  } catch (error) {
    return fail(error);
  }
}
