import { Request, Response } from "express";
import mongoose from "mongoose";
import Order, { IOrderItem } from "../models/Order";
import Product from "../models/Product";
import Shop from "../models/Shop";
import Campaign from "../models/Campaign";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Public (Optional auth for buyerId)
 */
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      items,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      paymentMethod = "telebirr",
      referrerId: bodyReferrerId,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "Order must contain at least one item" });
      return;
    }

    if (!customerName || !customerPhone || !shippingAddress?.street) {
      res.status(400).json({ message: "Customer name, phone, and delivery address are required" });
      return;
    }

    // Determine referrer: from body or cookie
    const cookieReferrer = req.cookies?.referral_creator_id;
    const rawReferrerId = bodyReferrerId || cookieReferrer;
    let validatedReferrerId: mongoose.Types.ObjectId | undefined;

    if (rawReferrerId) {
      if (mongoose.Types.ObjectId.isValid(rawReferrerId)) {
        validatedReferrerId = new mongoose.Types.ObjectId(rawReferrerId);
      } else {
        const cleanRef = String(rawReferrerId).trim();
        const foundCreator = await User.findOne({
          $or: [
            { email: cleanRef.toLowerCase() },
            { name: new RegExp(`^${cleanRef}$`, "i") },
          ],
        });
        if (foundCreator) {
          validatedReferrerId = foundCreator._id as mongoose.Types.ObjectId;
        }
      }
    }

    // Verify products, verify stock, calculate prices
    const validatedItems: IOrderItem[] = [];
    let totalAmount = 0;
    let primarySellerId: mongoose.Types.ObjectId | null = null;

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        res.status(400).json({ message: `Invalid product ID: ${item.productId}` });
        return;
      }

      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        res.status(404).json({ message: `Product not found or inactive: ${item.name || item.productId}` });
        return;
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (product.stock < quantity) {
        res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${quantity}`,
        });
        return;
      }

      if (!primarySellerId) {
        primarySellerId = product.sellerId;
      }

      validatedItems.push({
        productId: product._id as mongoose.Types.ObjectId,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images?.[0] || "",
      });

      totalAmount += product.price * quantity;

      // Decrement product stock
      product.stock = Math.max(0, product.stock - quantity);
      await product.save();
    }

    if (!primarySellerId) {
      res.status(400).json({ message: "Could not determine seller for order items" });
      return;
    }

    // If referrer is the seller themselves, ignore commission
    if (validatedReferrerId && validatedReferrerId.toString() === primarySellerId.toString()) {
      validatedReferrerId = undefined;
    }

    // Check seller's shop to get default commission rate
    let commissionRate = 0;
    const sellerShop = await Shop.findOne({ ownerId: primarySellerId });
    if (sellerShop && typeof sellerShop.defaultCommissionRate === "number") {
      commissionRate = Math.min(30, Math.max(0, sellerShop.defaultCommissionRate));
    }

    // Task 9.8: Check if any ordered products belong to an active campaign with a boosted commission rate
    const now = new Date();
    const orderedProductIds = validatedItems.map((item) => item.productId);
    const activeCampaigns = await Campaign.find({
      sellerId: primarySellerId,
      status: { $ne: "draft" },
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { products: { $in: orderedProductIds } },
        { products: { $size: 0 } }, // Storewide campaign applies to all products
      ],
    }).sort({ boostedCommissionRate: -1 });

    if (activeCampaigns.length > 0) {
      const topBoost = activeCampaigns[0].boostedCommissionRate;
      if (topBoost > commissionRate) {
        commissionRate = topBoost;
      }
      // Record referral engagement in campaign metrics
      activeCampaigns[0].totalSales = (activeCampaigns[0].totalSales || 0) + totalAmount;
      activeCampaigns[0].totalReferrals = (activeCampaigns[0].totalReferrals || 0) + 1;
      await activeCampaigns[0].save();
    }

    // Order Financial Calculations:
    // Platform fee = 5%
    const platformFee = Math.round(totalAmount * 0.05 * 100) / 100;

    // Referrer commission
    let referrerCommission = 0;
    if (validatedReferrerId && commissionRate > 0) {
      referrerCommission = Math.round(totalAmount * (commissionRate / 100) * 100) / 100;
    }

    // Seller payout = totalAmount - platformFee - referrerCommission
    const sellerPayout = Math.max(0, Math.round((totalAmount - platformFee - referrerCommission) * 100) / 100);

    // Generate unique order number
    const orderNumber = `ETH-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await Order.create({
      orderNumber,
      buyerId: req.user?._id,
      sellerId: primarySellerId,
      referrerId: validatedReferrerId,
      items: validatedItems,
      customerName,
      customerPhone,
      customerEmail: customerEmail || req.user?.email,
      shippingAddress: {
        street: shippingAddress.street,
        city: shippingAddress.city || "Addis Ababa",
        subcity: shippingAddress.subcity || "",
        note: shippingAddress.note || "",
      },
      totalAmount,
      platformFee,
      referrerCommission,
      sellerPayout,
      commissionRate,
      paymentMethod,
      paymentStatus: paymentMethod === "cash_on_delivery" ? "pending" : "paid", // Simulated payment success for digital
      orderStatus: "processing",
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error while creating order", error: error.message });
  }
};

/**
 * @desc    Get orders (seller's sales, creator's referral conversions, or buyer's purchases)
 * @route   GET /api/orders
 * @access  Private
 */
export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { type, status } = req.query;
    let query: any = {};

    if (type === "referred") {
      query.referrerId = user._id;
    } else if (type === "purchased") {
      query.buyerId = user._id;
    } else {
      // Default to seller orders if brand or creator, or buyer orders if consumer
      if (user.role === "consumer") {
        query.buyerId = user._id;
      } else {
        query.sellerId = user._id;
      }
    }

    if (status && typeof status === "string") {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("sellerId", "name email profilePic")
      .populate("referrerId", "name email")
      .populate("buyerId", "name email");

    res.status(200).json(orders);
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error while fetching orders" });
  }
};

