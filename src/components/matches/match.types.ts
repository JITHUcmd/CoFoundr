export type MatchType = "USER" | "STARTUP" | "OPPORTUNITY";

export type MatchStatus = "ACTIVE" | "ARCHIVED" | "BLOCKED" | "UNMATCHED" | "EXPIRED";

export type MatchScores = {
  matchScore: number;
  compatibilityScore: number;
  skillsScore: number;
  founderVisionScore: number;
  locationScore: number;
  consistencyScore: number;
  trustScore: number;
  builderScore: number;
};

export type PublicMatchUser = {
  id: string;
  username: string;
  name: string;
  profilePhotoUrl: string | null;
  headline: string | null;
};

export type PublicMatchStartup = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  tagline: string | null;
  ownerId: string;
};

export type PublicMatchOpportunity = {
  id: string;
  roleName: string;
  opportunityType: string;
  status: string;
  startup: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    ownerId: string;
  };
};

type MatchBase = {
  id: string;
  status: MatchStatus;
  createdAt: string;
  archivedAt: string | null;
  blockedAt: string | null;
  scores: MatchScores;
};

export type UserMatch = MatchBase & {
  type: "USER";
  participants: PublicMatchUser[];
};

export type StartupMatch = MatchBase & {
  type: "STARTUP";
  user: PublicMatchUser;
  startup: PublicMatchStartup;
  participants: Array<{
    userId: string;
    role: "USER" | "STARTUP_OWNER";
  }>;
};

export type OpportunityMatch = MatchBase & {
  type: "OPPORTUNITY";
  user: PublicMatchUser;
  opportunity: PublicMatchOpportunity;
  participants: Array<{
    userId: string;
    role: "USER" | "STARTUP_OWNER";
  }>;
};

export type MatchItem = UserMatch | StartupMatch | OpportunityMatch;

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
