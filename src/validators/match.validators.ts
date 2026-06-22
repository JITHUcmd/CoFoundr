import { z } from "zod";

const uuidSchema = z.string().uuid();

export const matchTypeSchema = z.enum(["USER", "STARTUP", "OPPORTUNITY"]);

export const matchStatusSchema = z.enum([
  "ACTIVE",
  "ARCHIVED",
  "BLOCKED",
  "UNMATCHED",
  "EXPIRED"
]);

export const matchIdParamsSchema = z.object({
  id: uuidSchema
}).strict();

export const startupInterestParamsSchema = z.object({
  startupId: uuidSchema
}).strict();

export const startupInterestUserParamsSchema = startupInterestParamsSchema.extend({
  userId: uuidSchema
}).strict();

export const opportunityInterestParamsSchema = z.object({
  opportunityId: uuidSchema
}).strict();

export const opportunityInterestUserParamsSchema = opportunityInterestParamsSchema.extend({
  userId: uuidSchema
}).strict();

export const matchListQuerySchema = z.object({
  type: matchTypeSchema.optional(),
  status: matchStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
}).strict();
