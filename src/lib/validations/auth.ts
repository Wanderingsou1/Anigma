import { z } from "zod";

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
  malSyncEnabled: z.boolean().optional(),
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

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type WatchlistInput = z.infer<typeof watchlistSchema>;
export type WatchHistoryInput = z.infer<typeof watchHistorySchema>;
export type FavoriteInput = z.infer<typeof favoriteSchema>;
