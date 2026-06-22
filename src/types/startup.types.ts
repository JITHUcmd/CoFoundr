import type {
  FundingStage,
  HiringStatus,
  StartupStage,
  VerificationStatus,
  WorkStyle
} from "@prisma/client";

export type StartupInput = {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  tagline?: string | null;
  description?: string | null;
  website?: string | null;
  industryId?: string | null;
  startupStage?: StartupStage;
  foundedDate?: Date | null;
  teamSize?: number | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  remoteAllowed?: boolean;
  workStyle?: WorkStyle | null;
  fundingStage?: FundingStage;
  fundingTargetAmount?: number | null;
  hiringStatus?: HiringStatus;
  openRolesCount?: number;
  equityAvailable?: boolean;
  salaryAvailable?: boolean;
};

export type CreateStartupInput = StartupInput & {
  name: string;
  slug: string;
};

export type StartupMemberRole =
  | "CEO"
  | "CTO"
  | "COO"
  | "TECHNICAL_CO_FOUNDER"
  | "PRODUCT_LEAD"
  | "ADVISOR"
  | "INVESTOR";

export type StartupMemberInput = {
  userId: string;
  role: StartupMemberRole;
  isFounder?: boolean;
};

export type StartupAnalytics = {
  profileViews: number;
  follows: number;
  saves: number;
  applications: number;
};

export type StartupVerificationRequestInput = {
  evidenceUrl?: string | null;
};

export type StartupVerificationStatus = {
  status: VerificationStatus;
  notes: string | null;
};
