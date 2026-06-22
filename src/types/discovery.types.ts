import type {
  Availability,
  FundingStage,
  HiringStatus,
  OpportunityType,
  SwipeAction,
  UserStatus,
  WorkStyle
} from "@prisma/client";

export type DiscoveryCursor = {
  cursor?: string;
  limit: number;
};

export type UserDiscoveryFilters = DiscoveryCursor & {
  skillIds?: string[];
  industryIds?: string[];
  minExperienceYears?: number;
  country?: string;
  state?: string;
  city?: string;
  availability?: Availability;
  status?: UserStatus;
  workStyle?: WorkStyle;
};

export type StartupDiscoveryFilters = DiscoveryCursor & {
  industryIds?: string[];
  fundingStage?: FundingStage;
  country?: string;
  state?: string;
  city?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  hiringStatus?: HiringStatus;
  fundraisingOnly?: boolean;
};

export type OpportunityDiscoveryFilters = DiscoveryCursor & {
  opportunityType?: OpportunityType;
  skillIds?: string[];
  equityAvailable?: boolean;
  salaryAvailable?: boolean;
  remoteAllowed?: boolean;
  country?: string;
  state?: string;
  city?: string;
};

export type SwipeInput = {
  targetId: string;
  action: SwipeAction;
  startupId?: string;
};

export type CompatibilityScore = {
  overallScore: number;
  skillsScore: number;
  visionScore: number;
  locationScore: number;
  consistencyScore: number;
  trustScore: number;
};

export type RankedDiscoveryItem<T> = T & {
  compatibility: CompatibilityScore;
};

export type DiscoveryFeed<T> = {
  items: Array<RankedDiscoveryItem<T>>;
  nextCursor: string | null;
};
