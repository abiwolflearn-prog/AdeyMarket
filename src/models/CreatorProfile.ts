import mongoose, { Document, Schema } from "mongoose";

export interface ICreatorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  niche: string;
  followerCount: number;
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
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
    niche: {
      type: String,
      default: "",
    },
    followerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    socialLinks: {
      instagram: String,
      tiktok: String,
      youtube: String,
      twitter: String,
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
