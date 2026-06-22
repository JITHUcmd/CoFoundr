import { authService } from "@/services/auth/auth.service";
import { created, fail } from "@/lib/http/api-response";
import {
  assertRateLimit,
  authRateLimits,
  buildRateLimitKey,
  getClientIpFromHeaders
} from "@/lib/rate-limit/limiter";
import { signupSchema } from "@/validators/auth.validators";

export async function POST(request: Request) {
  try {
    const ip = getClientIpFromHeaders(request.headers);

    assertRateLimit({
      key: buildRateLimitKey(["auth", "signup", ip]),
      ...authRateLimits.signup
    });

    const body = await request.json();
    const input = signupSchema.parse(body);
    const user = await authService.signup(input);

    return created({ user });
  } catch (error) {
    return fail(error);
  }
}
