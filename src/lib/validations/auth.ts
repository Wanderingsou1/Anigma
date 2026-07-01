import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email cannot exceed 100 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  favoriteGenres: z.array(z.string()).optional().default([]),
  plan: z.enum(["free", "premium", "family"]).optional().default("free"),
});

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional().or(z.literal("")),
  favoriteGenres: z.array(z.string()).optional(),
  plan: z.enum(["free", "premium", "family"]).optional(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const watchlistSchema = z.object({
  animeId: z.number().positive("Invalid anime ID"),
  title: z.string().min(1, "Title is required"),
  imageUrl: z.string().optional().default(""),
  rating: z.number().min(0).max(10).optional().default(0),
  status: z.string().optional().default("plan_to_watch"),
  type: z.string().optional().default("TV"),
});

export const watchHistorySchema = z.object({
  animeId: z.number().positive("Invalid anime ID"),
  title: z.string().min(1, "Title is required"),
  imageUrl: z.string().optional().default(""),
  episodeNumber: z.number().positive("Invalid episode number"),
  progress: z.number().min(0).max(100).optional().default(0),
  duration: z.string().optional().default(""),
});

export const favoriteSchema = z.object({
  animeId: z.number().positive("Invalid anime ID"),
  title: z.string().min(1, "Title is required"),
  imageUrl: z.string().optional().default(""),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type WatchlistInput = z.infer<typeof watchlistSchema>;
export type WatchHistoryInput = z.infer<typeof watchHistorySchema>;
export type FavoriteInput = z.infer<typeof favoriteSchema>;
