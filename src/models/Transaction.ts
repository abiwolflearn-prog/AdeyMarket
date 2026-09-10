import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  type: "payment" | "payout" | "commission" | "refund";
  amount: number;
  currency: string;
  method: "arifpay" | "telebirr" | "cbe_birr" | "bank_transfer";
  status: "pending" | "completed" | "failed";
  reference: string;
  accountDetails?: {
    payoutType?: "telebirr" | "bank_transfer";
    phoneNumber?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    type: {
      type: String,
      enum: ["payment", "payout", "commission", "refund"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "ETB",
    },
    method: {
      type: String,
      enum: ["arifpay", "telebirr", "cbe_birr", "bank_transfer"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    accountDetails: {
      payoutType: { type: String, enum: ["telebirr", "bank_transfer"] },
      phoneNumber: { type: String },
      bankName: { type: String },
      accountNumber: { type: String },
      accountHolderName: { type: String },
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction =
  (mongoose.models.Transaction as mongoose.Model<ITransaction>) ||
  mongoose.model<ITransaction>("Transaction", transactionSchema);

export default Transaction;
