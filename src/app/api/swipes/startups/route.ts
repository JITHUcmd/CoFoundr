import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { created, fail } from "@/lib/http/api-response";
import { discoveryService } from "@/services/discovery/discovery.service";
import { swipeCreateSchema } from "@/validators/discovery.validators";

export async function POST(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const body = await request.json();
    const input = swipeCreateSchema.parse(body);
    const swipe = await discoveryService.swipeStartup(user.id, input);

    return created({ swipe });
  } catch (error) {
    return fail(error);
  }
}
