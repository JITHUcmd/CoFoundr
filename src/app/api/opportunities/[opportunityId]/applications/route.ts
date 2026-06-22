import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { created, fail } from "@/lib/http/api-response";
import { opportunityService } from "@/services/opportunity/opportunity.service";
import {
  opportunityApplicationSchema,
  opportunityIdParamsSchema
} from "@/validators/opportunity.validators";

export async function POST(
  request: Request,
  context: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = opportunityIdParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = opportunityApplicationSchema.parse(body);
    const application = await opportunityService.apply(user.id, params.opportunityId, input);

    return created({ application });
  } catch (error) {
    return fail(error);
  }
}
