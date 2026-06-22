import { AppError } from "@/lib/errors/app-error";
import {
  matchRepository,
  type MatchRepository,
  type OpportunityInterestRecord,
  type MatchUserContext,
  type OpportunityMatchRecord,
  type StartupInterestRecord,
  type StartupMatchRecord,
  type UserMatchRecord
} from "@/repositories/match.repository";
import {
  matchNotificationHooks,
  type MatchNotificationHooks
} from "@/services/matching/match-notification.hooks";
import {
  messageRepository,
  type MessageRepository
} from "@/repositories/message.repository";
import type { MatchListFilters, MatchScoreSnapshot, MatchType } from "@/types/match.types";
import {
  analyticsEvents,
  type AnalyticsEventsService
} from "@/services/analytics/analytics-events.service";

type MatchServiceDeps = {
  matches?: MatchRepository;
  notifications?: MatchNotificationHooks;
  conversations?: Pick<MessageRepository, "getOrCreateConversationForMatch">;
  analytics?: Pick<AnalyticsEventsService, "matchCreated">;
};

type AnyMatchRecord = UserMatchRecord | StartupMatchRecord | OpportunityMatchRecord;

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function overlapScore(sourceIds: string[], targetIds: string[]) {
  if (!sourceIds.length || !targetIds.length) return 0;

  const targetSet = new Set(targetIds);
  const matches = sourceIds.filter((id) => targetSet.has(id)).length;

  return clampScore((matches / Math.max(sourceIds.length, targetIds.length)) * 100);
}

function locationScore(source: MatchUserContext, target: MatchUserContext) {
  let score = 0;

  if (source.country && target.country && source.country === target.country) score += 40;
  if (source.state && target.state && source.state === target.state) score += 30;
  if (source.city && target.city && source.city === target.city) score += 30;

  return clampScore(score);
}

function founderVisionScore(source: MatchUserContext, target: MatchUserContext) {
  if (!source.founderVision || !target.founderVision) return 0;

  const checks = [
    source.founderVision.startupGoal &&
      target.founderVision.startupGoal &&
      source.founderVision.startupGoal === target.founderVision.startupGoal,
    source.founderVision.fundingPreference &&
      target.founderVision.fundingPreference &&
      source.founderVision.fundingPreference === target.founderVision.fundingPreference,
    source.founderVision.riskAppetite &&
      target.founderVision.riskAppetite &&
      source.founderVision.riskAppetite === target.founderVision.riskAppetite,
    source.founderVision.commitmentLevel &&
      target.founderVision.commitmentLevel &&
      source.founderVision.commitmentLevel === target.founderVision.commitmentLevel,
    source.founderVision.workStyle &&
      target.founderVision.workStyle &&
      source.founderVision.workStyle === target.founderVision.workStyle,
    source.founderVision.remotePreference &&
      target.founderVision.remotePreference &&
      source.founderVision.remotePreference === target.founderVision.remotePreference
  ];
  const knownChecks = checks.filter((value) => value !== null && value !== undefined);

  if (!knownChecks.length) return 0;
  return clampScore((knownChecks.filter(Boolean).length / knownChecks.length) * 100);
}

function averageScore(source?: number | null, target?: number | null) {
  return clampScore(((source ?? 0) + (target ?? 0)) / 2);
}

function scoreSnapshot(source: MatchUserContext, target: MatchUserContext): MatchScoreSnapshot {
  const skillsScore = overlapScore(
    source.skills.map((skill) => skill.skillId),
    target.skills.map((skill) => skill.skillId)
  );
  const visionScore = founderVisionScore(source, target);
  const candidateLocationScore = locationScore(source, target);
  const consistencyScore = averageScore(
    source.reputation?.collaborationScore,
    target.reputation?.collaborationScore
  );
  const trustScore = averageScore(source.reputation?.trustScore, target.reputation?.trustScore);
  const builderScore = averageScore(source.reputation?.builderScore, target.reputation?.builderScore);
  const compatibilityScore = clampScore(
    (skillsScore * 30) / 100 +
    (visionScore * 25) / 100 +
    (candidateLocationScore * 15) / 100 +
    (consistencyScore * 10) / 100 +
    (trustScore * 10) / 100 +
    (builderScore * 10) / 100
  );

  return {
    matchScore: compatibilityScore,
    compatibilityScore,
    skillsScore,
    founderVisionScore: visionScore,
    locationScore: candidateLocationScore,
    consistencyScore,
    trustScore,
    builderScore
  };
}

