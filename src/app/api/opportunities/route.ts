import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { created, fail } from "@/lib/http/api-response";
import { opportunityService } from "@/services/opportunity/opportunity.service";
import { opportunityCreateSchema } from "@/validators/opportunity.validators";
import type { CreateOpportunityInput } from "@/types/opportunity.types";

export async function POST(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const body = await request.json();
    const input = opportunityCreateSchema.parse(body) as CreateOpportunityInput;
    const opportunity = await opportunityService.createOpportunity(user.id, input);

    return created({ opportunity });
  } catch (error) {
    return fail(error);
  }
}
