import { z } from "zod";

const uuidSchema = z.string().uuid();

export const conversationIdParamsSchema = z.object({
  id: uuidSchema
}).strict();

export const conversationMatchParamsSchema = z.object({
  matchId: uuidSchema
}).strict();

export const messageIdParamsSchema = z.object({
  id: uuidSchema
}).strict();

export const messagingPaginationSchema = z.object({
  before: uuidSchema.optional(),
  after: uuidSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
}).strict().refine(
  (value) => !(value.before && value.after),
  {
    message: "Use either before or after, not both.",
    path: ["before"]
  }
);

export const messageTypeSchema = z.enum(["TEXT", "IMAGE", "FILE"]);

export const messageCreateSchema = z.object({
  type: messageTypeSchema.default("TEXT"),
  content: z.string().trim().min(1).max(4_000)
}).strict();

export const messageUpdateSchema = z.object({
  content: z.string().trim().min(1).max(4_000)
}).strict();
