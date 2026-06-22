import { describe, expect, it } from "vitest";
import {
  startupCreateSchema,
  startupMemberSchema,
  startupUpdateSchema
} from "@/validators/startup.validators";

describe("startup validators", () => {
  it("accepts a valid startup create payload", () => {
    const result = startupCreateSchema.safeParse({
      name: "CoFoundr Labs",
      slug: "cofoundr-labs",
      logoUrl: "https://example.com/logo.png",
      coverImageUrl: "https://example.com/cover.png",
      tagline: "Find your founding team",
      description: "A network for startup builders.",
      website: "https://cofoundr.example",
      industryId: "00000000-0000-0000-0000-000000000001",
      startupStage: "MVP",
      foundedDate: "2026-01-01",
      teamSize: 4,
      country: "India",
      state: "Kerala",
      city: "Kochi",
      remoteAllowed: true,
      workStyle: "HYBRID",
      fundingStage: "FUNDRAISING_NOW",
      fundingTargetAmount: 250000,
      hiringStatus: "HIRING",
      openRolesCount: 3,
      equityAvailable: true,
      salaryAvailable: false
    });

    expect(result.success).toBe(true);
  });

  it("rejects unknown startup fields", () => {
    const result = startupCreateSchema.safeParse({
      name: "CoFoundr Labs",
      slug: "cofoundr-labs",
      internalNotes: "nope"
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid slugs, URLs, team sizes, and funding amounts", () => {
    const result = startupUpdateSchema.safeParse({
      slug: "Bad Slug",
      website: "not-a-url",
      teamSize: 0,
      fundingTargetAmount: -1
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid member roles", () => {
    const result = startupMemberSchema.safeParse({
      userId: "00000000-0000-0000-0000-000000000001",
      role: "INTERN"
    });

    expect(result.success).toBe(false);
  });
});
