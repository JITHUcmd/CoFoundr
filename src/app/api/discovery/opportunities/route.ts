import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { discoveryService } from "@/services/discovery/discovery.service";
import { opportunityDiscoveryQuerySchema } from "@/validators/discovery.validators";

export async function GET(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const filters = opportunityDiscoveryQuerySchema.parse(query);
    const feed = await discoveryService.getRecommendedOpportunities(user.id, filters);

    return ok({ feed });
  } catch (error) {
    return fail(error);
  }
}