/**
 * @desc    Get a single order by ID or orderNumber
 * @route   GET /api/orders/:id
 * @access  Public / Authenticated
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    let query: any = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { orderNumber: id };
    }

    const order = await Order.findOne(query)
      .populate("sellerId", "name email profilePic")
      .populate("referrerId", "name email")
      .populate("buyerId", "name email");

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json(order);
  } catch (error: any) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error while fetching order" });
  }
};

/**
 * @desc    Update shipping / tracking for an order
 * @route   PATCH /api/orders/:id/ship
 * @access  Private (Seller only)
 */
export const updateOrderTracking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const id = req.params.id as string;
    const { trackingNumber, shippingCarrier } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Verify ownership
    if (order.sellerId.toString() !== user?._id.toString()) {
      res.status(403).json({ message: "Not authorized to update this order" });
      return;
    }

    if (order.orderStatus === "delivered") {
      res.status(400).json({ message: "Cannot update shipping for an already delivered order" });
      return;
    }

    if (order.orderStatus === "cancelled") {
      res.status(400).json({ message: "Cannot update shipping for a cancelled order" });
      return;
    }

    order.trackingNumber = trackingNumber || order.trackingNumber;
    order.shippingCarrier = shippingCarrier || order.shippingCarrier || "Ethiopian Postal Service / Local Courier";
    order.orderStatus = "shipped";
    order.shippedAt = new Date();

    await order.save();

    res.status(200).json({
      message: "Order marked as shipped",
      order,
    });
  } catch (error: any) {
    console.error("Error updating order tracking:", error);
    res.status(500).json({ message: "Server error while updating order tracking" });
  }
};

/**
 * @desc    Mark an order as delivered & release pending balance into available balance
 * @route   PATCH /api/orders/:id/deliver
 * @access  Private (Seller or Buyer)
 */
export const deliverOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const id = req.params.id as string;

    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Authorization check: only seller or buyer can mark delivered
    const isSeller = order.sellerId.toString() === user._id.toString();
    const isBuyer = order.buyerId && order.buyerId.toString() === user._id.toString();

    if (!isSeller && !isBuyer) {
      res.status(403).json({ message: "Not authorized to update this order status" });
      return;
    }

    // Check if already delivered
    if (order.orderStatus === "delivered") {
      res.status(400).json({ message: "Order is already marked as delivered" });
      return;
    }

    // Cannot deliver a cancelled order
    if (order.orderStatus === "cancelled") {
      res.status(400).json({ message: "Cannot deliver a cancelled order" });
      return;
    }

    // Must be in 'shipped' status before delivering (enforce pending -> shipped -> delivered lifecycle)
    if (order.orderStatus !== "shipped") {
      res.status(400).json({
        message: `Order cannot be delivered from status '${order.orderStatus}'. Order must be marked as 'shipped' first.`,
      });
      return;
    }

    // Verify payment status (do not release earnings for failed/unpaid orders)
    if (order.paymentStatus === "failed") {
      res.status(400).json({ message: "Cannot deliver an order with failed payment status" });
      return;
    }

    // Transition status to delivered
    order.orderStatus = "delivered";
    order.deliveredAt = new Date();
    // For COD orders, delivery also completes the payment
    if (order.paymentStatus === "pending") {
      order.paymentStatus = "paid";
    }

    await order.save();

    res.status(200).json({
      message: "Order successfully marked as delivered. Funds released to available balance.",
      order,
    });
  } catch (error: any) {
    console.error("Error marking order as delivered:", error);
    res.status(500).json({ message: "Server error while marking order as delivered" });
  }
};

