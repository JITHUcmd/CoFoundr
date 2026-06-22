import { prisma } from "@/lib/db/prisma";
import type {
  EducationInput,
  ExperienceInput,
  PortfolioLinkInput,
  PublicProfile,
  ProfileSkillInput,
  ProfileUpdateInput
} from "@/types/profile.types";

const profileSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  profilePhotoUrl: true,
  headline: true,
  bio: true,
  country: true,
  state: true,
  city: true,
  status: true,
  availability: true,
  createdAt: true,
  updatedAt: true,
  roles: true,
  skills: {
    select: {
      skillId: true,
      proficiency: true,
      yearsExperience: true,
      isPrimary: true,
      skill: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  },
  industries: {
    select: {
      industryId: true,
      industry: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  },
  interests: {
    select: {
      interestId: true,
      interest: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  },
  experiences: {
    select: {
      id: true,
      industryId: true,
      companyName: true,
      title: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      industry: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: {
      startDate: "desc" as const
    }
  },
  education: {
    select: {
      id: true,
      institution: true,
      degree: true,
      field: true,
      startDate: true,
      endDate: true,
      description: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      startDate: "desc" as const
    }
  },
  portfolioLinks: {
    select: {
      id: true,
      type: true,
      label: true,
      url: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      createdAt: "desc" as const
    }
  },
  communityMemberships: {
    select: {
      communityId: true,
      role: true,
      joinedAt: true,
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
          isVerified: true
        }
      }
    }
  }
};

const publicProfileSelect = {
  id: true,
  username: true,
  name: true,
  profilePhotoUrl: true,
  headline: true,
  bio: true,
  country: true,
  state: true,
  city: true,
  skills: profileSelect.skills,
  industries: profileSelect.industries,
  interests: profileSelect.interests,
  communityMemberships: profileSelect.communityMemberships,
  reputation: {
    select: {
      builderScore: true,
      trustScore: true,
      collaborationScore: true
    }
  }
};

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export class ProfileRepository {
  async findPrivateProfileByUserId(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: profileSelect
    });
  }

  async findPublicProfileByUserId(userId: string): Promise<PublicProfile | null> {
    const profile = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: publicProfileSelect
    });

    if (!profile) return null;

    return {
      id: profile.id,
      username: profile.username,
      name: profile.name,
      profilePhoto: profile.profilePhotoUrl,
      headline: profile.headline,
      bio: profile.bio,
      country: profile.country,
      state: profile.state,
      city: profile.city,
      skills: profile.skills,
      industries: profile.industries,
      interests: profile.interests,
      communities: profile.communityMemberships,
      builderScore: profile.reputation?.builderScore ?? 0,
      trustScore: profile.reputation?.trustScore ?? 0,
      collaborationScore: profile.reputation?.collaborationScore ?? 0
    };
  }

  async usernameExists(username: string, excludeUserId?: string) {
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: normalizeUsername(username),
          mode: "insensitive"
        },
        id: excludeUserId ? { not: excludeUserId } : undefined
      },
      select: { id: true }
    });

    return Boolean(user);
  }

  async updateProfile(userId: string, input: ProfileUpdateInput) {
    const data = {
      ...input,
      username: input.username ? normalizeUsername(input.username) : undefined
    };

    return prisma.user.update({
      where: { id: userId, deletedAt: null },
      data,
      select: profileSelect
    });
  }

  async initializeProfile(userId: string, input: ProfileUpdateInput) {
    const data = {
      ...input,
      username: input.username ? normalizeUsername(input.username) : undefined,
      deletedAt: null
    };

    return prisma.user.update({
      where: { id: userId },
      data,
      select: profileSelect
    });
  }

  async softDeleteProfile(userId: string) {
    const result = await prisma.user.updateMany({
      where: { id: userId, deletedAt: null },
      data: { deletedAt: new Date() }
    });

    return result.count === 1;
  }

  async replaceSkills(userId: string, skills: ProfileSkillInput[]) {
    await prisma.$transaction(async (tx) => {
      await tx.userSkill.deleteMany({ where: { userId } });

      if (skills.length) {
        await tx.userSkill.createMany({
          data: skills.map((skill) => ({
            userId,
            skillId: skill.skillId,
            proficiency: skill.proficiency ?? null,
            yearsExperience: skill.yearsExperience ?? null,
            isPrimary: skill.isPrimary ?? false
          }))
        });
      }
    });

    return this.findPrivateProfileByUserId(userId);
  }

  async replaceIndustries(userId: string, industryIds: string[]) {
    await prisma.$transaction(async (tx) => {
      await tx.userIndustry.deleteMany({ where: { userId } });

      if (industryIds.length) {
        await tx.userIndustry.createMany({
          data: industryIds.map((industryId) => ({ userId, industryId })),
          skipDuplicates: true
        });
      }
    });

    return this.findPrivateProfileByUserId(userId);
  }

  async replaceInterests(userId: string, interestIds: string[]) {
    await prisma.$transaction(async (tx) => {
      await tx.userInterest.deleteMany({ where: { userId } });

      if (interestIds.length) {
        await tx.userInterest.createMany({
          data: interestIds.map((interestId) => ({ userId, interestId })),
          skipDuplicates: true
        });
      }
    });

    return this.findPrivateProfileByUserId(userId);
  }

  async replaceCommunities(userId: string, communityIds: string[]) {
    await prisma.$transaction(async (tx) => {
      await tx.communityMembership.deleteMany({ where: { userId } });

      if (communityIds.length) {
        await tx.communityMembership.createMany({
          data: communityIds.map((communityId) => ({ userId, communityId })),
          skipDuplicates: true
        });
      }
    });

    return this.findPrivateProfileByUserId(userId);
  }

  async createExperience(userId: string, input: ExperienceInput) {
    return prisma.experience.create({
      data: {
        userId,
        ...input
      },
      include: {
        industry: true
      }
    });
  }

  async updateExperience(userId: string, experienceId: string, input: Partial<ExperienceInput>) {
    const result = await prisma.experience.updateMany({
      where: { id: experienceId, userId },
      data: input
    });

    if (result.count !== 1) return null;

    return prisma.experience.findUnique({
      where: { id: experienceId },
      include: { industry: true }
    });
  }

  async deleteExperience(userId: string, experienceId: string) {
    const result = await prisma.experience.deleteMany({
      where: { id: experienceId, userId }
    });

    return result.count === 1;
  }

  async createEducation(userId: string, input: EducationInput) {
    return prisma.education.create({
      data: {
        userId,
        ...input
      }
    });
  }

  async updateEducation(userId: string, educationId: string, input: Partial<EducationInput>) {
    const result = await prisma.education.updateMany({
      where: { id: educationId, userId },
      data: input
    });

    if (result.count !== 1) return null;

    return prisma.education.findUnique({
      where: { id: educationId }
    });
  }

  async deleteEducation(userId: string, educationId: string) {
    const result = await prisma.education.deleteMany({
      where: { id: educationId, userId }
    });

    return result.count === 1;
  }

  async createPortfolioLink(userId: string, input: PortfolioLinkInput) {
    return prisma.portfolioLink.create({
      data: {
        userId,
        ...input,
        isPrimary: input.isPrimary ?? false
      }
    });
  }

  async updatePortfolioLink(userId: string, linkId: string, input: Partial<PortfolioLinkInput>) {
    const result = await prisma.portfolioLink.updateMany({
      where: { id: linkId, userId },
      data: input
    });

    if (result.count !== 1) return null;

    return prisma.portfolioLink.findUnique({
      where: { id: linkId }
    });
  }

  async deletePortfolioLink(userId: string, linkId: string) {
    const result = await prisma.portfolioLink.deleteMany({
      where: { id: linkId, userId }
    });

    return result.count === 1;
  }
}

export const profileRepository = new ProfileRepository();
