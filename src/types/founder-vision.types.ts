import type {
  CommitmentLevel,
  FundingPreference,
  RiskAppetite,
  StartupGoal,
  WorkStyle
} from "@prisma/client";

export type FounderVisionInput = {
  startupGoal?: StartupGoal | null;
  fundingPreference?: FundingPreference | null;
  riskAppetite?: RiskAppetite | null;
  commitmentLevel?: CommitmentLevel | null;
  workStyle?: WorkStyle | null;
  preferredTeamSize?: number | null;
  preferredCoFounderType?: string | null;
  remotePreference?: WorkStyle | null;
};

export type FounderVisionCompatibility = {
  score: number;
  matchedFields: string[];
  mismatchedFields: string[];
  missingFields: string[];
};
