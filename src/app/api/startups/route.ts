import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { created, fail } from "@/lib/http/api-response";
import { startupService } from "@/services/startup/startup.service";
import { startupCreateSchema } from "@/validators/startup.validators";

export async function POST(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const body = await request.json();
    const input = startupCreateSchema.parse(body);
    const startup = await startupService.createStartup(user.id, input);

    return created({ startup });
  } catch (error) {
    return fail(error);
  }
}
