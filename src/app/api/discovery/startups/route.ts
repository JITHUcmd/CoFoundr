import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { discoveryService } from "@/services/discovery/discovery.service";
import { startupDiscoveryQuerySchema } from "@/validators/discovery.validators";

export async function GET(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const filters = startupDiscoveryQuerySchema.parse(query);
    const feed = await discoveryService.getRecommendedStartups(user.id, filters);

    return ok({ feed });
  } catch (error) {
    return fail(error);
  }
}
