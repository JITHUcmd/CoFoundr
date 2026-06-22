import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { FounderVisionService } from "@/services/founder-vision/founder-vision.service";

function createVision(overrides: Record<string, unknown> = {}) {
  return {
    id: "vision-1",
    userId: "user-1",
    startupGoal: "BOOTSTRAPPED_SAAS",
    fundingPreference: "BOOTSTRAPPED",
    riskAppetite: "MEDIUM",
    commitmentLevel: "FULL_TIME",
    workStyle: "REMOTE",
    preferredTeamSize: 3,
    preferredCoFounderType: "Technical Co-Founder",
    remotePreference: "REMOTE",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function createService(overrides: {
  activeUser?: boolean;
  exists?: boolean;
  vision?: ReturnType<typeof createVision> | null;
  deleted?: boolean;
} = {}) {
  const vision = overrides.vision === undefined ? createVision() : overrides.vision;
  const founderVisions = {
    findActiveUserById: vi.fn().mockResolvedValue(overrides.activeUser === false ? null : { id: "user-1" }),
    findByUserId: vi.fn().mockResolvedValue(vision),
    existsByUserId: vi.fn().mockResolvedValue(Boolean(overrides.exists)),
    create: vi.fn().mockResolvedValue(vision),
    update: vi.fn().mockResolvedValue(vision),
    delete: vi.fn().mockResolvedValue(overrides.deleted ?? true)
  };

  return {
    service: new FounderVisionService({ founderVisions: founderVisions as never }),
    founderVisions
  };
}

describe("FounderVisionService", () => {
  it("rejects duplicate founder vision creation", async () => {
    const { service } = createService({ exists: true });

    await expect(
      service.createVision("user-1", {
        startupGoal: "AI_STARTUP"
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("creates founder vision for an active user", async () => {
    const { service, founderVisions } = createService();

    await service.createVision("user-1", {
      startupGoal: "AI_STARTUP",
      preferredTeamSize: 2
    });

    expect(founderVisions.create).toHaveBeenCalledWith("user-1", {
      startupGoal: "AI_STARTUP",
      preferredTeamSize: 2
    });
  });

  it("deletes the current user's founder vision", async () => {
    const { service, founderVisions } = createService();

    await expect(service.deleteVision("user-1")).resolves.toEqual({ deleted: true });
    expect(founderVisions.delete).toHaveBeenCalledWith("user-1");
  });

  it("calculates compatibility score and matched fields", () => {
    const { service } = createService();
    const source = createVision();
    const target = createVision({
      id: "vision-2",
      userId: "user-2",
      fundingPreference: "VENTURE_CAPITAL",
      preferredTeamSize: 4
    });

    const result = service.calculateCompatibility(source as never, target as never);

    expect(result.score).toBe(85);
    expect(result.matchedFields).toContain("startupGoal");
    expect(result.mismatchedFields).toContain("fundingPreference");
    expect(result.missingFields).toEqual([]);
  });
});
