import { z } from "zod";

const uuidSchema = z.string().uuid();
const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();

export const opportunityTypeSchema = z.enum([
  "TECHNICAL_CO_FOUNDER",
  "BUSINESS_CO_FOUNDER",
  "ADVISOR",
  "INVESTOR",
  "DEVELOPER",
  "DESIGNER",
  "PRODUCT_MANAGER",
  "MARKETING",
  "OTHER"
]);

export const experienceLevelSchema = z.enum([
  "ENTRY",
  "MID",
  "SENIOR",
  "LEAD",
  "ANY"
]);

export const compensationTypeSchema = z.enum([
  "EQUITY",
  "SALARY",
  "BOTH"
]);

export const opportunityStatusSchema = z.enum([
  "OPEN",
  "PAUSED",
  "CLOSED"
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

const opportunityShape = {
  roleName: z.string().trim().min(1).max(160).optional(),
  opportunityType: opportunityTypeSchema.optional(),
  description: nullableText(4000),
  openings: z.number().int().min(1).max(1000).optional(),
  experienceLevel: experienceLevelSchema.optional(),
  compensationType: compensationTypeSchema.optional(),
  equityMinPercent: z.number().min(0).max(100).nullable().optional(),
  equityMaxPercent: z.number().min(0).max(100).nullable().optional(),
  salaryMin: z.number().int().min(0).max(100_000_000).nullable().optional(),
  salaryMax: z.number().int().min(0).max(100_000_000).nullable().optional(),
  salaryCurrency: z.string().trim().length(3).toUpperCase().nullable().optional(),
  commitment: commitmentLevelSchema.nullable().optional(),
  remoteAllowed: z.boolean().optional(),
  workStyle: workStyleSchema.nullable().optional(),
  country: nullableText(80),
  state: nullableText(80),
  city: nullableText(80),
  status: opportunityStatusSchema.optional(),
  skillIds: z.array(uuidSchema).max(50).optional()
};

function withRangeValidation<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
  return schema.refine(
    (value) => value.equityMinPercent === undefined ||
      value.equityMaxPercent === undefined ||
      value.equityMinPercent === null ||
      value.equityMaxPercent === null ||
      value.equityMaxPercent >= value.equityMinPercent,
    {
      message: "equityMaxPercent must be greater than or equal to equityMinPercent.",
      path: ["equityMaxPercent"]
    }
  ).refine(
    (value) => value.salaryMin === undefined ||
      value.salaryMax === undefined ||
      value.salaryMin === null ||
      value.salaryMax === null ||
      value.salaryMax >= value.salaryMin,
    {
      message: "salaryMax must be greater than or equal to salaryMin.",
      path: ["salaryMax"]
    }
  );
}

export const opportunityUpdateSchema = withRangeValidation(z.object(opportunityShape).strict());

export const opportunityCreateSchema = withRangeValidation(z.object({
  ...opportunityShape,
  startupId: uuidSchema,
  roleName: z.string().trim().min(1).max(160),
  compensationType: compensationTypeSchema
}).strict());

export const opportunityIdParamsSchema = z.object({
  opportunityId: uuidSchema
}).strict();

export const startupOpportunitiesParamsSchema = z.object({
  startupId: uuidSchema
}).strict();

export const applicationIdParamsSchema = opportunityIdParamsSchema.extend({
  applicationId: uuidSchema
});

export const opportunityApplicationSchema = z.object({
  note: nullableText(1000)
}).strict();

export const opportunityReviewSchema = z.object({
  reviewNote: nullableText(1000)
}).strict();
