import mongoose, { Document, Schema } from "mongoose";

export type AgreementStatus =
  | "pending_company_acceptance"
  | "pending_creator_acceptance"
  | "active"
  | "rejected"
  | "terminated"
  | "expired";

export interface IPartnershipAgreementDoc extends Document {
  companyId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  commissionRate: number;
  products: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate?: Date;
  paymentRules: string;
  cancellationRules: string;
  companyAccepted: boolean;
  companyAcceptedAt?: Date;
  creatorAccepted: boolean;
  creatorAcceptedAt?: Date;
  status: AgreementStatus;
  affiliateCode?: string;
  rejectionReason?: string;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  terminationReason?: string;
  terminatedBy?: mongoose.Types.ObjectId;
  terminatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const partnershipAgreementSchema = new Schema<IPartnershipAgreementDoc>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Company ID is required"],
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: [true, "Campaign ID is required"],
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "CampaignApplication",
      index: true,
    },
    commissionRate: {
      type: Number,
      required: [true, "Commission rate is required"],
      min: [1, "Commission rate must be at least 1%"],
      max: [70, "Commission rate cannot exceed 70%"],
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    paymentRules: {
      type: String,
      required: [true, "Payment and commission rules are required"],
      trim: true,
      default:
        "Arifpay escrow protection applies to all orders. Commission payouts are released upon confirmed customer delivery. Standard 5% platform service fee applies.",
    },
    cancellationRules: {
      type: String,
      required: [true, "Cancellation and return rules are required"],
      trim: true,
      default:
        "Either party may terminate this agreement with written notice prior to campaign completion. Delivered orders prior to termination are honored for payout.",
    },
    companyAccepted: {
      type: Boolean,
      default: false,
    },
    companyAcceptedAt: {
      type: Date,
    },
    creatorAccepted: {
      type: Boolean,
      default: false,
    },
    creatorAcceptedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        "pending_company_acceptance",
        "pending_creator_acceptance",
        "active",
        "rejected",
        "terminated",
        "expired",
      ],
      default: "pending_creator_acceptance",
      index: true,
    },
    affiliateCode: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    terminationReason: {
      type: String,
      trim: true,
    },
    terminatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    terminatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Helper function to safely derive and generate tracking code
export function generateAffiliateTrackingCode(
  campaignTitle: string,
  creatorSuffix: string
): string {
  const cleanTitle = (campaignTitle || "CAMP")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const cleanCreator = creatorSuffix.replace(/[^A-Za-z0-9]/g, "").slice(-4).toUpperCase();
  return `ETHIO-${cleanTitle}-${cleanCreator}-${randomSuffix}`;
}

// Ensure state machine invariants before saving
partnershipAgreementSchema.pre("save", function () {
  const now = new Date();

  // Guard: If already rejected or terminated, state cannot be reverted
  if (this.status === "rejected" || this.status === "terminated") {
    this.affiliateCode = undefined;
    return;
  }

  // Guard: Check if agreement has passed its end date
  if (this.endDate && now > this.endDate) {
    this.status = "expired";
    this.affiliateCode = undefined;
    return;
  }

  // Lifecycle check: Active ONLY when BOTH sides have explicitly accepted
  if (this.companyAccepted && this.creatorAccepted) {
    this.status = "active";
    if (!this.affiliateCode) {
      this.affiliateCode = generateAffiliateTrackingCode(
        "PARTNER",
        this.creatorId ? this.creatorId.toString() : "AFF"
      );
    }
  } else if (this.companyAccepted && !this.creatorAccepted) {
    this.status = "pending_creator_acceptance";
    this.affiliateCode = undefined;
  } else if (!this.companyAccepted && this.creatorAccepted) {
    this.status = "pending_company_acceptance";
    this.affiliateCode = undefined;
  } else {
    this.status = "pending_company_acceptance";
    this.affiliateCode = undefined;
  }
});

const PartnershipAgreement =
  (mongoose.models.PartnershipAgreement as mongoose.Model<IPartnershipAgreementDoc>) ||
  mongoose.model<IPartnershipAgreementDoc>("PartnershipAgreement", partnershipAgreementSchema);

export default PartnershipAgreement;
