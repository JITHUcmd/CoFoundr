import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { ProfileService } from "@/services/profile/profile.service";

function createProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "founder@example.com",
    username: "founder",
    name: "Founder One",
    profilePhotoUrl: "https://example.com/avatar.png",
    headline: "Building CoFoundr",
    bio: "Startup builder",
    country: "India",
    state: "Kerala",
    city: "Kochi",
    status: "ACTIVELY_LOOKING",
    availability: "FULL_TIME",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    roles: [],
    skills: [{ skillId: "skill-1", skill: { name: "TypeScript" } }],
    industries: [{ industryId: "industry-1", industry: { name: "SaaS" } }],
    interests: [{ interestId: "interest-1", interest: { name: "AI" } }],
    experiences: [{ id: "experience-1" }],
    education: [{ id: "education-1" }],
    portfolioLinks: [{ id: "portfolio-1" }],
    communityMemberships: [{ communityId: "community-1", community: { name: "TinkerHub" } }],
    ...overrides
  };
}

function createService(overrides: {
  usernameExists?: boolean;
  profile?: ReturnType<typeof createProfile> | null;
  publicProfile?: Record<string, unknown> | null;
  deleted?: boolean;
} = {}) {
  const profile = overrides.profile === undefined ? createProfile() : overrides.profile;
  const publicProfile = overrides.publicProfile === undefined
    ? {
        id: "user-1",
        username: "founder",
        name: "Founder One",
        profilePhoto: "https://example.com/avatar.png",
        headline: "Building CoFoundr",
        bio: "Startup builder",
        country: "India",
        state: "Kerala",
        city: "Kochi",
        skills: [],
        industries: [],
        interests: [],
        communities: [],
        builderScore: 0,
        trustScore: 0,
        collaborationScore: 0
      }
    : overrides.publicProfile;
  const profiles = {
    findPrivateProfileByUserId: vi.fn().mockResolvedValue(profile),
    findPublicProfileByUserId: vi.fn().mockResolvedValue(publicProfile),
    usernameExists: vi.fn().mockResolvedValue(Boolean(overrides.usernameExists)),
    updateProfile: vi.fn().mockResolvedValue(profile),
    initializeProfile: vi.fn().mockResolvedValue(profile),
    softDeleteProfile: vi.fn().mockResolvedValue(overrides.deleted ?? true),
    replaceSkills: vi.fn().mockResolvedValue(profile),
    replaceIndustries: vi.fn().mockResolvedValue(profile),
    replaceInterests: vi.fn().mockResolvedValue(profile),
    replaceCommunities: vi.fn().mockResolvedValue(profile),
    createExperience: vi.fn(),
    updateExperience: vi.fn(),
    deleteExperience: vi.fn(),
    createEducation: vi.fn(),
    updateEducation: vi.fn(),
    deleteEducation: vi.fn(),
    createPortfolioLink: vi.fn(),
    updatePortfolioLink: vi.fn(),
    deletePortfolioLink: vi.fn()
  };
  const analytics = {
    profileViewed: vi.fn().mockResolvedValue(undefined)
  };

  return {
    service: new ProfileService({
      profiles: profiles as never,
      analytics
    }),
    profiles,
    analytics
  };
}

describe("ProfileService", () => {
  it("adds profile completion to profile reads", async () => {
    const { service } = createService();

    const profile = await service.getPrivateProfile("user-1");

    expect(profile.completion.score).toBe(100);
    expect(profile.completion.missingFields).toEqual([]);
  });

  it("returns only the public profile DTO for public reads", async () => {
    const { service, analytics } = createService();

    const profile = await service.getPublicProfile("user-1");

    expect(profile).not.toHaveProperty("email");
    expect(profile).not.toHaveProperty("deletedAt");
    expect(profile).toMatchObject({
      id: "user-1",
      username: "founder",
      builderScore: 0,
      trustScore: 0,
      collaborationScore: 0
    });
    expect(analytics.profileViewed).toHaveBeenCalledWith({
      targetUserId: "user-1"
    });
  });

  it("rejects duplicate skill replacement entries", async () => {
    const { service } = createService();

    await expect(
      service.replaceSkills("user-1", [
        { skillId: "00000000-0000-0000-0000-000000000001" },
        { skillId: "00000000-0000-0000-0000-000000000001" }
      ])
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects taken usernames during profile update", async () => {
    const { service } = createService({ usernameExists: true });

    await expect(
      service.updateProfile("user-1", {
        username: "taken"
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("soft deletes the current user's profile", async () => {
    const { service, profiles } = createService();

    await expect(service.deleteProfile("user-1")).resolves.toEqual({ deleted: true });
    expect(profiles.softDeleteProfile).toHaveBeenCalledWith("user-1");
  });
});
