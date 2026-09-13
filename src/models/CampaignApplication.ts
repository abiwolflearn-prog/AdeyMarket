import mongoose, { Document, Schema } from "mongoose";

export interface IPartnershipAgreement {
  status: "pending_company_acceptance" | "pending_creator_acceptance" | "active" | "terminated" | "rejected";
  agreedCommissionRate: number;
  agreementTerms?: string;
  affiliateCode?: string; // Generated ONLY when partnership agreement exists and is fully ACTIVE
  approvedAt?: Date;
  agreementId?: mongoose.Types.ObjectId;
}

export interface ICampaignApplication extends Document {
  campaignId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId; // Seller/Company who owns the campaign
  creatorId: mongoose.Types.ObjectId; // Creator who submitted the application
  status: "pending" | "approved" | "rejected";
  pitchMessage: string;
  channels: string[];
  estimatedAudience?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  agreementId?: mongoose.Types.ObjectId;
  partnershipAgreement?: IPartnershipAgreement;
  createdAt: Date;
  updatedAt: Date;
}

const partnershipAgreementSchema = new Schema<IPartnershipAgreement>(
  {
    status: {
      type: String,
      enum: ["pending_company_acceptance", "pending_creator_acceptance", "active", "terminated", "rejected"],
      default: "pending_creator_acceptance",
    },
    agreedCommissionRate: {
      type: Number,
      required: true,
      min: 1,
      max: 70,
    },
    agreementTerms: {
      type: String,
      default: "",
    },
    affiliateCode: {
      type: String,
      trim: true,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: Date.now,
    },
    agreementId: {
      type: Schema.Types.ObjectId,
      ref: "PartnershipAgreement",
    },
  },
  { _id: false }
);

const campaignApplicationSchema = new Schema<ICampaignApplication>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    pitchMessage: {
      type: String,
      required: [true, "Pitch message is required"],
      trim: true,
      maxlength: 2000,
    },
    channels: {
      type: [String],
      default: ["TikTok", "Telegram"],
    },
    estimatedAudience: {
      type: String,
      trim: true,
      default: "",
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    partnershipAgreement: {
      type: partnershipAgreementSchema,
      default: undefined,
    },
    agreementId: {
      type: Schema.Types.ObjectId,
      ref: "PartnershipAgreement",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications from the same creator to the same campaign
campaignApplicationSchema.index({ campaignId: 1, creatorId: 1 }, { unique: true });

const CampaignApplication =
  (mongoose.models.CampaignApplication as mongoose.Model<ICampaignApplication>) ||
  mongoose.model<ICampaignApplication>("CampaignApplication", campaignApplicationSchema);

export default CampaignApplication;
