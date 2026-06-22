import { AppError } from "@/lib/errors/app-error";
import {
  discoveryRepository,
  type CurrentUserDiscoveryContext,
  type DiscoveryOpportunityCandidate,
  type DiscoveryRepository,
  type DiscoveryStartupCandidate,
  type DiscoveryUserCandidate
} from "@/repositories/discovery.repository";
import type {
  CompatibilityScore,
  OpportunityDiscoveryFilters,
  StartupDiscoveryFilters,
  SwipeInput,
  UserDiscoveryFilters
} from "@/types/discovery.types";
import { matchService } from "@/services/matching/match.service";
import {
  analyticsEvents,
  type AnalyticsEventsService
} from "@/services/analytics/analytics-events.service";

type DiscoveryServiceDeps = {
  discovery?: DiscoveryRepository;
  analytics?: Pick<AnalyticsEventsService, "discoveryAppearances">;
};

type RankedItem<T> = {
  item: T;
  compatibility: CompatibilityScore;
};

const rankingWeights = {
  skills: 30,
  industry: 20,
  vision: 15,
  startupStage: 15,
  location: 10,
  activity: 5,
  consistency: 3,
  trust: 1,
  builder: 1
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeReputation(score: number | null | undefined) {
  return clampScore(score ?? 0);
}

function overlapScore(currentIds: string[], candidateIds: string[]) {
  if (!currentIds.length || !candidateIds.length) return 0;

  const candidateIdSet = new Set(candidateIds);
  const overlap = currentIds.filter((id) => candidateIdSet.has(id)).length;

  return clampScore((overlap / Math.max(currentIds.length, candidateIds.length)) * 100);
}

function locationScore(
  current: Pick<CurrentUserDiscoveryContext, "country" | "state" | "city">,
  candidate: { country: string | null; state: string | null; city: string | null }
) {
  let score = 0;

  if (current.country && candidate.country && current.country === candidate.country) score += 40;
  if (current.state && candidate.state && current.state === candidate.state) score += 30;
  if (current.city && candidate.city && current.city === candidate.city) score += 30;

  return clampScore(score);
}

function recencyActivityScore(createdAt: Date) {
  const ageMs = Date.now() - createdAt.getTime();
  const ageDays = ageMs / 86_400_000;

  if (ageDays <= 30) return 100;
  if (ageDays <= 90) return 75;
  if (ageDays <= 180) return 50;
  return 25;
}

function engagementActivityScore(...counts: Array<number | null | undefined>) {
  const total = counts.reduce(
  (sum: number, count) => sum + Number(count ?? 0),
  0,
);
  return clampScore(Math.log10(total + 1) * 35);
}

function visionScore(
  current: CurrentUserDiscoveryContext["founderVision"],
  candidate: DiscoveryUserCandidate["founderVision"]
) {
  if (!current || !candidate) return 0;

  const comparisons = [
    current.startupGoal && candidate.startupGoal && current.startupGoal === candidate.startupGoal,
    current.fundingPreference && candidate.fundingPreference && current.fundingPreference === candidate.fundingPreference,
    current.riskAppetite && candidate.riskAppetite && current.riskAppetite === candidate.riskAppetite,
    current.commitmentLevel && candidate.commitmentLevel && current.commitmentLevel === candidate.commitmentLevel,
    current.workStyle && candidate.workStyle && current.workStyle === candidate.workStyle,
    current.remotePreference && candidate.remotePreference && current.remotePreference === candidate.remotePreference
  ];
  const knownComparisons = comparisons.filter((value) => value !== null && value !== undefined);

  if (!knownComparisons.length) return 0;

  return clampScore((knownComparisons.filter(Boolean).length / knownComparisons.length) * 100);
}

function workStyleVisionScore(
  current: CurrentUserDiscoveryContext["founderVision"],
  workStyle: string | null
) {
  if (!current || !workStyle) return 0;

  const preferredStyles = [current.workStyle, current.remotePreference].filter(Boolean);

  if (!preferredStyles.length) return 0;
  return preferredStyles.some((preferredStyle) => preferredStyle === workStyle) ? 100 : 0;
}

function stageScore(current: CurrentUserDiscoveryContext["founderVision"], startupStage: string | null) {
  if (!current?.startupGoal || !startupStage) return 50;

  const earlyStageGoals = ["SIDE_PROJECT", "BOOTSTRAPPED_SAAS", "AI_STARTUP", "OPEN_SOURCE"];
  const ventureGoals = ["UNICORN", "VENTURE_BACKED_STARTUP"];
  const earlyStages = ["IDEA", "MVP", "PRE_SEED"];
  const ventureStages = ["PRE_SEED", "SEED", "SERIES_A_PLUS", "SCALING"];

  if (earlyStageGoals.includes(current.startupGoal) && earlyStages.includes(startupStage)) return 100;
  if (ventureGoals.includes(current.startupGoal) && ventureStages.includes(startupStage)) return 100;
  return 50;
}

function weightedOverall(scores: {
  skills: number;
  industry: number;
  vision: number;
  startupStage: number;
  location: number;
  activity: number;
  consistency: number;
  trust: number;
  builder: number;
}) {
  return clampScore(
    (scores.skills * rankingWeights.skills) / 100 +
    (scores.industry * rankingWeights.industry) / 100 +
    (scores.vision * rankingWeights.vision) / 100 +
    (scores.startupStage * rankingWeights.startupStage) / 100 +
    (scores.location * rankingWeights.location) / 100 +
    (scores.activity * rankingWeights.activity) / 100 +
    (scores.consistency * rankingWeights.consistency) / 100 +
    (scores.trust * rankingWeights.trust) / 100 +
    (scores.builder * rankingWeights.builder) / 100
  );
}

function sortByCompatibility<T>(items: Array<RankedItem<T>>) {
  return items.sort((a, b) => b.compatibility.overallScore - a.compatibility.overallScore);
}

function toPublicUser(candidate: DiscoveryUserCandidate) {
  const { createdAt: _createdAt, founderVision: _founderVision, ...publicUser } = candidate;
  return publicUser;
}

function toPublicStartup(candidate: DiscoveryStartupCandidate) {
  const { createdAt: _createdAt, ...publicStartup } = candidate;
  return publicStartup;
}

function toPublicOpportunity(candidate: DiscoveryOpportunityCandidate) {
  const { createdAt: _createdAt, ...publicOpportunity } = candidate;
  return publicOpportunity;
}

export class DiscoveryService {
  private readonly discovery: DiscoveryRepository;
  private readonly analytics: Pick<AnalyticsEventsService, "discoveryAppearances">;

  constructor(deps: DiscoveryServiceDeps = {}) {
    this.discovery = deps.discovery ?? discoveryRepository;
    this.analytics = deps.analytics ?? analyticsEvents;
  }

  async getRecommendedUsers(userId: string, filters: UserDiscoveryFilters) {
    const currentUser = await this.requireCurrentUser(userId);
    const blockedUserIds = await this.discovery.findBlockedUserIds(userId);
    const feed = await this.discovery.findUserDiscoveryCandidates(userId, filters, blockedUserIds);
    const rankedItems = sortByCompatibility(
      feed.items.map((item) => ({
        item,
        compatibility: this.calculateUserCompatibility(currentUser, item)
      }))
    );

    const items = rankedItems.map(({ item, compatibility }) => ({
      ...toPublicUser(item),
      compatibility
    }));

    await this.analytics.discoveryAppearances({
      actorUserId: userId,
      targetUserIds: items.map((item) => item.id)
    });

    return {
      items,
      nextCursor: feed.nextCursor
    };
  }

  async getRecommendedStartups(userId: string, filters: StartupDiscoveryFilters) {
    const currentUser = await this.requireCurrentUser(userId);
    const blockedUserIds = await this.discovery.findBlockedUserIds(userId);
    const feed = await this.discovery.findStartupDiscoveryCandidates(userId, filters, blockedUserIds);
    const rankedItems = sortByCompatibility(
      feed.items.map((item) => ({
        item,
        compatibility: this.calculateStartupCompatibility(currentUser, item)
      }))
    );

    const items = rankedItems.map(({ item, compatibility }) => ({
      ...toPublicStartup(item),
      compatibility
    }));

    await this.analytics.discoveryAppearances({
      actorUserId: userId,
      startupIds: items.map((item) => item.id)
    });

    return {
      items,
      nextCursor: feed.nextCursor
    };
  }

  async getRecommendedOpportunities(userId: string, filters: OpportunityDiscoveryFilters) {
    const currentUser = await this.requireCurrentUser(userId);
    const blockedUserIds = await this.discovery.findBlockedUserIds(userId);
    const feed = await this.discovery.findOpportunityDiscoveryCandidates(userId, filters, blockedUserIds);
    const rankedItems = sortByCompatibility(
      feed.items.map((item) => ({
        item,
        compatibility: this.calculateOpportunityCompatibility(currentUser, item)
      }))
    );

    const items = rankedItems.map(({ item, compatibility }) => ({
      ...toPublicOpportunity(item),
      compatibility
    }));

    await this.analytics.discoveryAppearances({
      actorUserId: userId,
      opportunityIds: items.map((item) => item.id)
    });

    return {
      items,
      nextCursor: feed.nextCursor
    };
  }

  async swipeUser(swiperId: string, input: SwipeInput) {
    if (swiperId === input.targetId) {
      throw new AppError("FORBIDDEN", "You cannot swipe your own profile.", 403);
    }

    const targetUser = await this.discovery.findUserForSwipe(input.targetId);

    if (!targetUser || targetUser.deletedAt || targetUser.status === "NOT_LOOKING") {
      throw new AppError("NOT_FOUND", "User is not available for discovery.", 404);
    }

    if (await this.discovery.areUsersBlocked(swiperId, input.targetId)) {
      throw new AppError("FORBIDDEN", "This user is not available for discovery.", 403);
    }

    if (await this.discovery.hasUserSwipe(swiperId, input.targetId)) {
      throw new AppError("CONFLICT", "You have already swiped this user.", 409);
    }

    if (input.startupId) {
      const startup = await this.discovery.findStartupForSwipe(input.startupId);

      if (!startup || startup.archivedAt) {
        throw new AppError("NOT_FOUND", "Startup is not available for matching.", 404);
      }

      if (startup.ownerId !== swiperId) {
        throw new AppError("FORBIDDEN", "You can only match users with startups you own.", 403);
      }
    }

    const swipe = await this.discovery.createUserSwipe(swiperId, input.targetId, input.action);

    if (input.action === "RIGHT") {
      await matchService.createUserMatchFromSwipe(swiperId, input.targetId);

      if (input.startupId) {
        await matchService.createStartupMatchFromOwnerUserSwipe(swiperId, input.targetId, input.startupId);
      }
    }

    return swipe;
  }

  async swipeStartup(swiperId: string, input: SwipeInput) {
    const startup = await this.discovery.findStartupForSwipe(input.targetId);

    if (!startup || startup.archivedAt) {
      throw new AppError("NOT_FOUND", "Startup is not available for discovery.", 404);
    }

    if (startup.ownerId === swiperId) {
      throw new AppError("FORBIDDEN", "You cannot swipe your own startup.", 403);
    }

    if (await this.discovery.areUsersBlocked(swiperId, startup.ownerId)) {
      throw new AppError("FORBIDDEN", "This startup is not available for discovery.", 403);
    }

    if (await this.discovery.hasStartupSwipe(swiperId, input.targetId)) {
      throw new AppError("CONFLICT", "You have already swiped this startup.", 409);
    }

    const swipe = await this.discovery.createStartupSwipe(swiperId, input.targetId, input.action);

    if (input.action === "RIGHT") {
      await matchService.createStartupMatchFromStartupSwipe(swiperId, input.targetId);
    }

    return swipe;
  }

  async swipeOpportunity(swiperId: string, input: SwipeInput) {
    const opportunity = await this.discovery.findOpportunityForSwipe(input.targetId);

    if (!opportunity || opportunity.closedAt || opportunity.status !== "OPEN" || opportunity.startup.archivedAt) {
      throw new AppError("NOT_FOUND", "Opportunity is not available for discovery.", 404);
    }

    if (opportunity.startup.ownerId === swiperId) {
      throw new AppError("FORBIDDEN", "You cannot swipe your own opportunity.", 403);
    }

    if (await this.discovery.areUsersBlocked(swiperId, opportunity.startup.ownerId)) {
      throw new AppError("FORBIDDEN", "This opportunity is not available for discovery.", 403);
    }

    if (await this.discovery.hasOpportunitySwipe(swiperId, input.targetId)) {
      throw new AppError("CONFLICT", "You have already swiped this opportunity.", 409);
    }

    const swipe = await this.discovery.createOpportunitySwipe(swiperId, input.targetId, input.action);

    if (input.action === "RIGHT") {
      await matchService.createOpportunityMatchFromOpportunitySwipe(swiperId, input.targetId);
    }

    return swipe;
  }

  async getUserCompatibility(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new AppError("FORBIDDEN", "Compatibility is not available for your own profile.", 403);
    }

    const currentUser = await this.requireCurrentUser(userId);

    if (await this.discovery.areUsersBlocked(userId, targetUserId)) {
      throw new AppError("FORBIDDEN", "This user is not available for compatibility scoring.", 403);
    }

    const targetUser = await this.discovery.findUserForCompatibility(targetUserId);

    if (!targetUser) {
      throw new AppError("NOT_FOUND", "User is not available for compatibility scoring.", 404);
    }

    return this.calculateUserCompatibility(currentUser, targetUser);
  }

  async getStartupCompatibility(userId: string, startupId: string) {
    const startupForSwipe = await this.discovery.findStartupForSwipe(startupId);

    if (!startupForSwipe || startupForSwipe.archivedAt) {
      throw new AppError("NOT_FOUND", "Startup is not available for compatibility scoring.", 404);
    }

    if (startupForSwipe.ownerId === userId) {
      throw new AppError("FORBIDDEN", "Compatibility is not available for your own startup.", 403);
    }

    if (await this.discovery.areUsersBlocked(userId, startupForSwipe.ownerId)) {
      throw new AppError("FORBIDDEN", "This startup is not available for compatibility scoring.", 403);
    }

    const currentUser = await this.requireCurrentUser(userId);
    const startup = await this.discovery.findStartupForCompatibility(startupId);

    if (!startup) {
      throw new AppError("NOT_FOUND", "Startup is not available for compatibility scoring.", 404);
    }

    return this.calculateStartupCompatibility(currentUser, startup);
  }

  calculateUserCompatibility(
    currentUser: CurrentUserDiscoveryContext,
    candidate: DiscoveryUserCandidate
  ): CompatibilityScore {
    const skillsScore = overlapScore(
      currentUser.skills.map((skill) => skill.skillId),
      candidate.skills.map((skill) => skill.skillId)
    );
    const industryScore = overlapScore(
      currentUser.industries.map((industry) => industry.industryId),
      candidate.industries.map((industry) => industry.industryId)
    );
    const candidateVisionScore = visionScore(currentUser.founderVision, candidate.founderVision);
    const candidateLocationScore = locationScore(currentUser, candidate);
    const consistencyScore = normalizeReputation(candidate.reputation?.collaborationScore);
    const trustScore = normalizeReputation(candidate.reputation?.trustScore);
    const builderScore = normalizeReputation(candidate.reputation?.builderScore);

    return {
      overallScore: weightedOverall({
        skills: skillsScore,
        industry: industryScore,
        vision: candidateVisionScore,
        startupStage: candidateVisionScore,
        location: candidateLocationScore,
        activity: recencyActivityScore(candidate.createdAt),
        consistency: consistencyScore,
        trust: trustScore,
        builder: builderScore
      }),
      skillsScore,
      visionScore: candidateVisionScore,
      locationScore: candidateLocationScore,
      consistencyScore,
      trustScore
    };
  }

  calculateStartupCompatibility(
    currentUser: CurrentUserDiscoveryContext,
    candidate: DiscoveryStartupCandidate
  ): CompatibilityScore {
    const industryScore = candidate.industry?.id
      ? overlapScore(
        currentUser.industries.map((industry) => industry.industryId),
        [candidate.industry.id]
      )
      : 0;
    const candidateVisionScore = workStyleVisionScore(currentUser.founderVision, candidate.workStyle);
    const candidateStageScore = stageScore(currentUser.founderVision, candidate.startupStage);
    const candidateLocationScore = locationScore(currentUser, candidate);

    return {
      overallScore: weightedOverall({
        skills: industryScore,
        industry: industryScore,
        vision: candidateVisionScore,
        startupStage: candidateStageScore,
        location: candidateLocationScore,
        activity: engagementActivityScore(
          candidate.profileViewsCount,
          candidate.followersCount,
          candidate.savesCount,
          candidate.applicationsCount
        ),
        consistency: 0,
        trust: 0,
        builder: 0
      }),
      skillsScore: industryScore,
      visionScore: candidateVisionScore,
      locationScore: candidateLocationScore,
      consistencyScore: 0,
      trustScore: 0
    };
  }

  calculateOpportunityCompatibility(
    currentUser: CurrentUserDiscoveryContext,
    candidate: DiscoveryOpportunityCandidate
  ): CompatibilityScore {
    const skillsScore = overlapScore(
      currentUser.skills.map((skill) => skill.skillId),
      candidate.skills.map((skill) => skill.skillId)
    );
    const industryScore = candidate.startup.industry?.id
      ? overlapScore(
        currentUser.industries.map((industry) => industry.industryId),
        [candidate.startup.industry.id]
      )
      : 0;
    const candidateVisionScore = workStyleVisionScore(currentUser.founderVision, candidate.workStyle);
    const candidateStageScore = stageScore(currentUser.founderVision, candidate.startup.startupStage);
    const candidateLocationScore = locationScore(currentUser, candidate);

    return {
      overallScore: weightedOverall({
        skills: skillsScore,
        industry: industryScore,
        vision: candidateVisionScore,
        startupStage: candidateStageScore,
        location: candidateLocationScore,
        activity: engagementActivityScore(candidate.viewsCount, candidate.savesCount, candidate.applicationsCount),
        consistency: 0,
        trust: 0,
        builder: 0
      }),
      skillsScore,
      visionScore: candidateVisionScore,
      locationScore: candidateLocationScore,
      consistencyScore: 0,
      trustScore: 0
    };
  }

  private async requireCurrentUser(userId: string) {
    const user = await this.discovery.findCurrentUserContext(userId);

    if (!user) {
      throw new AppError("UNAUTHORIZED", "Authenticated user was not found.", 401);
    }

    return user;
  }
}

export const discoveryService = new DiscoveryService();
