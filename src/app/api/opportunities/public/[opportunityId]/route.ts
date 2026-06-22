import { fail, ok } from "@/lib/http/api-response";
import { opportunityService } from "@/services/opportunity/opportunity.service";
import { opportunityIdParamsSchema } from "@/validators/opportunity.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const params = opportunityIdParamsSchema.parse(await context.params);
    const opportunity = await opportunityService.getPublicOpportunity(params.opportunityId);

    return ok({ opportunity });
  } catch (error) {
    return fail(error);
  }
}