function normalizeUserPair(userAId: string, userBId: string) {
  return [userAId, userBId].sort() as [string, string];
}

function scoreFields(match: AnyMatchRecord) {
  return {
    matchScore: match.matchScore,
    compatibilityScore: match.compatibilityScore,
    skillsScore: match.skillsScore,
    founderVisionScore: match.founderVisionScore,
    locationScore: match.locationScore,
    consistencyScore: match.consistencyScore,
    trustScore: match.trustScore,
    builderScore: match.builderScore
  };
}

export class MatchService {
  private readonly matches: MatchRepository;
  private readonly notifications: MatchNotificationHooks;
  private readonly conversations: Pick<MessageRepository, "getOrCreateConversationForMatch">;
  private readonly analytics: Pick<AnalyticsEventsService, "matchCreated">;

  constructor(deps: MatchServiceDeps = {}) {
    this.matches = deps.matches ?? matchRepository;
    this.notifications = deps.notifications ?? matchNotificationHooks;
    this.conversations = deps.conversations ?? messageRepository;
    this.analytics = deps.analytics ?? analyticsEvents;
  }

  async createUserMatchFromSwipe(swiperId: string, targetUserId: string) {
    const [userAId, userBId] = normalizeUserPair(swiperId, targetUserId);

    if (!await this.matches.hasPositiveUserSwipe(swiperId, targetUserId)) return null;
    if (!await this.matches.hasPositiveUserSwipe(targetUserId, swiperId)) return null;
    if (await this.matches.areUsersBlocked(swiperId, targetUserId)) return null;

    const [swiper, targetUser] = await Promise.all([
      this.matches.findVisibleUserContext(swiperId),
      this.matches.findVisibleUserContext(targetUserId)
    ]);

    if (!swiper || !targetUser) return null;

    const existing = await this.matches.findUserMatch(userAId, userBId);

    if (existing) return this.toUserMatchDto(existing);

    const match = await this.matches.createUserMatch(
      userAId,
      userBId,
      swiperId,
      scoreSnapshot(swiper, targetUser)
    );

    await this.conversations.getOrCreateConversationForMatch({
      type: "USER",
      matchId: match.id,
      participantUserIds: [userAId, userBId]
    });
    await this.notifyMatchCreated("USER", match.id, [userAId, userBId]);
    return this.toUserMatchDto(match);
  }

  async createStartupMatchFromStartupSwipe(userId: string, startupId: string) {
    if (!await this.matches.hasPositiveStartupSwipe(userId, startupId)) return null;

    const startup = await this.matches.findVisibleStartup(startupId);

    if (!startup) return null;
    if (await this.matches.areUsersBlocked(userId, startup.ownerId)) return null;
    return null;
  }

  async listStartupInterests(ownerId: string, startupId: string) {
    const startup = await this.matches.findVisibleStartup(startupId);

    if (!startup || startup.ownerId !== ownerId) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    const interests = await this.matches.listStartupInterests(startupId);
    return interests.map((interest) => this.toStartupInterestDto(interest));
  }

  async acceptStartupInterest(ownerId: string, startupId: string, interestedUserId: string) {
    if (ownerId === interestedUserId) {
      throw new AppError("FORBIDDEN", "You cannot accept your own startup interest.", 403);
    }

    const startup = await this.matches.findVisibleStartup(startupId);

    if (!startup || startup.ownerId !== ownerId) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    if (!await this.matches.hasPositiveStartupSwipe(interestedUserId, startupId)) {
      throw new AppError("NOT_FOUND", "Startup interest not found.", 404);
    }

    if (await this.matches.areUsersBlocked(interestedUserId, ownerId)) {
      throw new AppError("FORBIDDEN", "This startup interest is not available.", 403);
    }

    return this.createStartupMatch(interestedUserId, startupId, ownerId, ownerId);
  }

