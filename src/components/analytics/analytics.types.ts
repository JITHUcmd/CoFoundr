export type AnalyticsRange = "7d" | "30d" | "90d" | "lifetime";

export type ChartSeries = {
  labels: string[];
  values: number[];
};

export type UserAnalytics = {
  range: AnalyticsRange;
  profileViews: number;
  discoveryAppearances: number;
  rightSwipesReceived: number;
  superLikesReceived: number;
  matches: number;
  messagesSent: number;
  messagesReceived: number;
  responseRate: number;
  profileCompletion: number;
  consistencyScore: number;
  trustScore: number;
  builderScore: number;
  charts: {
    profileViews: ChartSeries;
    matches: ChartSeries;
    messagesSent: ChartSeries;
  };
};

export type StartupAnalytics = {
  range: AnalyticsRange;
  startupId: string;
  startupViews: number;
  followers: number;
  saves: number;
  applications: number;
  matches: number;
  hiringFunnel: {
    viewed: number;
    saved: number;
    applied: number;
    matched: number;
    joined: number;
  };
  hiringFunnelPercentages: {
    viewedToSaved: number;
    savedToApplied: number;
    appliedToMatched: number;
    matchedToJoined: number;
    viewedToJoined: number;
  };
  verificationStatus: string;
  teamSize: number;
  activeOpportunities: number;
  charts: {
    views: ChartSeries;
    applications: ChartSeries;
    matches: ChartSeries;
  };
};

export type OpportunityAnalytics = {
  range: AnalyticsRange;
  opportunityId: string;
  views: number;
  saves: number;
  applications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  matches: number;
  conversionRate: number;
  charts: {
    views: ChartSeries;
    applications: ChartSeries;
    matches: ChartSeries;
  };
};

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

export type UserAnalyticsResponse = ApiSuccess<{ analytics: UserAnalytics }> | ApiFailure;
export type StartupAnalyticsResponse = ApiSuccess<{ analytics: StartupAnalytics }> | ApiFailure;
export type OpportunityAnalyticsResponse = ApiSuccess<{ analytics: OpportunityAnalytics }> | ApiFailure;
