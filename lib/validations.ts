import { z } from "zod";

const slugRegex = /^[a-z0-9][a-z0-9-]{0,98}[a-z0-9]$/;

export const slugSchema = z.string().regex(slugRegex, "Invalid slug format");

export const uuidSchema = z.string().uuid("Invalid ID format");

export const emailSchema = z
  .string()
  .email()
  .max(254)
  .transform((v) => v.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(1)
    .max(100)
    .transform((v) => v.replace(/<[^>]*>/g, "").trim()),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const hydrationEntrySchema = z.object({
  amount: z.number().int().min(1).max(5000),
  brand_slug: slugSchema.nullable().optional().default(null),
  activity: z.string().max(50).nullable().optional().default(null),
  note: z
    .string()
    .max(200)
    .optional()
    .default("")
    .transform((v) => v.replace(/<[^>]*>/g, "")),
});

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .transform((v) => v.replace(/<[^>]*>/g, "").trim())
    .optional(),
  weight: z.number().min(20).max(500).optional(),
  unit: z.enum(["kg", "lbs"]).optional(),
  activity_level: z
    .enum(["sedentary", "light", "moderate", "active", "very-active"])
    .optional(),
  climate: z.enum(["cold", "temperate", "hot", "humid"]).optional(),
  daily_goal: z.number().int().min(500).max(10000).optional(),
  wake_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  reminder_interval: z.number().int().min(15).max(480).optional(),
});
