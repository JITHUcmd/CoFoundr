import { describe, expect, it } from "vitest";
import {
  opportunityApplicationSchema,
  opportunityCreateSchema,
  opportunityUpdateSchema
} from "@/validators/opportunity.validators";

describe("opportunity validators", () => {
  it("accepts a valid opportunity create payload", () => {
    const result = opportunityCreateSchema.safeParse({
      startupId: "00000000-0000-0000-0000-000000000001",
      roleName: "Technical Co-Founder",
      opportunityType: "TECHNICAL_CO_FOUNDER",
      description: "Build the first version of the product.",
      openings: 1,
      experienceLevel: "SENIOR",
      compensationType: "BOTH",
      equityMinPercent: 5,
      equityMaxPercent: 15,
      salaryMin: 50000,
      salaryMax: 100000,
      salaryCurrency: "usd",
      commitment: "FULL_TIME",
      remoteAllowed: true,
      workStyle: "REMOTE",
      country: "India",
      city: "Kochi",
      status: "OPEN",
      skillIds: ["00000000-0000-0000-0000-000000000002"]
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.salaryCurrency).toBe("USD");
    }
  });

  it("rejects unknown fields and invalid enums", () => {
    const result = opportunityCreateSchema.safeParse({
      startupId: "00000000-0000-0000-0000-000000000001",
      roleName: "Developer",
      compensationType: "CASH",
      hiddenField: true
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid salary and equity ranges", () => {
    const result = opportunityUpdateSchema.safeParse({
      equityMinPercent: 20,
      equityMaxPercent: 5,
      salaryMin: 100000,
      salaryMax: 50000
    });

    expect(result.success).toBe(false);
  });

  it("accepts optional application notes", () => {
    const result = opportunityApplicationSchema.safeParse({
      note: "I can help with the MVP."
    });

    expect(result.success).toBe(true);
  });
});