  async createStartupMatchFromOwnerUserSwipe(ownerId: string, targetUserId: string, startupId: string) {
    if (!await this.matches.hasPositiveUserSwipe(ownerId, targetUserId)) return null;

    const startup = await this.matches.findStartupReadyForOwnerSwipe(ownerId, targetUserId, startupId);

    if (!startup) return null;
    if (await this.matches.areUsersBlocked(ownerId, targetUserId)) return null;

    return this.createStartupMatch(targetUserId, startup.id, ownerId, ownerId);
  }

  async createOpportunityMatchFromOpportunitySwipe(userId: string, opportunityId: string) {
    if (!await this.matches.hasPositiveOpportunitySwipe(userId, opportunityId)) return null;

    const opportunity = await this.matches.findVisibleOpportunity(opportunityId);

    if (!opportunity) return null;
    if (await this.matches.areUsersBlocked(userId, opportunity.startup.ownerId)) return null;
    return null;
  }

  async listOpportunityInterests(ownerId: string, opportunityId: string) {
    const opportunity = await this.matches.findVisibleOpportunity(opportunityId);

    if (!opportunity || opportunity.startup.ownerId !== ownerId) {
      throw new AppError("NOT_FOUND", "Opportunity not found.", 404);
    }

    const interests = await this.matches.listOpportunityInterests(opportunityId);
    return interests.map((interest) => this.toOpportunityInterestDto(interest));
  }

  async acceptOpportunityInterest(ownerId: string, opportunityId: string, interestedUserId: string) {
    if (ownerId === interestedUserId) {
      throw new AppError("FORBIDDEN", "You cannot accept your own opportunity interest.", 403);
    }

    const opportunity = await this.matches.findVisibleOpportunity(opportunityId);

    if (!opportunity || opportunity.startup.ownerId !== ownerId) {
      throw new AppError("NOT_FOUND", "Opportunity not found.", 404);
    }

    if (!await this.matches.hasPositiveOpportunitySwipe(interestedUserId, opportunityId)) {
      throw new AppError("NOT_FOUND", "Opportunity interest not found.", 404);
    }

    if (await this.matches.areUsersBlocked(interestedUserId, ownerId)) {
      throw new AppError("FORBIDDEN", "This opportunity interest is not available.", 403);
    }

    return this.createOpportunityMatch(interestedUserId, opportunityId, ownerId);
  }

  async createOpportunityMatchFromAcceptedApplication(applicationId: string, reviewerId: string) {
    const application = await this.matches.findAcceptedApplication(applicationId);

    if (!application || application.opportunity.startup.ownerId !== reviewerId) return null;
    if (await this.matches.areUsersBlocked(application.applicantId, reviewerId)) return null;

    return this.createOpportunityMatch(application.applicantId, application.opportunityId, reviewerId);
  }

