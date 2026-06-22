import { z } from "zod";

export const userTypeSchema = z.enum([
  "FOUNDER",
  "INVESTOR",
  "ADVISOR",
  "RECRUITER",
  "STUDENT",
  "FREELANCER",
  "STARTUP_TALENT"
]);

export const signupSchema = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[0-9]/, "Password must contain a number."),
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores.")
    .transform((value) => value.toLowerCase()),
  name: z.string().trim().min(1).max(120),
  roles: z.array(userTypeSchema).min(1).max(3).optional()
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128)
}).strict();

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase())
}).strict();

export const passwordResetSchema = z.object({
  token: z.string().min(32).max(256),
  password: signupSchema.shape.password
}).strict();

export type SignupRequest = z.infer<typeof signupSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
