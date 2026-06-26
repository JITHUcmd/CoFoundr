export type FounderVision = {
  id: string;
  userId: string;
  startupGoal: string | null;
  fundingPreference: string | null;
  riskAppetite: string | null;
  commitmentLevel: string | null;
  workStyle: string | null;
  preferredTeamSize: number | null;
  preferredCoFounderType: string | null;
  remotePreference: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error?: {
    code?: string;
    message?: string;
  };
};

export type FounderVisionResponse = ApiSuccess<{ founderVision: FounderVision }> | ApiFailure;
