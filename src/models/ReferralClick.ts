import mongoose, { Document, Schema } from "mongoose";

export interface IReferralClick extends Document {
  referrerId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  agreementId?: mongoose.Types.ObjectId;
  affiliateCode?: string;
  createdAt: Date;
}

const referralClickSchema = new Schema<IReferralClick>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
    },
    agreementId: {
      type: Schema.Types.ObjectId,
      ref: "PartnershipAgreement",
    },
    affiliateCode: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ReferralClick = (mongoose.models.ReferralClick as mongoose.Model<IReferralClick>) || mongoose.model<IReferralClick>("ReferralClick", referralClickSchema);
export default ReferralClick;
