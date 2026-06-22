import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { discoveryService } from "@/services/discovery/discovery.service";
import { compatibilityIdParamsSchema } from "@/validators/discovery.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = compatibilityIdParamsSchema.parse(await context.params);
    const compatibility = await discoveryService.getStartupCompatibility(user.id, params.id);

    return ok({ compatibility });
  } catch (error) {
    return fail(error);
  }
}
