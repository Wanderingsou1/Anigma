import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWatchHistory extends Document {
  userId: mongoose.Types.ObjectId;
  animeId: number;
  title: string;
  imageUrl: string;
  episodeNumber: number;
  progress: number; // 0-100 percentage
  duration: string;
  watchedAt: Date;
}

const WatchHistorySchema = new Schema<IWatchHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    animeId: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    episodeNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    duration: {
      type: String,
      default: "",
    },
    watchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index: unique per user, anime, and episode
WatchHistorySchema.index(
  { userId: 1, animeId: 1, episodeNumber: 1 },
  { unique: true }
);
// Sort by recent
WatchHistorySchema.index({ userId: 1, watchedAt: -1 });

const WatchHistory: Model<IWatchHistory> =
  mongoose.models.WatchHistory ||
  mongoose.model<IWatchHistory>("WatchHistory", WatchHistorySchema);

export default WatchHistory;
