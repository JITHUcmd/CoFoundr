import { describe, expect, it } from "vitest";
import {
  founderVisionCreateSchema,
  founderVisionUpdateSchema
} from "@/validators/founder-vision.validators";

describe("founder vision validators", () => {
  it("accepts a valid founder vision payload", () => {
    const result = founderVisionCreateSchema.safeParse({
      startupGoal: "BOOTSTRAPPED_SAAS",
      fundingPreference: "BOOTSTRAPPED",
      riskAppetite: "MEDIUM",
      commitmentLevel: "FULL_TIME",
      workStyle: "REMOTE",
      preferredTeamSize: 3,
      preferredCoFounderType: "Technical Co-Founder",
      remotePreference: "REMOTE"
    });

    expect(result.success).toBe(true);
  });

  it("rejects unknown fields", () => {
    const result = founderVisionCreateSchema.safeParse({
      startupGoal: "AI_STARTUP",
      unknown: "nope"
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid team sizes", () => {
    const result = founderVisionUpdateSchema.safeParse({
      preferredTeamSize: 0
    });

    expect(result.success).toBe(false);
  });
});
