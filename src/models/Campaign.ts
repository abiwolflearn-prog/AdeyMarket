import mongoose, { Document, Schema } from "mongoose";

export interface ICampaign extends Document {
  sellerId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  boostedCommissionRate: number; // e.g., 20 for 20%
  startDate: Date;
  endDate: Date;
  products: mongoose.Types.ObjectId[];
  bannerImage?: string;
  status: "draft" | "active" | "scheduled" | "ended";
  targetNiche?: string;
  budget?: number;
  totalReferrals?: number;
  totalSales?: number;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Campaign title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    boostedCommissionRate: {
      type: Number,
      required: [true, "Boosted commission rate is required"],
      min: [1, "Commission must be at least 1%"],
      max: [70, "Commission cannot exceed 70%"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    bannerImage: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "active", "scheduled", "ended"],
      default: "active",
      index: true,
    },
    targetNiche: {
      type: String,
      default: "General",
    },
    budget: {
      type: Number,
      default: 0,
    },
    totalReferrals: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual or helper to determine real-time status based on current time
campaignSchema.pre("save", function () {
  const now = new Date();
  if (this.status !== "draft") {
    if (now < this.startDate) {
      this.status = "scheduled";
    } else if (now > this.endDate) {
      this.status = "ended";
    } else {
      this.status = "active";
    }
  }
});

const Campaign =
  (mongoose.models.Campaign as mongoose.Model<ICampaign>) ||
  mongoose.model<ICampaign>("Campaign", campaignSchema);

export default Campaign;
