import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWatchlistItem extends Document {
  userId: mongoose.Types.ObjectId;
  animeId: number; // MAL ID
  title: string;
  imageUrl: string;
  rating: number;
  status: string;
  type: string;
  addedAt: Date;
}

const WatchlistSchema = new Schema<IWatchlistItem>(
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
    rating: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "plan_to_watch",
    },
    type: {
      type: String,
      default: "TV",
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index: one entry per user per anime
WatchlistSchema.index({ userId: 1, animeId: 1 }, { unique: true });

const Watchlist: Model<IWatchlistItem> =
  mongoose.models.Watchlist ||
  mongoose.model<IWatchlistItem>("Watchlist", WatchlistSchema);

export default Watchlist;
