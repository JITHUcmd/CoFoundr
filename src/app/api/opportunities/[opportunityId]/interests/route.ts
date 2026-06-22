import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { matchService } from "@/services/matching/match.service";
import { opportunityInterestParamsSchema } from "@/validators/match.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = opportunityInterestParamsSchema.parse(await context.params);
    const interests = await matchService.listOpportunityInterests(user.id, params.opportunityId);

    return ok({ interests });
  } catch (error) {
    return fail(error);
  }
}
