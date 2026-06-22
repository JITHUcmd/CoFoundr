import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { startupService } from "@/services/startup/startup.service";
import {
  startupIdParamsSchema,
  startupVerificationRequestSchema
} from "@/validators/startup.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ startupId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupIdParamsSchema.parse(await context.params);
    const verification = await startupService.getVerificationStatus(user.id, params.startupId);

    return ok({ verification });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ startupId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupIdParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = startupVerificationRequestSchema.parse(body);
    const verification = await startupService.requestVerification(user.id, params.startupId, input);

    return ok({ verification });
  } catch (error) {
    return fail(error);
  }
}
