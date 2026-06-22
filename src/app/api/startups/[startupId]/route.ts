import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { startupService } from "@/services/startup/startup.service";
import {
  startupIdParamsSchema,
  startupUpdateSchema
} from "@/validators/startup.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ startupId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupIdParamsSchema.parse(await context.params);
    const startup = await startupService.getPrivateStartup(user.id, params.startupId);

    return ok({ startup });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ startupId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupIdParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = startupUpdateSchema.parse(body);
    const startup = await startupService.updateStartup(user.id, params.startupId, input);

    return ok({ startup });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ startupId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupIdParamsSchema.parse(await context.params);
    const result = await startupService.deleteStartup(user.id, params.startupId);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
