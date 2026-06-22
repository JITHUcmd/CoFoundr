import { z } from "zod";

const uuidSchema = z.string().uuid();

const notificationTypeSchema = z.enum([
  "MATCH_CREATED",
  "NEW_MESSAGE",
  "APPLICATION_RECEIVED",
  "APPLICATION_ACCEPTED",
  "APPLICATION_REJECTED",
  "SUPERLIKE_RECEIVED",
  "STARTUP_VERIFICATION_REQUESTED",
  "STARTUP_VERIFICATION_APPROVED",
  "STARTUP_VERIFICATION_REJECTED",
  "PROFILE_VIEW_MILESTONE",
  "SYSTEM"
]);

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}, z.boolean().optional());

export const notificationIdParamsSchema = z.object({
  id: uuidSchema
}).strict();

export const notificationListQuerySchema = z.object({
  before: uuidSchema.optional(),
  after: uuidSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  type: notificationTypeSchema.optional(),
  unreadOnly: booleanQuerySchema
}).strict().refine(
  (value) => !(value.before && value.after),
  {
    message: "Use either before or after, not both.",
    path: ["before"]
  }
);
