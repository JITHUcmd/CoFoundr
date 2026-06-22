import { AppError } from "@/lib/errors/app-error";
import {
  profileRepository,
  type ProfileRepository
} from "@/repositories/profile.repository";
import type {
  EducationInput,
  ExperienceInput,
  PortfolioLinkInput,
  ProfileSkillInput,
  ProfileUpdateInput
} from "@/types/profile.types";
import {
  analyticsEvents,
  type AnalyticsEventsService
} from "@/services/analytics/analytics-events.service";

type PrivateProfileRecord = NonNullable<Awaited<ReturnType<ProfileRepository["findPrivateProfileByUserId"]>>>;

type ProfileServiceDeps = {
  profiles?: ProfileRepository;
  analytics?: Pick<AnalyticsEventsService, "profileViewed">;
};

function hasValue(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function assertUnique(ids: string[], label: string) {
  const uniqueIds = new Set(ids);

  if (uniqueIds.size !== ids.length) {
    throw new AppError("VALIDATION_ERROR", `Duplicate ${label} are not allowed.`, 400);
  }
}

export class ProfileService {
  private readonly profiles: ProfileRepository;
  private readonly analytics: Pick<AnalyticsEventsService, "profileViewed">;

  constructor(deps: ProfileServiceDeps = {}) {
    this.profiles = deps.profiles ?? profileRepository;
    this.analytics = deps.analytics ?? analyticsEvents;
  }

  async getPublicProfile(userId: string) {
    const profile = await this.profiles.findPublicProfileByUserId(userId);

    if (!profile) {
      throw new AppError("NOT_FOUND", "Profile not found.", 404);
    }

    await this.analytics.profileViewed({
      targetUserId: userId
    });

    return profile;
  }

  async getPrivateProfile(userId: string) {
    const profile = await this.profiles.findPrivateProfileByUserId(userId);

    if (!profile) {
      throw new AppError("NOT_FOUND", "Profile not found.", 404);
    }

    return this.withCompletion(profile);
  }

  async updateProfile(userId: string, input: ProfileUpdateInput) {
    await this.ensureActiveProfile(userId);

    if (input.username) {
      const usernameExists = await this.profiles.usernameExists(input.username, userId);

      if (usernameExists) {
        throw new AppError("CONFLICT", "Username is already taken.", 409);
      }
    }

    const profile = await this.profiles.updateProfile(userId, input);
    return this.withCompletion(profile);
  }

  async initializeProfile(userId: string, input: ProfileUpdateInput) {
    if (input.username) {
      const usernameExists = await this.profiles.usernameExists(input.username, userId);

      if (usernameExists) {
        throw new AppError("CONFLICT", "Username is already taken.", 409);
      }
    }

    const profile = await this.profiles.initializeProfile(userId, input);
    return this.withCompletion(profile);
  }

  async deleteProfile(userId: string) {
    const deleted = await this.profiles.softDeleteProfile(userId);

    if (!deleted) {
      throw new AppError("NOT_FOUND", "Profile not found.", 404);
    }

    return { deleted: true as const };
  }

  async replaceSkills(userId: string, skills: ProfileSkillInput[]) {
    await this.ensureActiveProfile(userId);
    assertUnique(skills.map((skill) => skill.skillId), "skills");
    const profile = await this.profiles.replaceSkills(userId, skills);
    return this.requireProfile(profile);
  }

  async replaceIndustries(userId: string, industryIds: string[]) {
    await this.ensureActiveProfile(userId);
    assertUnique(industryIds, "industries");
    const profile = await this.profiles.replaceIndustries(userId, industryIds);
    return this.requireProfile(profile);
  }

  async replaceInterests(userId: string, interestIds: string[]) {
    await this.ensureActiveProfile(userId);
    assertUnique(interestIds, "interests");
    const profile = await this.profiles.replaceInterests(userId, interestIds);
    return this.requireProfile(profile);
  }

  async replaceCommunities(userId: string, communityIds: string[]) {
    await this.ensureActiveProfile(userId);
    assertUnique(communityIds, "communities");
    const profile = await this.profiles.replaceCommunities(userId, communityIds);
    return this.requireProfile(profile);
  }

  async createExperience(userId: string, input: ExperienceInput) {
    await this.ensureActiveProfile(userId);
    return this.profiles.createExperience(userId, input);
  }

  async updateExperience(userId: string, experienceId: string, input: Partial<ExperienceInput>) {
    await this.ensureActiveProfile(userId);
    const experience = await this.profiles.updateExperience(userId, experienceId, input);

    if (!experience) {
      throw new AppError("NOT_FOUND", "Experience not found.", 404);
    }

    return experience;
  }

  async deleteExperience(userId: string, experienceId: string) {
    await this.ensureActiveProfile(userId);
    const deleted = await this.profiles.deleteExperience(userId, experienceId);

    if (!deleted) {
      throw new AppError("NOT_FOUND", "Experience not found.", 404);
    }

    return { deleted: true as const };
  }

  async createEducation(userId: string, input: EducationInput) {
    await this.ensureActiveProfile(userId);
    return this.profiles.createEducation(userId, input);
  }

  async updateEducation(userId: string, educationId: string, input: Partial<EducationInput>) {
    await this.ensureActiveProfile(userId);
    const education = await this.profiles.updateEducation(userId, educationId, input);

    if (!education) {
      throw new AppError("NOT_FOUND", "Education not found.", 404);
    }

    return education;
  }

  async deleteEducation(userId: string, educationId: string) {
    await this.ensureActiveProfile(userId);
    const deleted = await this.profiles.deleteEducation(userId, educationId);

    if (!deleted) {
      throw new AppError("NOT_FOUND", "Education not found.", 404);
    }

    return { deleted: true as const };
  }

  async createPortfolioLink(userId: string, input: PortfolioLinkInput) {
    await this.ensureActiveProfile(userId);
    return this.profiles.createPortfolioLink(userId, input);
  }

  async updatePortfolioLink(userId: string, linkId: string, input: Partial<PortfolioLinkInput>) {
    await this.ensureActiveProfile(userId);
    const link = await this.profiles.updatePortfolioLink(userId, linkId, input);

    if (!link) {
      throw new AppError("NOT_FOUND", "Portfolio link not found.", 404);
    }

    return link;
  }

  async deletePortfolioLink(userId: string, linkId: string) {
    await this.ensureActiveProfile(userId);
    const deleted = await this.profiles.deletePortfolioLink(userId, linkId);

    if (!deleted) {
      throw new AppError("NOT_FOUND", "Portfolio link not found.", 404);
    }

    return { deleted: true as const };
  }

  calculateCompletion(profile: PrivateProfileRecord) {
    const checks = [
      ["name", hasValue(profile.name)],
      ["username", hasValue(profile.username)],
      ["profilePhoto", hasValue(profile.profilePhotoUrl)],
      ["headline", hasValue(profile.headline)],
      ["bio", hasValue(profile.bio)],
      ["location", hasValue(profile.country) && hasValue(profile.city)],
      ["status", hasValue(profile.status)],
      ["availability", hasValue(profile.availability)],
      ["skills", profile.skills.length > 0],
      ["experience", profile.experiences.length > 0],
      ["education", profile.education.length > 0],
      ["industries", profile.industries.length > 0],
      ["interests", profile.interests.length > 0],
      ["communities", profile.communityMemberships.length > 0],
      ["portfolio", profile.portfolioLinks.length > 0]
    ] as const;

    const completedFields = checks.filter(([, complete]) => complete).map(([field]) => field);
    const missingFields = checks.filter(([, complete]) => !complete).map(([field]) => field);

    return {
      score: Math.round((completedFields.length / checks.length) * 100),
      completedFields,
      missingFields
    };
  }

  private withCompletion(profile: PrivateProfileRecord) {
    return {
      ...profile,
      completion: this.calculateCompletion(profile)
    };
  }

  private async ensureActiveProfile(userId: string) {
    const profile = await this.profiles.findPrivateProfileByUserId(userId);

    if (!profile) {
      throw new AppError("NOT_FOUND", "Profile not found.", 404);
    }
  }

  private requireProfile(profile: Awaited<ReturnType<ProfileRepository["findPrivateProfileByUserId"]>>) {
    if (!profile) {
      throw new AppError("NOT_FOUND", "Profile not found.", 404);
    }

    return this.withCompletion(profile);
  }
}

export const profileService = new ProfileService();
