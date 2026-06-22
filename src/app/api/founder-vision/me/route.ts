import { getRequiredSessionUser } from "@/lib/auth/require-auth";
import { created, fail, ok } from "@/lib/http/api-response";
import { founderVisionService } from "@/services/founder-vision/founder-vision.service";
import {
  founderVisionCreateSchema,
  founderVisionUpdateSchema
} from "@/validators/founder-vision.validators";

export async function GET() {
  try {
    const user = await getRequiredSessionUser();
    const founderVision = await founderVisionService.getMyVision(user.id);

    return ok({ founderVision });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const body = await request.json();
    const input = founderVisionCreateSchema.parse(body);
    const founderVision = await founderVisionService.createVision(user.id, input);

    return created({ founderVision });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getRequiredSessionUser();
    const body = await request.json();
    const input = founderVisionUpdateSchema.parse(body);
    const founderVision = await founderVisionService.updateVision(user.id, input);

    return ok({ founderVision });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE() {
  try {
    const user = await getRequiredSessionUser();
    const result = await founderVisionService.deleteVision(user.id);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
