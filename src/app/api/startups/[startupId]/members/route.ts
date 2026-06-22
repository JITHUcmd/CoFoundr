import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { created, fail } from "@/lib/http/api-response";
import { startupService } from "@/services/startup/startup.service";
import {
  startupIdParamsSchema,
  startupMemberSchema
} from "@/validators/startup.validators";

export async function POST(
  request: Request,
  context: { params: Promise<{ startupId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = startupIdParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = startupMemberSchema.parse(body);
    const member = await startupService.addMember(user.id, params.startupId, input);

    return created({ member });
  } catch (error) {
    return fail(error);
  }
}