  async listMatches(userId: string, filters: MatchListFilters) {
    const [userMatches, startupMatches, opportunityMatches] = await Promise.all([
      !filters.type || filters.type === "USER" ? this.matches.listUserMatches(userId, filters) : [],
      !filters.type || filters.type === "STARTUP" ? this.matches.listStartupMatches(userId, filters) : [],
      !filters.type || filters.type === "OPPORTUNITY" ? this.matches.listOpportunityMatches(userId, filters) : []
    ]);

    return [...userMatches.map((match) => this.toUserMatchDto(match)),
      ...startupMatches.map((match) => this.toStartupMatchDto(match)),
      ...opportunityMatches.map((match) => this.toOpportunityMatchDto(match))]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, filters.limit);
  }

  async getMatch(userId: string, matchId: string) {
    const match = await this.matches.findMatchByIdForUser(matchId, userId);

    if (!match) {
      throw new AppError("NOT_FOUND", "Match not found.", 404);
    }

    return this.toMatchDto(match);
  }

  async archiveMatch(userId: string, matchId: string) {
    return this.updateStatus(userId, matchId, "ARCHIVED");
  }

  async blockMatch(userId: string, matchId: string) {
    return this.updateStatus(userId, matchId, "BLOCKED");
  }

  private async createStartupMatch(userId: string, startupId: string, ownerId: string, createdByUserId: string) {
    const [user, owner] = await Promise.all([
      this.matches.findVisibleUserContext(userId),
      this.matches.findVisibleUserContext(ownerId)
    ]);

    if (!user || !owner) return null;

    const existing = await this.matches.findStartupMatch(userId, startupId);

    if (existing) return this.toStartupMatchDto(existing);

    const match = await this.matches.createStartupMatch(
      userId,
      startupId,
      createdByUserId,
      scoreSnapshot(user, owner)
    );

    await this.conversations.getOrCreateConversationForMatch({
      type: "STARTUP",
      matchId: match.id,
      participantUserIds: [userId, ownerId]
    });
    await this.notifyMatchCreated("STARTUP", match.id, [userId, ownerId]);
    return this.toStartupMatchDto(match);
  }

  private async createOpportunityMatch(userId: string, opportunityId: string, ownerId: string) {
    const [user, owner] = await Promise.all([
      this.matches.findVisibleUserContext(userId),
      this.matches.findVisibleUserContext(ownerId)
    ]);

    if (!user || !owner) return null;

    const existing = await this.matches.findOpportunityMatch(userId, opportunityId);

    if (existing) return this.toOpportunityMatchDto(existing);

    const match = await this.matches.createOpportunityMatch(
      userId,
      opportunityId,
      ownerId,
      scoreSnapshot(user, owner)
    );

    await this.conversations.getOrCreateConversationForMatch({
      type: "OPPORTUNITY",
      matchId: match.id,
      participantUserIds: [userId, ownerId]
    });
    await this.notifyMatchCreated("OPPORTUNITY", match.id, [userId, ownerId]);
    return this.toOpportunityMatchDto(match);
  }

  private async updateStatus(userId: string, matchId: string, status: "ARCHIVED" | "BLOCKED") {
    const match = await this.matches.updateMatchStatusForUser(matchId, userId, status);

    if (!match) {
      throw new AppError("NOT_FOUND", "Active match not found.", 404);
    }

    return this.toMatchDto(match);
  }

  private async notifyMatchCreated(matchType: MatchType, matchId: string, participantUserIds: string[]) {
    const event = {
      matchId,
      matchType,
      participantUserIds
    };

    await Promise.all([
      this.notifications.matchCreated(event),
      this.analytics.matchCreated(event)
    ]);
  }

  private toMatchDto(match: Awaited<ReturnType<MatchRepository["findMatchByIdForUser"]>>) {
    if (!match) {
      throw new AppError("NOT_FOUND", "Match not found.", 404);
    }

    if (match.type === "USER") return this.toUserMatchDto(match.match);
    if (match.type === "STARTUP") return this.toStartupMatchDto(match.match);
    return this.toOpportunityMatchDto(match.match);
  }

  private toUserMatchDto(match: UserMatchRecord) {
    return {
      id: match.id,
      type: "USER" as const,
      status: match.status,
      createdAt: match.createdAt,
      archivedAt: match.archivedAt,
      blockedAt: match.blockedAt,
      scores: scoreFields(match),
      participants: [match.userA, match.userB]
    };
  }

  private toStartupMatchDto(match: StartupMatchRecord) {
    return {
      id: match.id,
      type: "STARTUP" as const,
      status: match.status,
      createdAt: match.createdAt,
      archivedAt: match.archivedAt,
      blockedAt: match.blockedAt,
      scores: scoreFields(match),
      user: match.user,
      startup: match.startup,
      participants: [
        { userId: match.user.id, role: "USER" as const },
        { userId: match.startup.ownerId, role: "STARTUP_OWNER" as const }
      ]
    };
  }

  private toOpportunityMatchDto(match: OpportunityMatchRecord) {
    return {
      id: match.id,
      type: "OPPORTUNITY" as const,
      status: match.status,
      createdAt: match.createdAt,
      archivedAt: match.archivedAt,
      blockedAt: match.blockedAt,
      scores: scoreFields(match),
      user: match.user,
      opportunity: match.opportunity,
      participants: [
        { userId: match.user.id, role: "USER" as const },
        { userId: match.opportunity.startup.ownerId, role: "STARTUP_OWNER" as const }
      ]
    };
  }

  private toOpportunityInterestDto(interest: OpportunityInterestRecord) {
    return {
      id: interest.id,
      action: interest.action,
      createdAt: interest.createdAt,
      user: interest.swiper
    };
  }

  private toStartupInterestDto(interest: StartupInterestRecord) {
    return {
      id: interest.id,
      action: interest.action,
      createdAt: interest.createdAt,
      user: interest.swiper
    };
  }
}

export const matchService = new MatchService();
