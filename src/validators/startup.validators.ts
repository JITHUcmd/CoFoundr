import { z } from "zod";

const uuidSchema = z.string().uuid();
const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const nullableUrl = z.string().trim().url().max(500).nullable().optional();

export const startupStageSchema = z.enum([
  "IDEA",
  "MVP",
  "PRE_SEED",
  "SEED",
  "SERIES_A_PLUS",
  "BETA",
  "REVENUE",
  "SCALING"
]);

export const fundingStageSchema = z.enum([
  "BOOTSTRAPPED",
  "FUNDRAISING_NOW",
  "PRE_SEED",
  "SEED",
  "SERIES_A_PLUS",
  "SERIES_A",
  "SERIES_B",
  "FUNDRAISING"
]);

export const hiringStatusSchema = z.enum([
  "NOT_HIRING",
  "HIRING",
  "PAUSED"
]);

export const workStyleSchema = z.enum([
  "REMOTE",
  "HYBRID",
  "IN_PERSON"
]);

export const startupMemberRoleSchema = z.enum([
  "CEO",
  "CTO",
  "COO",
  "TECHNICAL_CO_FOUNDER",
  "PRODUCT_LEAD",
  "ADVISOR",
  "INVESTOR"
]);

export const startupSlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and single hyphens.");

const startupBaseSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  slug: startupSlugSchema.optional(),
  logoUrl: nullableUrl,
  coverImageUrl: nullableUrl,
  tagline: nullableText(180),
  description: nullableText(4000),
  website: nullableUrl,
  industryId: uuidSchema.nullable().optional(),
  startupStage: startupStageSchema.optional(),
  foundedDate: z.coerce.date().nullable().optional(),
  teamSize: z.number().int().min(1).max(10000).nullable().optional(),
  country: nullableText(80),
  state: nullableText(80),
  city: nullableText(80),
  remoteAllowed: z.boolean().optional(),
  workStyle: workStyleSchema.nullable().optional(),
  fundingStage: fundingStageSchema.optional(),
  fundingTargetAmount: z.number().min(0).max(1_000_000_000).nullable().optional(),
  hiringStatus: hiringStatusSchema.optional(),
  openRolesCount: z.number().int().min(0).max(1000).optional(),
  equityAvailable: z.boolean().optional(),
  salaryAvailable: z.boolean().optional()
}).strict();

export const startupCreateSchema = startupBaseSchema.extend({
  name: z.string().trim().min(1).max(160),
  slug: startupSlugSchema
});

export const startupUpdateSchema = startupBaseSchema;

export const startupIdParamsSchema = z.object({
  startupId: uuidSchema
}).strict();

export const startupSlugParamsSchema = z.object({
  slug: startupSlugSchema
}).strict();

export const startupMemberSchema = z.object({
  userId: uuidSchema,
  role: startupMemberRoleSchema,
  isFounder: z.boolean().optional()
}).strict();

export const startupMemberUpdateSchema = z.object({
  role: startupMemberRoleSchema,
  isFounder: z.boolean().optional()
}).strict();

export const startupMemberParamsSchema = startupIdParamsSchema.extend({
  memberId: uuidSchema
});

export const transferOwnershipSchema = z.object({
  newOwnerId: uuidSchema
}).strict();

export const startupVerificationRequestSchema = z.object({
  evidenceUrl: z.string().trim().url().max(500).nullable().optional()
}).strict();
