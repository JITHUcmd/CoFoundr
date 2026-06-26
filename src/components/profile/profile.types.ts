export type ProfileSkill = {
  skillId: string;
  proficiency: string | null;
  yearsExperience: number | null;
  isPrimary: boolean;
  skill: {
    id: string;
    name: string;
    slug: string;
  };
};

export type ProfileIndustry = {
  industryId: string;
  industry: {
    id: string;
    name: string;
    slug: string;
  };
};

export type ProfileInterest = {
  interestId: string;
  interest: {
    id: string;
    name: string;
    slug: string;
  };
};

export type ProfileCommunity = {
  communityId: string;
  role: string | null;
  joinedAt: string;
  community: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
  };
};

export type ProfileExperience = {
  id: string;
  industryId: string | null;
  companyName: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  industry: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type ProfileEducation = {
  id: string;
  institution: string;
  degree: string | null;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
};

export type PortfolioLink = {
  id: string;
  type: string;
  label: string | null;
  url: string;
  isPrimary: boolean;
};

export type ProfileCompletion = {
  score: number;
  completedFields: string[];
  missingFields: string[];
};

export type PrivateProfile = {
  id: string;
  email: string;
  username: string;
  name: string;
  profilePhotoUrl: string | null;
  headline: string | null;
  bio: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  status: string;
  availability: string | null;
  skills: ProfileSkill[];
  industries: ProfileIndustry[];
  interests: ProfileInterest[];
  experiences: ProfileExperience[];
  education: ProfileEducation[];
  portfolioLinks: PortfolioLink[];
  communityMemberships: ProfileCommunity[];
  completion: ProfileCompletion;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error?: {
    code?: string;
    message?: string;
  };
};

export type ProfileResponse = ApiSuccess<{ profile: PrivateProfile }> | ApiFailure;
