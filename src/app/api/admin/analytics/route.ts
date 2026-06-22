import { getRequiredRoleUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { analyticsService } from "@/services/analytics/analytics.service";
import { analyticsQuerySchema } from "@/validators/analytics.validators";

export async function GET(request: Request) {
  try {
    await getRequiredRoleUser(["ADMIN"]);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const { range } = analyticsQuerySchema.parse(query);
    const analytics = await analyticsService.getAdminPlatformAnalytics(range);

    return ok({ analytics });
  } catch (error) {
    return fail(error);
  }
}
