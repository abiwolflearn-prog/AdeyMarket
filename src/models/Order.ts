import mongoose, { Document, Schema } from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  buyerId?: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  referrerId?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    street: string;
    city: string;
    subcity?: string;
    note?: string;
  };
  totalAmount: number;
  platformFee: number; // 5% platform fee
  referrerCommission: number; // Commission paid to referrer
  sellerPayout: number; // Net amount received by seller (total - platformFee - referrerCommission)
  commissionRate: number; // Commission rate percentage applied (e.g. 10%)
  paymentMethod: "arifpay" | "telebirr" | "cash_on_delivery";
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingNumber?: string;
  shippingCarrier?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    image: {
      type: String,
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val: IOrderItem[]) => val.length > 0, "Order must have at least one item"],
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true, default: "Addis Ababa" },
      subcity: { type: String },
      note: { type: String },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    referrerCommission: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sellerPayout: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["arifpay", "telebirr", "cash_on_delivery"],
      default: "telebirr",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      required: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    shippingCarrier: {
      type: String,
      trim: true,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Order = (mongoose.models.Order as mongoose.Model<IOrder>) || mongoose.model<IOrder>("Order", orderSchema);
export default Order;
