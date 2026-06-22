import { z } from "zod";

export const startupGoalSchema = z.enum([
  "UNICORN",
  "VENTURE_BACKED_STARTUP",
  "BOOTSTRAPPED_SAAS",
  "LIFESTYLE_BUSINESS",
  "AGENCY",
  "OPEN_SOURCE",
  "SOCIAL_IMPACT",
  "AI_STARTUP",
  "E_COMMERCE",
  "SIDE_PROJECT"
]);

export const fundingPreferenceSchema = z.enum([
  "BOOTSTRAPPED",
  "ANGEL_FUNDING",
  "VENTURE_CAPITAL",
  "CROWDFUNDING"
]);

export const riskAppetiteSchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH"
]);

export const commitmentLevelSchema = z.enum([
  "EXPLORING",
  "PART_TIME",
  "FULL_TIME"
]);

export const workStyleSchema = z.enum([
  "REMOTE",
  "HYBRID",
  "IN_PERSON"
]);

export const founderVisionSchema = z.object({
  startupGoal: startupGoalSchema.nullable().optional(),
  fundingPreference: fundingPreferenceSchema.nullable().optional(),
  riskAppetite: riskAppetiteSchema.nullable().optional(),
  commitmentLevel: commitmentLevelSchema.nullable().optional(),
  workStyle: workStyleSchema.nullable().optional(),
  preferredTeamSize: z.number().int().min(1).max(20).nullable().optional(),
  preferredCoFounderType: z.string().trim().min(1).max(120).nullable().optional(),
  remotePreference: workStyleSchema.nullable().optional()
}).strict();

export const founderVisionCreateSchema = founderVisionSchema;
export const founderVisionUpdateSchema = founderVisionSchema;
