import { z } from "zod";

const uuidSchema = z.string().uuid();

const availabilitySchema = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "ADVISORY",
  "INVESTOR_ONLY"
]);

const discoverableUserStatusSchema = z.enum([
  "ACTIVELY_LOOKING",
  "OPEN_TO_OPPORTUNITIES"
]);

const workStyleSchema = z.enum(["REMOTE", "HYBRID", "IN_PERSON"]);

const fundingStageSchema = z.enum([
  "BOOTSTRAPPED",
  "FUNDRAISING_NOW",
  "PRE_SEED",
  "SEED",
  "SERIES_A_PLUS",
  "SERIES_A",
  "SERIES_B",
  "FUNDRAISING"
]);

const hiringStatusSchema = z.enum(["NOT_HIRING", "HIRING", "PAUSED"]);

const opportunityTypeSchema = z.enum([
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

const swipeActionSchema = z.enum(["LEFT", "RIGHT", "SUPERLIKE", "SUPER_LIKE"]).transform((action) => {
  return action === "SUPERLIKE" ? "SUPER_LIKE" : action;
});

const optionalTextSchema = z.string().trim().min(1).max(120).optional();

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

const uuidListSchema = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return value;
}, z.array(uuidSchema).max(50).optional());

const paginationShape = {
  cursor: uuidSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20)
};

export const userDiscoveryQuerySchema = z.object({
  ...paginationShape,
  skillIds: uuidListSchema,
  industryIds: uuidListSchema,
  minExperienceYears: z.coerce.number().int().min(0).max(80).optional(),
  country: optionalTextSchema,
  state: optionalTextSchema,
  city: optionalTextSchema,
  availability: availabilitySchema.optional(),
  status: discoverableUserStatusSchema.optional(),
  workStyle: workStyleSchema.optional()
}).strict();

export const startupDiscoveryQuerySchema = z.object({
  ...paginationShape,
  industryIds: uuidListSchema,
  fundingStage: fundingStageSchema.optional(),
  country: optionalTextSchema,
  state: optionalTextSchema,
  city: optionalTextSchema,
  minTeamSize: z.coerce.number().int().min(1).max(100_000).optional(),
  maxTeamSize: z.coerce.number().int().min(1).max(100_000).optional(),
  hiringStatus: hiringStatusSchema.optional(),
  fundraisingOnly: booleanQuerySchema
}).strict().refine(
  (value) => value.minTeamSize === undefined ||
    value.maxTeamSize === undefined ||
    value.maxTeamSize >= value.minTeamSize,
  {
    message: "maxTeamSize must be greater than or equal to minTeamSize.",
    path: ["maxTeamSize"]
  }
);

export const opportunityDiscoveryQuerySchema = z.object({
  ...paginationShape,
  opportunityType: opportunityTypeSchema.optional(),
  skillIds: uuidListSchema,
  equityAvailable: booleanQuerySchema,
  salaryAvailable: booleanQuerySchema,
  remoteAllowed: booleanQuerySchema,
  country: optionalTextSchema,
  state: optionalTextSchema,
  city: optionalTextSchema
}).strict();

export const swipeCreateSchema = z.object({
  targetId: uuidSchema,
  action: swipeActionSchema,
  startupId: uuidSchema.optional()
}).strict();

export const compatibilityIdParamsSchema = z.object({
  id: uuidSchema
}).strict();
