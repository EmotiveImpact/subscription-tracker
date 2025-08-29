import { z } from "zod"

// Base validation schemas
export const emailSchema = z
  .string()
  .email("Please enter a valid email address")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")

// Subscription validation schemas
export const subscriptionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Subscription name is required"),
  description: z.string().optional(),
  cost: z.number().positive("Cost must be a positive number"),
  billingCycle: z.enum(["monthly", "yearly", "weekly", "daily"]),
  nextBillingDate: z.date(),
  category: z.string().min(1, "Category is required"),
  isActive: z.boolean().default(true),
  reminderDays: z.number().min(0).max(365).default(7),
  tags: z.array(z.string()).default([]),
})

export type Subscription = z.infer<typeof subscriptionSchema>

// User validation schemas
export const userProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: emailSchema,
  avatar: z.string().url().optional(),
  currency: z.string().default("USD"),
  timezone: z.string().default("UTC"),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    reminderDays: z.number().min(0).max(30).default(7),
  }).default({}),
})

export type UserProfile = z.infer<typeof userProfileSchema>

// Form validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Settings validation schemas
export const settingsSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    reminderDays: z.number().min(0).max(30),
  }),
  currency: z.string(),
  timezone: z.string(),
  theme: z.enum(["light", "dark", "system"]),
})

export type Settings = z.infer<typeof settingsSchema>

