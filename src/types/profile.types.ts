import type {
  Availability,
  PortfolioLinkType,
  SkillProficiency,
  UserStatus
} from "@prisma/client";

export type ProfileUpdateInput = {
  name?: string;
  username?: string;
  profilePhotoUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  status?: UserStatus;
  availability?: Availability | null;
};

export type ProfileSkillInput = {
  skillId: string;
  proficiency?: SkillProficiency | null;
  yearsExperience?: number | null;
  isPrimary?: boolean;
};

export type ExperienceInput = {
  industryId?: string | null;
  companyName: string;
  title: string;
  startDate?: Date | null;
  endDate?: Date | null;
  isCurrent?: boolean;
  description?: string | null;
};

export type EducationInput = {
  institution: string;
  degree?: string | null;
  field?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  description?: string | null;
};

export type PortfolioLinkInput = {
  type: PortfolioLinkType;
  label?: string | null;
  url: string;
  isPrimary?: boolean;
};

export type ProfileCompletion = {
  score: number;
  completedFields: string[];
  missingFields: string[];
};

export type PublicProfile = {
  id: string;
  username: string;
  name: string;
  profilePhoto: string | null;
  headline: string | null;
  bio: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  skills: Array<{
    skillId: string;
    proficiency: SkillProficiency | null;
    yearsExperience: number | null;
    isPrimary: boolean;
    skill: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  industries: Array<{
    industryId: string;
    industry: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  interests: Array<{
    interestId: string;
    interest: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  communities: Array<{
    communityId: string;
    role: string | null;
    joinedAt: Date;
    community: {
      id: string;
      name: string;
      slug: string;
      isVerified: boolean;
    };
  }>;
  builderScore: number;
  trustScore: number;
  collaborationScore: number;
};
