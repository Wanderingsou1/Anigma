import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email?: string;
  username: string;
  avatar: string;
  plan: "free" | "premium" | "family";
  favoriteGenres: string[];
  provider: "mal";
  malUserId: number;
  malUsername: string;
  malAccessToken: string;
  malRefreshToken: string;
  malTokenExpiresAt: Date;
  malSyncEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    avatar: {
      type: String,
      default: "",
    },
    plan: {
      type: String,
      enum: ["free", "premium", "family"],
      default: "free",
    },
    favoriteGenres: {
      type: [String],
      default: [],
    },
    provider: {
      type: String,
      enum: ["mal"],
      default: "mal",
    },
    malUserId: {
      type: Number,
      required: true,
      unique: true,
    },
    malUsername: {
      type: String,
      required: true,
    },
    malAccessToken: {
      type: String,
      required: true,
    },
    malRefreshToken: {
      type: String,
      required: true,
    },
    malTokenExpiresAt: {
      type: Date,
      required: true,
    },
    malSyncEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
