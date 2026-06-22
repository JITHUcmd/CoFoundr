import { describe, expect, it } from "vitest";
import {
  experienceSchema,
  profileUpdateSchema,
  replaceSkillsSchema
} from "@/validators/profile.validators";

describe("profile validators", () => {
  it("normalizes usernames to lowercase", () => {
    const result = profileUpdateSchema.safeParse({
      username: "Founder_One"
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.username).toBe("founder_one");
    }
  });

  it("rejects unknown profile fields", () => {
    const result = profileUpdateSchema.safeParse({
      headline: "Building useful things",
      unknown: "nope"
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate malformed skill payloads", () => {
    const result = replaceSkillsSchema.safeParse({
      skills: [{ skillId: "not-a-uuid" }]
    });

    expect(result.success).toBe(false);
  });

  it("rejects experience end dates before start dates", () => {
    const result = experienceSchema.safeParse({
      companyName: "CoFoundr",
      title: "Builder",
      startDate: "2025-01-01",
      endDate: "2024-01-01"
    });

    expect(result.success).toBe(false);
  });
});
