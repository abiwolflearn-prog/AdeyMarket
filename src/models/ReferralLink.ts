import mongoose, { Document, Schema } from "mongoose";

export interface IReferralLink extends Document {
  code: string;
  creatorId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  agreementId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  url: string;
  commissionRate: number;
  clicks: number;
  conversions: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const referralLinkSchema = new Schema<IReferralLink>(
  {
    code: {
      type: String,
      required: [true, "Affiliate code is required"],
      index: true,
      trim: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Company ID is required"],
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: [true, "Campaign ID is required"],
      index: true,
    },
    agreementId: {
      type: Schema.Types.ObjectId,
      ref: "PartnershipAgreement",
      required: [true, "Agreement ID is required"],
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      index: true,
    },
    url: {
      type: String,
      required: [true, "Affiliate URL is required"],
      trim: true,
    },
    commissionRate: {
      type: Number,
      required: [true, "Commission rate is required"],
      min: 0,
      max: 100,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    conversions: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index to prevent duplicate referral links per creator, agreement, and product
referralLinkSchema.index({ creatorId: 1, agreementId: 1, productId: 1 }, { unique: true });

const ReferralLink =
  (mongoose.models.ReferralLink as mongoose.Model<IReferralLink>) ||
  mongoose.model<IReferralLink>("ReferralLink", referralLinkSchema);

export default ReferralLink;
