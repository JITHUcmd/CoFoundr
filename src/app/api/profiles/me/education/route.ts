import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { created, fail } from "@/lib/http/api-response";
import { profileService } from "@/services/profile/profile.service";
import { educationSchema } from "@/validators/profile.validators";

export async function POST(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const body = await request.json();
    const input = educationSchema.parse(body);
    const education = await profileService.createEducation(user.id, input);

    return created({ education });
  } catch (error) {
    return fail(error);
  }
}
