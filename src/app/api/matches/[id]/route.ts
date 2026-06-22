import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { matchService } from "@/services/matching/match.service";
import { matchIdParamsSchema } from "@/validators/match.validators";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = matchIdParamsSchema.parse(await context.params);
    const match = await matchService.getMatch(user.id, params.id);

    return ok({ match });
  } catch (error) {
    return fail(error);
  }
}
