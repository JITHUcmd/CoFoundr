import { AppError } from "@/lib/errors/app-error";
import {
  analyticsRepository,
  type AnalyticsProfileRecord,
  type AnalyticsRepository
} from "@/repositories/analytics.repository";
import type {
  AdminPlatformAnalytics,
  AnalyticsDateWindow,
  AnalyticsRange,
  OpportunityAnalytics,
  StartupAnalytics,
  UserAnalytics
} from "@/types/analytics.types";

type AnalyticsServiceDeps = {
  analytics?: AnalyticsRepository;
};

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function percentage(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

function resolveWindow(range: AnalyticsRange): AnalyticsDateWindow {
  if (range === "lifetime") {
    return {
      range,
      startDate: null,
      bucket: "month"
    };
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - days);

  return {
    range,
    startDate,
    bucket: days > 30 ? "week" : "day"
  };
}

export class AnalyticsService {
  private readonly analytics: AnalyticsRepository;

  constructor(deps: AnalyticsServiceDeps = {}) {
    this.analytics = deps.analytics ?? analyticsRepository;
  }

  async getUserAnalytics(userId: string, range: AnalyticsRange): Promise<UserAnalytics> {
    const window = resolveWindow(range);
    const profile = await this.analytics.findUserProfile(userId);

    if (!profile) {
      throw new AppError("NOT_FOUND", "User profile not found.", 404);
    }

    const [metrics, charts] = await Promise.all([
      this.analytics.getUserMetrics(userId, window),
      this.analytics.getUserCharts(userId, window)
    ]);

    return {
      range,
      ...metrics,
      responseRate: percentage(metrics.messagesSent, metrics.messagesReceived),
      profileCompletion: this.calculateProfileCompletion(profile),
      consistencyScore: profile.reputation?.collaborationScore ?? 0,
      trustScore: profile.reputation?.trustScore ?? 0,
      builderScore: profile.reputation?.builderScore ?? 0,
      charts
    };
  }

  async getStartupAnalytics(ownerId: string, startupId: string, range: AnalyticsRange): Promise<StartupAnalytics> {
    const window = resolveWindow(range);
    const startup = await this.analytics.findStartupForAnalytics(startupId);

    if (!startup) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    if (startup.ownerId !== ownerId) {
      throw new AppError("FORBIDDEN", "Only the startup owner can view startup analytics.", 403);
    }

    const [metrics, charts] = await Promise.all([
      this.analytics.getStartupMetrics(startupId, window),
      this.analytics.getStartupCharts(startupId, window)
    ]);

    const startupViews = range === "lifetime" ? startup.profileViewsCount : metrics.views;
    const saves = range === "lifetime" ? startup.savesCount : metrics.saves;
    const applications = range === "lifetime" ? startup.applicationsCount : metrics.applications;

    return {
      range,
      startupId,
      startupViews,
      followers: startup.followersCount,
      saves,
      applications,
      matches: metrics.matches,
      hiringFunnel: {
        viewed: startupViews,
        saved: saves,
        applied: applications,
        matched: metrics.matches,
        joined: metrics.joined
      },
      hiringFunnelPercentages: {
        viewedToSaved: percentage(saves, startupViews),
        savedToApplied: percentage(applications, saves),
        appliedToMatched: percentage(metrics.matches, applications),
        matchedToJoined: percentage(metrics.joined, metrics.matches),
        viewedToJoined: percentage(metrics.joined, startupViews)
      },
      verificationStatus: startup.verificationStatus,
      teamSize: startup.teamSize ?? startup.members.length,
      activeOpportunities: startup.opportunities.length,
      charts
    };
  }

  async getOpportunityAnalytics(
    ownerId: string,
    opportunityId: string,
    range: AnalyticsRange
  ): Promise<OpportunityAnalytics> {
    const window = resolveWindow(range);
    const opportunity = await this.analytics.findOpportunityForAnalytics(opportunityId);

    if (!opportunity) {
      throw new AppError("NOT_FOUND", "Opportunity not found.", 404);
    }

    if (opportunity.startup.ownerId !== ownerId) {
      throw new AppError("FORBIDDEN", "Only the startup owner can view opportunity analytics.", 403);
    }

    const [metrics, charts] = await Promise.all([
      this.analytics.getOpportunityMetrics(opportunityId, window),
      this.analytics.getOpportunityCharts(opportunityId, window)
    ]);

    const views = range === "lifetime" ? opportunity.viewsCount : metrics.views;
    const saves = range === "lifetime" ? opportunity.savesCount : metrics.saves;
    const applications = range === "lifetime" ? opportunity.applicationsCount : metrics.applications;

    return {
      range,
      opportunityId,
      views,
      saves,
      applications,
      acceptedApplications: metrics.acceptedApplications,
      rejectedApplications: metrics.rejectedApplications,
      matches: metrics.matches,
      conversionRate: percentage(metrics.matches, applications),
      charts
    };
  }

  async getAdminPlatformAnalytics(range: AnalyticsRange): Promise<AdminPlatformAnalytics> {
    const window = resolveWindow(range);
    const [totals, growth] = await Promise.all([
      this.analytics.getPlatformTotals(window),
      this.analytics.getPlatformGrowth(window)
    ]);

    return {
      range,
      totals,
      growth
    };
  }

  private calculateProfileCompletion(profile: AnalyticsProfileRecord) {
    const checks = [
      hasValue(profile.name),
      hasValue(profile.username),
      hasValue(profile.profilePhotoUrl),
      hasValue(profile.headline),
      hasValue(profile.bio),
      hasValue(profile.country) && hasValue(profile.city),
      hasValue(profile.status),
      hasValue(profile.availability),
      profile.skills.length > 0,
      profile.experiences.length > 0,
      profile.education.length > 0,
      profile.industries.length > 0,
      profile.interests.length > 0,
      profile.communityMemberships.length > 0,
      profile.portfolioLinks.length > 0
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }
}

export const analyticsService = new AnalyticsService();
