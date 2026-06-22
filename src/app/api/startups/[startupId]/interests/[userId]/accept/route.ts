import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { matchService } from "@/services/matching/match.service";
import { startupInterestUserParamsSchema } from "@/validators/match.validators";

export async function POST(
  _request: Request,
  context: { params: Promise<{ startupId: string; userId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupInterestUserParamsSchema.parse(await context.params);
    const match = await matchService.acceptStartupInterest(user.id, params.startupId, params.userId);

    return ok({ match });
  } catch (error) {
    return fail(error);
  }
}
