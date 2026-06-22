import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { matchService } from "@/services/matching/match.service";
import { opportunityInterestUserParamsSchema } from "@/validators/match.validators";

export async function POST(
  _request: Request,
  context: { params: Promise<{ opportunityId: string; userId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = opportunityInterestUserParamsSchema.parse(await context.params);
    const match = await matchService.acceptOpportunityInterest(user.id, params.opportunityId, params.userId);

    return ok({ match });
  } catch (error) {
    return fail(error);
  }
}
