import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { matchService } from "@/services/matching/match.service";
import { startupInterestParamsSchema } from "@/validators/match.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ startupId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupInterestParamsSchema.parse(await context.params);
    const interests = await matchService.listStartupInterests(user.id, params.startupId);

    return ok({ interests });
  } catch (error) {
    return fail(error);
  }
}
