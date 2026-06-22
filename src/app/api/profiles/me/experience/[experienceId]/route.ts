import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { profileService } from "@/services/profile/profile.service";
import {
  experienceParamsSchema,
  experienceUpdateSchema
} from "@/validators/profile.validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ experienceId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = experienceParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = experienceUpdateSchema.parse(body);
    const experience = await profileService.updateExperience(
      user.id,
      params.experienceId,
      input
    );

    return ok({ experience });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ experienceId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = experienceParamsSchema.parse(await context.params);
    const result = await profileService.deleteExperience(user.id, params.experienceId);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
