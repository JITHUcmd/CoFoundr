import { fail, ok } from "@/lib/http/api-response";
import { startupService } from "@/services/startup/startup.service";
import { startupSlugParamsSchema } from "@/validators/startup.validators";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = startupSlugParamsSchema.parse(await context.params);
    const result = await startupService.incrementPublicView(params.slug);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
