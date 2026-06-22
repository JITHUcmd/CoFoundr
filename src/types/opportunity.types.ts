import type {
  CommitmentLevel,
  CompensationType,
  ExperienceLevel,
  OpportunityStatus,
  OpportunityType,
  WorkStyle
} from "@prisma/client";

export type OpportunityInput = {
  roleName?: string;
  opportunityType?: OpportunityType;
  description?: string | null;
  openings?: number;
  experienceLevel?: ExperienceLevel;
  compensationType?: CompensationType;
  equityMinPercent?: number | null;
  equityMaxPercent?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  commitment?: CommitmentLevel | null;
  remoteAllowed?: boolean;
  workStyle?: WorkStyle | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  status?: OpportunityStatus;
  skillIds?: string[];
};

export type CreateOpportunityInput = OpportunityInput & {
  roleName: string;
  startupId: string;
  compensationType: CompensationType;
};

export type OpportunityApplicationInput = {
  note?: string | null;
};

export type OpportunityReviewInput = {
  reviewNote?: string | null;
};

export type OpportunityAnalytics = {
  views: number;
  saves: number;
  applications: number;
};
