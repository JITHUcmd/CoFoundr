import { fail, ok } from "@/lib/http/api-response";
import { opportunityService } from "@/services/opportunity/opportunity.service";
import { startupOpportunitiesParamsSchema } from "@/validators/opportunity.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ startupId: string }> }
) {
  try {
    const params = startupOpportunitiesParamsSchema.parse(await context.params);
    const opportunities = await opportunityService.listStartupOpportunities(params.startupId);

    return ok({ opportunities });
  } catch (error) {
    return fail(error);
  }
}
