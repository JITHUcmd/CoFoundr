import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { profileService } from "@/services/profile/profile.service";
import {
  educationParamsSchema,
  educationUpdateSchema
} from "@/validators/profile.validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ educationId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = educationParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = educationUpdateSchema.parse(body);
    const education = await profileService.updateEducation(user.id, params.educationId, input);

    return ok({ education });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ educationId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = educationParamsSchema.parse(await context.params);
    const result = await profileService.deleteEducation(user.id, params.educationId);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
