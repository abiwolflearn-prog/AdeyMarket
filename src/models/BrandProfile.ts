import mongoose, { Document, Schema } from "mongoose";

export interface IBrandProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  taxId?: string;
  website?: string;
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
    taxId: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
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
