import mongoose, { Document, Schema } from "mongoose";

export interface IShop extends Document {
  ownerId: mongoose.Types.ObjectId;
  ownerRole: "brand" | "creator";
  shopSlug: string;
  description: string;
  logo: string;
  defaultCommissionRate: number; // Percentage (0-30)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shopSchema = new Schema<IShop>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One shop per user
    },
    ownerRole: {
      type: String,
      enum: ["brand", "creator"],
      required: true,
    },
    shopSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"],
    },
    description: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
    defaultCommissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 30, // Capped at 30% per project requirements
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Shop = (mongoose.models.Shop as mongoose.Model<IShop>) || mongoose.model<IShop>("Shop", shopSchema);
export default Shop;
