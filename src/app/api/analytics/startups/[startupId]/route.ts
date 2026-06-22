import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { analyticsService } from "@/services/analytics/analytics.service";
import {
  analyticsQuerySchema,
  startupAnalyticsParamsSchema
} from "@/validators/analytics.validators";

export async function GET(
  request: Request,
  context: { params: Promise<{ startupId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupAnalyticsParamsSchema.parse(await context.params);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const { range } = analyticsQuerySchema.parse(query);
    const analytics = await analyticsService.getStartupAnalytics(user.id, params.startupId, range);

    return ok({ analytics });
  } catch (error) {
    return fail(error);
  }
}
