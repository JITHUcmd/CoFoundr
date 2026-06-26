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

export type StartupIndustry = {
  id: string;
  name: string;
  slug: string;
} | null;

export type StartupMember = {
  id: string;
  userId: string;
  role: string;
  isFounder: boolean;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    profilePhotoUrl: string | null;
  };
};

export type Startup = {
  id: string;
  ownerId: string;
  industryId: string | null;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  tagline: string | null;
  description: string | null;
  website: string | null;
  foundedDate: string | null;
  teamSize: number | null;
  country: string | null;
  state: string | null;
  city: string | null;
  remoteAllowed: boolean;
  workStyle: string | null;
  startupStage: string;
  fundingStage: string;
  fundingTargetAmount: number | null;
  hiringStatus: string;
  openRolesCount: number;
  equityAvailable: boolean;
  salaryAvailable: boolean;
  verificationStatus: string;
  verificationNotes: string | null;
  profileViewsCount: number;
  followersCount: number;
  savesCount: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  industry: StartupIndustry;
  members: StartupMember[];
};

export type StartupOpportunity = {
  id: string;
  roleName: string;
  opportunityType: string;
  description: string | null;
  openings: number;
  experienceLevel: string;
  compensationType: string;
  status: string;
  workStyle: string | null;
  remoteAllowed: boolean;
  country: string | null;
  state: string | null;
  city: string | null;
  viewsCount: number;
  savesCount: number;
  applicationsCount: number;
};

export type StartupAnalytics = {
  profileViews: number;
  follows: number;
  saves: number;
  applications: number;
};

export type StartupVerification = {
  status: string;
  notes?: string | null;
};

export type StartupResponse = ApiSuccess<{ startup: Startup }> | ApiFailure;
export type StartupOpportunitiesResponse = ApiSuccess<{ opportunities: StartupOpportunity[] }> | ApiFailure;
export type StartupAnalyticsResponse = ApiSuccess<{ analytics: StartupAnalytics }> | ApiFailure;
export type StartupVerificationResponse = ApiSuccess<{ verification: StartupVerification }> | ApiFailure;
export type StartupMemberResponse = ApiSuccess<{ member: StartupMember }> | ApiFailure;
