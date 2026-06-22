import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { created, fail, ok } from "@/lib/http/api-response";
import { profileService } from "@/services/profile/profile.service";
import {
  profileCreateSchema,
  profileUpdateSchema
} from "@/validators/profile.validators";

export async function GET() {
  try {
    const user = await getRequiredSessionUser();
    const profile = await profileService.getPrivateProfile(user.id);

    return ok({ profile });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const body = await request.json();
    const input = profileCreateSchema.parse(body);
    const profile = await profileService.initializeProfile(user.id, input);

    return created({ profile });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const body = await request.json();
    const input = profileUpdateSchema.parse(body);
    const profile = await profileService.updateProfile(user.id, input);

    return ok({ profile });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE() {
  try {
    const user = await getRequiredSessionUser();
    const result = await profileService.deleteProfile(user.id);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
