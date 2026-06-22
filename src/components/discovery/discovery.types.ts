export type DiscoveryTarget = "users" | "startups" | "opportunities";

export type SwipeAction = "LEFT" | "RIGHT" | "SUPER_LIKE";

export type CompatibilityScore = {
  overallScore: number;
  skillsScore: number;
  visionScore: number;
  locationScore: number;
  consistencyScore: number;
  trustScore: number;
};

export type DiscoveryFeed<T> = {
  items: T[];
  nextCursor: string | null;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error?: {
    message?: string;
  };
};

export type UserDiscoveryItem = {
  id: string;
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
  skills: Array<{
    skill: {
      name: string;
      slug: string;
    };
    yearsExperience: number | null;
  }>;
  industries: Array<{
    industry: {
      name: string;
      slug: string;
    };
  }>;
  interests: Array<{
    interest: {
      name: string;
      slug: string;
    };
  }>;
  communityMemberships: Array<{
    community: {
      name: string;
      slug: string;
      isVerified: boolean;
    };
  }>;
  reputation: {
    builderScore: number;
    trustScore: number;
    collaborationScore: number;
  } | null;
  compatibility: CompatibilityScore;
};

export type StartupDiscoveryItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  tagline: string | null;
  description: string | null;
  website: string | null;
  teamSize: number | null;
  country: string | null;
  state: string | null;
  city: string | null;
  remoteAllowed: boolean;
  workStyle: string | null;
  startupStage: string;
  fundingStage: string;
  hiringStatus: string;
  openRolesCount: number;
  equityAvailable: boolean;
  salaryAvailable: boolean;
  profileViewsCount: number;
  followersCount: number;
  savesCount: number;
  applicationsCount: number;
  industry: {
    id: string;
    name: string;
    slug: string;
  } | null;
  members: Array<{
    role: string;
    isFounder: boolean;
    user: {
      username: string;
      name: string;
      profilePhotoUrl: string | null;
    };
  }>;
  compatibility: CompatibilityScore;
};

export type OpportunityDiscoveryItem = {
  id: string;
  roleName: string;
  opportunityType: string;
  description: string | null;
  openings: number;
  experienceLevel: string;
  compensationType: string;
  equityMinPercent: string | number | null;
  equityMaxPercent: string | number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  commitment: string | null;
  remoteAllowed: boolean;
  workStyle: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  status: string;
  viewsCount: number;
  savesCount: number;
  applicationsCount: number;
  startup: {
    name: string;
    slug: string;
    logoUrl: string | null;
    startupStage: string;
    fundingStage: string;
    industry: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  skills: Array<{
    skill: {
      name: string;
      slug: string;
    };
  }>;
  compatibility: CompatibilityScore;
};

export type DiscoveryItem = UserDiscoveryItem | StartupDiscoveryItem | OpportunityDiscoveryItem;
