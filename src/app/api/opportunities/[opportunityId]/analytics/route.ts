import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { opportunityService } from "@/services/opportunity/opportunity.service";
import { opportunityIdParamsSchema } from "@/validators/opportunity.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = opportunityIdParamsSchema.parse(await context.params);
    const analytics = await opportunityService.getAnalytics(user.id, params.opportunityId);

    return ok({ analytics });
  } catch (error) {
    return fail(error);
  }
}
