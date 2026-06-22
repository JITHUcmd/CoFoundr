import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { StartupService } from "@/services/startup/startup.service";

function createStartup(overrides: Record<string, unknown> = {}) {
  return {
    id: "startup-1",
    ownerId: "owner-1",
    name: "CoFoundr Labs",
    slug: "cofoundr-labs",
    verificationStatus: "PENDING",
    verificationNotes: null,
    profileViewsCount: 0,
    followersCount: 0,
    savesCount: 0,
    applicationsCount: 0,
    members: [],
    ...overrides
  };
}

function createPublicStartup(overrides: Record<string, unknown> = {}) {
  return {
    name: "CoFoundr Labs",
    slug: "cofoundr-labs",
    logoUrl: null,
    coverImageUrl: null,
    tagline: "Find your founding team",
    description: "A network for startup builders.",
    website: "https://cofoundr.example",
    verificationStatus: "PENDING",
    profileViewsCount: 0,
    followersCount: 0,
    savesCount: 0,
    applicationsCount: 0,
    members: [],
    ...overrides
  };
}

function createService(overrides: {
  activeUser?: boolean;
  owner?: boolean;
  slugExists?: boolean;
  startup?: ReturnType<typeof createStartup> | null;
  publicStartup?: ReturnType<typeof createPublicStartup> | null;
  member?: Record<string, unknown> | null;
  deleted?: boolean;
  removed?: boolean;
} = {}) {
  const startup = overrides.startup === undefined ? createStartup() : overrides.startup;
  const publicStartup = overrides.publicStartup === undefined ? createPublicStartup() : overrides.publicStartup;
  const member = overrides.member === undefined
    ? { id: "member-1", userId: "member-user-1", role: "CTO", isFounder: false }
    : overrides.member;
  const startups = {
    findActiveUserById: vi.fn().mockResolvedValue(overrides.activeUser === false ? null : { id: "user-1" }),
    findPrivateById: vi.fn().mockResolvedValue(startup),
    findPublicBySlug: vi.fn().mockResolvedValue(publicStartup),
    slugExists: vi.fn().mockResolvedValue(Boolean(overrides.slugExists)),
    isOwner: vi.fn().mockResolvedValue(overrides.owner ?? true),
    create: vi.fn().mockResolvedValue(startup),
    update: vi.fn().mockResolvedValue(startup),
    softDelete: vi.fn().mockResolvedValue(overrides.deleted ?? true),
    addMember: vi.fn().mockResolvedValue(member),
    updateMember: vi.fn().mockResolvedValue(member),
    removeMember: vi.fn().mockResolvedValue(overrides.removed ?? true),
    findMemberById: vi.fn().mockResolvedValue(member),
    transferOwnership: vi.fn().mockResolvedValue(startup),
    incrementView: vi.fn().mockResolvedValue(undefined),
    incrementViewBySlug: vi.fn().mockResolvedValue(true),
    getAnalytics: vi.fn().mockResolvedValue({
      profileViews: 1,
      follows: 2,
      saves: 3,
      applications: 4
    }),
    requestVerification: vi.fn().mockResolvedValue({
      verificationStatus: "PENDING",
      verificationNotes: null
    }),
    getVerificationStatus: vi.fn().mockResolvedValue({
      verificationStatus: "PENDING",
      verificationNotes: null
    })
  };

  return {
    service: new StartupService({ startups: startups as never }),
    startups
  };
}

describe("StartupService", () => {
  it("creates a startup for an active owner", async () => {
    const { service, startups } = createService();

    await service.createStartup("owner-1", {
      name: "CoFoundr Labs",
      slug: "cofoundr-labs"
    });

    expect(startups.create).toHaveBeenCalledWith("owner-1", {
      name: "CoFoundr Labs",
      slug: "cofoundr-labs"
    });
  });

  it("rejects duplicate startup slugs", async () => {
    const { service } = createService({ slugExists: true });

    await expect(
      service.createStartup("owner-1", {
        name: "CoFoundr Labs",
        slug: "cofoundr-labs"
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("returns public startups without private fields", async () => {
    const { service } = createService();

    const startup = await service.getPublicStartup("cofoundr-labs");

    expect(startup).not.toHaveProperty("ownerId");
    expect(startup).not.toHaveProperty("verificationNotes");
    expect(startup).toMatchObject({ slug: "cofoundr-labs" });
  });

  it("rejects updates by non-owners", async () => {
    const { service } = createService({ owner: false });

    await expect(
      service.updateStartup("not-owner", "startup-1", {
        name: "New Name"
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("soft deletes startups through the owner", async () => {
    const { service, startups } = createService();

    await expect(service.deleteStartup("owner-1", "startup-1")).resolves.toEqual({ deleted: true });
    expect(startups.softDelete).toHaveBeenCalledWith("startup-1");
  });

  it("allows owners to add members", async () => {
    const { service, startups } = createService();

    await service.addMember("owner-1", "startup-1", {
      userId: "member-user-1",
      role: "CTO"
    });

    expect(startups.addMember).toHaveBeenCalledWith("startup-1", {
      userId: "member-user-1",
      role: "CTO"
    });
  });

  it("prevents removing the current owner as a member", async () => {
    const { service } = createService({
      member: { id: "member-1", userId: "owner-1", role: "CEO", isFounder: true }
    });

    await expect(service.removeMember("owner-1", "startup-1", "member-1")).rejects.toBeInstanceOf(AppError);
  });

  it("transfers ownership to another active user", async () => {
    const { service, startups } = createService();

    await service.transferOwnership("owner-1", "startup-1", "owner-2");

    expect(startups.transferOwnership).toHaveBeenCalledWith("startup-1", "owner-2");
  });

  it("returns owner-only analytics", async () => {
    const { service } = createService();

    await expect(service.getAnalytics("owner-1", "startup-1")).resolves.toEqual({
      profileViews: 1,
      follows: 2,
      saves: 3,
      applications: 4
    });
  });

  it("increments public views by slug without exposing startup IDs", async () => {
    const { service, startups } = createService();

    await expect(service.incrementPublicView("cofoundr-labs")).resolves.toEqual({ incremented: true });
    expect(startups.incrementViewBySlug).toHaveBeenCalledWith("cofoundr-labs", undefined);
  });

  it("requests startup verification for owners", async () => {
    const { service, startups } = createService();

    await service.requestVerification("owner-1", "startup-1", {
      evidenceUrl: "https://example.com/evidence"
    });

    expect(startups.requestVerification).toHaveBeenCalledWith("startup-1", "owner-1", {
      evidenceUrl: "https://example.com/evidence"
    });
  });
});
