import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/validators/auth.validators";

describe("auth validators", () => {
  it("accepts a valid signup payload", () => {
    const result = signupSchema.safeParse({
      email: "Founder@Example.com",
      password: "Password123",
      username: "founder_1",
      name: "Founder One",
      roles: ["FOUNDER"]
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("founder@example.com");
      expect(result.data.username).toBe("founder_1");
    }
  });

  it("rejects weak passwords", () => {
    const result = signupSchema.safeParse({
      email: "founder@example.com",
      password: "password",
      username: "founder_1",
      name: "Founder One"
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid login payload", () => {
    const result = loginSchema.safeParse({
      email: "Talent@Example.com",
      password: "Password123"
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("talent@example.com");
    }
  });
});
