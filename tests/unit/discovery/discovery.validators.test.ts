import { describe, expect, it } from "vitest";
import {
  opportunityDiscoveryQuerySchema,
  startupDiscoveryQuerySchema,
  swipeCreateSchema,
  userDiscoveryQuerySchema
} from "@/validators/discovery.validators";

const uuidOne = "00000000-0000-0000-0000-000000000001";
const uuidTwo = "00000000-0000-0000-0000-000000000002";

describe("discovery validators", () => {
  it("parses user discovery filters and comma-separated ids", () => {
    const result = userDiscoveryQuerySchema.safeParse({
      skillIds: `${uuidOne},${uuidTwo}`,
      industryIds: uuidOne,
      minExperienceYears: "3",
      availability: "FULL_TIME",
      status: "ACTIVELY_LOOKING",
      workStyle: "REMOTE"
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.skillIds).toEqual([uuidOne, uuidTwo]);
      expect(result.data.limit).toBe(20);
    }
  });

  it("rejects unknown user discovery fields and not-looking filters", () => {
    const result = userDiscoveryQuerySchema.safeParse({
      status: "NOT_LOOKING",
      hidden: true
    });

    expect(result.success).toBe(false);
  });

  it("normalizes SUPERLIKE swipe input to the Prisma enum value", () => {
    const result = swipeCreateSchema.safeParse({
      targetId: uuidOne,
      action: "SUPERLIKE",
      startupId: uuidTwo
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.action).toBe("SUPER_LIKE");
      expect(result.data.startupId).toBe(uuidTwo);
    }
  });

  it("validates startup discovery team-size ranges", () => {
    const result = startupDiscoveryQuerySchema.safeParse({
      minTeamSize: "10",
      maxTeamSize: "2"
    });

    expect(result.success).toBe(false);
  });

  it("parses opportunity discovery booleans", () => {
    const result = opportunityDiscoveryQuerySchema.safeParse({
      equityAvailable: "true",
      salaryAvailable: "false",
      remoteAllowed: "true"
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.equityAvailable).toBe(true);
      expect(result.data.salaryAvailable).toBe(false);
      expect(result.data.remoteAllowed).toBe(true);
    }
  });
});
