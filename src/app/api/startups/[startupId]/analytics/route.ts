import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { startupService } from "@/services/startup/startup.service";
import { startupIdParamsSchema } from "@/validators/startup.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ startupId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupIdParamsSchema.parse(await context.params);
    const analytics = await startupService.getAnalytics(user.id, params.startupId);

    return ok({ analytics });
  } catch (error) {
    return fail(error);
  }
}
