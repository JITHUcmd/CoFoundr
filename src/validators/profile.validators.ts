import { z } from "zod";

const uuidSchema = z.string().uuid();
const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const optionalDate = z.coerce.date().nullable().optional();

export const userStatusSchema = z.enum([
  "ACTIVELY_LOOKING",
  "OPEN_TO_OPPORTUNITIES",
  "NOT_LOOKING"
]);

export const availabilitySchema = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "ADVISORY",
  "INVESTOR_ONLY"
]);

export const skillProficiencySchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT"
]);

export const portfolioLinkTypeSchema = z.enum([
  "GITHUB",
  "LINKEDIN",
  "WEBSITE",
  "RESUME",
  "PITCH_DECK",
  "OTHER"
]);

export const profileParamsSchema = z.object({
  userId: uuidSchema
}).strict();

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores.")
    .transform((value) => value.toLowerCase())
    .optional(),
  profilePhotoUrl: z.string().trim().url().nullable().optional(),
  headline: nullableText(160),
  bio: nullableText(1000),
  country: nullableText(80),
  state: nullableText(80),
  city: nullableText(80),
  status: userStatusSchema.optional(),
  availability: availabilitySchema.nullable().optional()
}).strict();

export const profileCreateSchema = profileUpdateSchema;

export const profileSkillSchema = z.object({
  skillId: uuidSchema,
  proficiency: skillProficiencySchema.nullable().optional(),
  yearsExperience: z.number().int().min(0).max(80).nullable().optional(),
  isPrimary: z.boolean().optional()
}).strict();

export const replaceSkillsSchema = z.object({
  skills: z.array(profileSkillSchema).max(50)
}).strict();

export const replaceIdsSchema = z.object({
  ids: z.array(uuidSchema).max(50)
}).strict();

const experienceBaseSchema = z.object({
  industryId: uuidSchema.nullable().optional(),
  companyName: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(160),
  startDate: optionalDate,
  endDate: optionalDate,
  isCurrent: z.boolean().optional(),
  description: nullableText(1000)
}).strict();

export const experienceSchema = experienceBaseSchema.refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
  message: "endDate must be after startDate.",
  path: ["endDate"]
});

export const experienceUpdateSchema = experienceBaseSchema.partial().refine(
  (value) => !value.startDate || !value.endDate || value.endDate >= value.startDate,
  {
    message: "endDate must be after startDate.",
    path: ["endDate"]
  }
);

const educationBaseSchema = z.object({
  institution: z.string().trim().min(1).max(180),
  degree: nullableText(160),
  field: nullableText(160),
  startDate: optionalDate,
  endDate: optionalDate,
  description: nullableText(1000)
}).strict();

export const educationSchema = educationBaseSchema.refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
  message: "endDate must be after startDate.",
  path: ["endDate"]
});

export const educationUpdateSchema = educationBaseSchema.partial().refine(
  (value) => !value.startDate || !value.endDate || value.endDate >= value.startDate,
  {
    message: "endDate must be after startDate.",
    path: ["endDate"]
  }
);

export const portfolioLinkSchema = z.object({
  type: portfolioLinkTypeSchema,
  label: nullableText(120),
  url: z.string().trim().url().max(500),
  isPrimary: z.boolean().optional()
}).strict();

export const portfolioLinkUpdateSchema = portfolioLinkSchema.partial();

export const resourceIdParamsSchema = z.object({
  experienceId: uuidSchema.optional(),
  educationId: uuidSchema.optional(),
  linkId: uuidSchema.optional()
}).strict();

export const experienceParamsSchema = z.object({
  experienceId: uuidSchema
}).strict();

export const educationParamsSchema = z.object({
  educationId: uuidSchema
}).strict();

export const portfolioLinkParamsSchema = z.object({
  linkId: uuidSchema
}).strict();
