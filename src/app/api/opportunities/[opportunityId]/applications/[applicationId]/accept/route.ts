import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { opportunityService } from "@/services/opportunity/opportunity.service";
import {
  applicationIdParamsSchema,
  opportunityReviewSchema
} from "@/validators/opportunity.validators";

export async function POST(
  request: Request,
  context: { params: Promise<{ opportunityId: string; applicationId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = applicationIdParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = opportunityReviewSchema.parse(body);
    const application = await opportunityService.accept(user.id, params.opportunityId, params.applicationId, input);

    return ok({ application });
  } catch (error) {
    return fail(error);
  }
}
