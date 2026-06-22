import { authService } from "@/services/auth/auth.service";
import { fail, ok } from "@/lib/http/api-response";
import {
  assertRateLimit,
  authRateLimits,
  buildRateLimitKey,
  getClientIpFromHeaders
} from "@/lib/rate-limit/limiter";
import { passwordResetSchema } from "@/validators/auth.validators";

export async function POST(request: Request) {
  try {
    const ip = getClientIpFromHeaders(request.headers);

    assertRateLimit({
      key: buildRateLimitKey(["auth", "password-reset", ip]),
      ...authRateLimits.passwordReset
    });

    const body = await request.json();
    const input = passwordResetSchema.parse(body);
    const result = await authService.resetPassword(input);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
