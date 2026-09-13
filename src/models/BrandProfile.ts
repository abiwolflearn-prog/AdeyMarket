import mongoose, { Document, Schema } from "mongoose";

export interface IBrandProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  phone?: string;
  city?: string;
  address?: string;
  businessCategory?: string;
  taxId?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    telegram?: string;
  };
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brandProfileSchema = new Schema<IBrandProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // A user should only have one brand profile
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    businessCategory: {
      type: String,
      trim: true,
      default: "",
    },
    taxId: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    socialLinks: {
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      facebook: { type: String, default: "" },
      telegram: { type: String, default: "" },
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const BrandProfile = (mongoose.models.BrandProfile as mongoose.Model<IBrandProfile>) || mongoose.model<IBrandProfile>("BrandProfile", brandProfileSchema);
export default BrandProfile;
