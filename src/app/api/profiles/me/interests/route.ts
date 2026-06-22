import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { profileService } from "@/services/profile/profile.service";
import { replaceIdsSchema } from "@/validators/profile.validators";

export async function PUT(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const body = await request.json();
    const input = replaceIdsSchema.parse(body);
    const profile = await profileService.replaceInterests(user.id, input.ids);

    return ok({ profile });
  } catch (error) {
    return fail(error);
  }
}
