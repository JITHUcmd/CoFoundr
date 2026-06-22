import type { MatchStatus } from "@prisma/client";

export type MatchType = "USER" | "STARTUP" | "OPPORTUNITY";

export type MatchScoreSnapshot = {
  matchScore: number;
  compatibilityScore: number;
  skillsScore: number;
  founderVisionScore: number;
  locationScore: number;
  consistencyScore: number;
  trustScore: number;
  builderScore: number;
};

export type MatchListFilters = {
  type?: MatchType;
  status?: MatchStatus;
  limit: number;
};

export type MatchNotificationEvent = {
  matchId: string;
  matchType: MatchType;
  participantUserIds: string[];
};
