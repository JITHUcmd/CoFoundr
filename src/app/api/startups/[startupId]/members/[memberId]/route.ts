import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { startupService } from "@/services/startup/startup.service";
import {
  startupMemberParamsSchema,
  startupMemberUpdateSchema
} from "@/validators/startup.validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ startupId: string; memberId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupMemberParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = startupMemberUpdateSchema.parse(body);
    const member = await startupService.updateMember(
      user.id,
      params.startupId,
      params.memberId,
      input
    );

    return ok({ member });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ startupId: string; memberId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupMemberParamsSchema.parse(await context.params);
    const result = await startupService.removeMember(user.id, params.startupId, params.memberId);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
