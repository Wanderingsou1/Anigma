import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  passwordHash?: string;
  avatar: string;
  plan: "free" | "premium" | "family";
  favoriteGenres: string[];
  provider: "credentials" | "google" | "discord";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
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
    passwordHash: {
      type: String,
      select: false, // Never return password by default
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
      enum: ["credentials", "google", "discord"],
      default: "credentials",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for frequent queries
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
