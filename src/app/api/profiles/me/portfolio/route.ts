import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { created, fail } from "@/lib/http/api-response";
import { profileService } from "@/services/profile/profile.service";
import { portfolioLinkSchema } from "@/validators/profile.validators";

export async function POST(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const body = await request.json();
    const input = portfolioLinkSchema.parse(body);
    const portfolioLink = await profileService.createPortfolioLink(user.id, input);

    return created({ portfolioLink });
  } catch (error) {
    return fail(error);
  }
}
