import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { matchService } from "@/services/matching/match.service";
import { matchListQuerySchema } from "@/validators/match.validators";

export async function GET(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const filters = matchListQuerySchema.parse(query);
    const matches = await matchService.listMatches(user.id, filters);

    return ok({ matches });
  } catch (error) {
    return fail(error);
  }
}
