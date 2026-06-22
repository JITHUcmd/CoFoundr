import { fail, ok } from "@/lib/http/api-response";
import { startupService } from "@/services/startup/startup.service";
import { startupSlugParamsSchema } from "@/validators/startup.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = startupSlugParamsSchema.parse(await context.params);
    const startup = await startupService.getPublicStartup(params.slug);

    return ok({ startup });
  } catch (error) {
    return fail(error);
  }
}
