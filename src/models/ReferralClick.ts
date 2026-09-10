import mongoose, { Document, Schema } from "mongoose";

export interface IReferralClick extends Document {
  referrerId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
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
  },
  {
    timestamps: true,
  }
);

const ReferralClick = (mongoose.models.ReferralClick as mongoose.Model<IReferralClick>) || mongoose.model<IReferralClick>("ReferralClick", referralClickSchema);
export default ReferralClick;
