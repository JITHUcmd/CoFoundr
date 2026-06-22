import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { opportunityService } from "@/services/opportunity/opportunity.service";
import {
  opportunityIdParamsSchema,
  opportunityUpdateSchema
} from "@/validators/opportunity.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = opportunityIdParamsSchema.parse(await context.params);
    const opportunity = await opportunityService.getOpportunity(user.id, params.opportunityId);

    return ok({ opportunity });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = opportunityIdParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = opportunityUpdateSchema.parse(body);
    const opportunity = await opportunityService.updateOpportunity(user.id, params.opportunityId, input);

    return ok({ opportunity });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = opportunityIdParamsSchema.parse(await context.params);
    const result = await opportunityService.deleteOpportunity(user.id, params.opportunityId);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
