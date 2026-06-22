import { z } from "zod";

const uuidSchema = z.string().uuid();

export const analyticsRangeSchema = z.enum(["7d", "30d", "90d", "lifetime"]);

export const analyticsQuerySchema = z.object({
  range: analyticsRangeSchema.default("30d")
}).strict();

export const startupAnalyticsParamsSchema = z.object({
  startupId: uuidSchema
}).strict();

export const opportunityAnalyticsParamsSchema = z.object({
  opportunityId: uuidSchema
}).strict();
