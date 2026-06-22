import { authService } from "@/services/auth/auth.service";
import { fail, ok } from "@/lib/http/api-response";
import {
  assertRateLimit,
  authRateLimits,
  buildRateLimitKey,
  getClientIpFromHeaders
} from "@/lib/rate-limit/limiter";
import { passwordResetRequestSchema } from "@/validators/auth.validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = passwordResetRequestSchema.parse(body);
    const ip = getClientIpFromHeaders(request.headers);

    assertRateLimit({
      key: buildRateLimitKey(["auth", "forgot-password", input.email, ip]),
      ...authRateLimits.forgotPassword
    });

    const result = await authService.requestPasswordReset(input);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
