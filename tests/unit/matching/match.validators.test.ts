import { describe, expect, it } from "vitest";
import {
  matchIdParamsSchema,
  matchListQuerySchema
} from "@/validators/match.validators";

describe("match validators", () => {
  it("accepts valid match list filters", () => {
    const result = matchListQuerySchema.safeParse({
      type: "USER",
      status: "ACTIVE",
      limit: "25"
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.limit).toBe(25);
    }
  });

  it("rejects unknown fields", () => {
    const result = matchListQuerySchema.safeParse({
      type: "STARTUP",
      hidden: true
    });

    expect(result.success).toBe(false);
  });

  it("validates match ids", () => {
    const result = matchIdParamsSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001"
    });

    expect(result.success).toBe(true);
  });
});
