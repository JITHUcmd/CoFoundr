import { describe, expect, it } from "vitest";
import {
  analyticsQuerySchema,
  opportunityAnalyticsParamsSchema,
  startupAnalyticsParamsSchema
} from "@/validators/analytics.validators";

describe("analytics validators", () => {
  it("defaults the date range to 30 days", () => {
    expect(analyticsQuerySchema.parse({})).toEqual({
      range: "30d"
    });
  });

  it("accepts supported date ranges", () => {
    expect(analyticsQuerySchema.parse({
      range: "lifetime"
    })).toEqual({
      range: "lifetime"
    });
  });

  it("rejects unsupported date ranges and unknown fields", () => {
    expect(() => analyticsQuerySchema.parse({
      range: "365d",
      extra: "field"
    })).toThrow();
  });

  it("validates startup analytics params", () => {
    expect(startupAnalyticsParamsSchema.parse({
      startupId: "11111111-1111-1111-1111-111111111111"
    })).toEqual({
      startupId: "11111111-1111-1111-1111-111111111111"
    });
  });

  it("validates opportunity analytics params", () => {
    expect(opportunityAnalyticsParamsSchema.parse({
      opportunityId: "22222222-2222-2222-2222-222222222222"
    })).toEqual({
      opportunityId: "22222222-2222-2222-2222-222222222222"
    });
  });
});
