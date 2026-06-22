import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { analyticsService } from "@/services/analytics/analytics.service";
import {
  analyticsQuerySchema,
  opportunityAnalyticsParamsSchema
} from "@/validators/analytics.validators";

export async function GET(
  request: Request,
  context: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = opportunityAnalyticsParamsSchema.parse(await context.params);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const { range } = analyticsQuerySchema.parse(query);
    const analytics = await analyticsService.getOpportunityAnalytics(user.id, params.opportunityId, range);

    return ok({ analytics });
  } catch (error) {
    return fail(error);
  }
}
