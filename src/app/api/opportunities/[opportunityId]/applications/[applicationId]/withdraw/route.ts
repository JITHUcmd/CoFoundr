import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { opportunityService } from "@/services/opportunity/opportunity.service";
import { applicationIdParamsSchema } from "@/validators/opportunity.validators";

export async function POST(
  _request: Request,
  context: { params: Promise<{ opportunityId: string; applicationId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = applicationIdParamsSchema.parse(await context.params);
    const application = await opportunityService.withdraw(user.id, params.opportunityId, params.applicationId);

    return ok({ application });
  } catch (error) {
    return fail(error);
  }
}
