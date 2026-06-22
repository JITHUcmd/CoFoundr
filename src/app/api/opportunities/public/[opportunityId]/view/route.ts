import { fail, ok } from "@/lib/http/api-response";
import { opportunityService } from "@/services/opportunity/opportunity.service";
import { opportunityIdParamsSchema } from "@/validators/opportunity.validators";

export async function POST(
  _request: Request,
  context: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const params = opportunityIdParamsSchema.parse(await context.params);
    const result = await opportunityService.incrementView(params.opportunityId);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
