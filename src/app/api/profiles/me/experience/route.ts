import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { created, fail } from "@/lib/http/api-response";
import { profileService } from "@/services/profile/profile.service";
import { experienceSchema } from "@/validators/profile.validators";

export async function POST(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const body = await request.json();
    const input = experienceSchema.parse(body);
    const experience = await profileService.createExperience(user.id, input);

    return created({ experience });
  } catch (error) {
    return fail(error);
  }
}
