import mongoose, { Document, Schema } from "mongoose";

export interface ICreatorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  username?: string;
  displayName?: string;
  bio?: string;
  city?: string;
  niche: string;
  followerCount: number;
  socialLinks: {
    tiktok?: string;
    instagram?: string;
    youtube?: string;
    telegram?: string;
    twitter?: string;
  };
  payoutInfo?: {
    preferredMethod?: "telebirr" | "bank_transfer" | "";
    phoneNumber?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
  };
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

const creatorProfileSchema = new Schema<ICreatorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // A user should only have one creator profile
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    displayName: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    niche: {
      type: String,
      trim: true,
      default: "",
    },
    followerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    socialLinks: {
      tiktok: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      telegram: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    payoutInfo: {
      preferredMethod: {
        type: String,
        enum: ["telebirr", "bank_transfer", ""],
        default: "telebirr",
      },
      phoneNumber: { type: String, default: "" },
      bankName: { type: String, default: "Commercial Bank of Ethiopia (CBE)" },
      accountNumber: { type: String, default: "" },
      accountHolderName: { type: String, default: "" },
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const CreatorProfile = (mongoose.models.CreatorProfile as mongoose.Model<ICreatorProfile>) || mongoose.model<ICreatorProfile>("CreatorProfile", creatorProfileSchema);
export default CreatorProfile;
