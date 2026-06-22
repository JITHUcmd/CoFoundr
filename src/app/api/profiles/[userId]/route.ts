import { fail, ok } from "@/lib/http/api-response";
import { profileService } from "@/services/profile/profile.service";
import { profileParamsSchema } from "@/validators/profile.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = profileParamsSchema.parse(await context.params);
    const profile = await profileService.getPublicProfile(params.userId);

    return ok({ profile });
  } catch (error) {
    return fail(error);
  }
}
