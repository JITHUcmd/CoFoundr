import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { fail, ok } from "@/lib/http/api-response";
import { profileService } from "@/services/profile/profile.service";
import {
  portfolioLinkParamsSchema,
  portfolioLinkUpdateSchema
} from "@/validators/profile.validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ linkId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = portfolioLinkParamsSchema.parse(await context.params);
    const body = await request.json();
    const input = portfolioLinkUpdateSchema.parse(body);
    const portfolioLink = await profileService.updatePortfolioLink(user.id, params.linkId, input);

    return ok({ portfolioLink });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ linkId: string }> }
) {
  try {
    const user = await getRequiredSessionUser();
    const params = portfolioLinkParamsSchema.parse(await context.params);
    const result = await profileService.deletePortfolioLink(user.id, params.linkId);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
