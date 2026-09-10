import { Request, Response } from "express";
import mongoose from "mongoose";
import ReferralClick from "../models/ReferralClick";
import Order from "../models/Order";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

/**
 * @desc    Track an affiliate link click and set HTTP-only cookie
 * @route   POST /api/referral/track
 * @access  Public
 */
export const trackClick = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref, productId } = req.body;

    if (!ref) {
      res.status(400).json({ message: "Invalid or missing ref parameter" });
      return;
    }

    let creatorId: mongoose.Types.ObjectId | null = null;
    if (mongoose.Types.ObjectId.isValid(ref)) {
      creatorId = new mongoose.Types.ObjectId(ref);
    } else {
      const cleanRef = String(ref).trim();
      const foundUser = await User.findOne({
        $or: [
          { email: cleanRef.toLowerCase() },
          { name: new RegExp(`^${cleanRef}$`, "i") },
        ],
      });
      if (foundUser) {
        creatorId = foundUser._id as mongoose.Types.ObjectId;
      }
    }

    if (!creatorId) {
      res.status(400).json({ message: "Referral creator not found" });
      return;
    }

    // Set the referral cookie for 30 days
    res.cookie("referral_creator_id", creatorId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Record the click for analytics
    await ReferralClick.create({
      referrerId: creatorId,
      productId: productId && mongoose.Types.ObjectId.isValid(productId) ? productId : undefined,
    });

    res.status(200).json({ message: "Referral tracked successfully" });
  } catch (error: any) {
    console.error("Error tracking referral:", error);
    res.status(500).json({ message: "Server error while tracking referral" });
  }
};

/**
 * @desc    Get referral stats for the logged-in creator/brand
 * @route   GET /api/referral/stats
 * @access  Private
 */
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(user._id)) {
      res.status(200).json({ clicks: 0, conversions: 0, earnings: 0 });
      return;
    }

    const uid = new mongoose.Types.ObjectId(user._id);

    // Count total clicks
    const clicks = await ReferralClick.countDocuments({ referrerId: uid });

    // Query orders referred by this user
    const referredOrders = await Order.find({ referrerId: uid });
    const conversions = referredOrders.length;
    const earnings = referredOrders.reduce((sum, order) => sum + (order.referrerCommission || 0), 0);

    res.status(200).json({ clicks, conversions, earnings: Math.round(earnings * 100) / 100 });
  } catch (error: any) {
    console.error("Error getting referral stats:", error);
    res.status(200).json({ clicks: 0, conversions: 0, earnings: 0 });
  }
};

/**
 * @desc    Get detailed Creator Analytics aggregation
 * @route   GET /api/referral/analytics
 * @access  Private (Creator only)
 */
export const getCreatorAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (user.role !== "creator") {
      res.status(403).json({ message: "Access restricted to creators" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(user._id)) {
      res.status(400).json({ message: "Invalid user identifier" });
      return;
    }

    const uid = new mongoose.Types.ObjectId(user._id);

    // 1. Total Clicks
    const totalClicks = await ReferralClick.countDocuments({ referrerId: uid });

    // 2. Fetch all valid attributed orders (exclude failed payments and cancelled orders)
    const attributedOrders = await Order.find({
      referrerId: uid,
      paymentStatus: { $ne: "failed" },
      orderStatus: { $ne: "cancelled" },
    }).sort({ createdAt: -1 });

    const totalOrders = attributedOrders.length;
    const totalSales = Math.round(
      attributedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) * 100
    ) / 100;
    const totalCommission = Math.round(
      attributedOrders.reduce((sum, order) => sum + (order.referrerCommission || 0), 0) * 100
    ) / 100;

    // Conversion rate: (orders / clicks) * 100
    const conversionRate =
      totalClicks > 0
        ? Math.round((totalOrders / totalClicks) * 1000) / 10
        : 0;

    // 3. Real financial lifecycle balances (using the production calculation from paymentController)
    const { calculateUserFinancials } = await import("./paymentController");
    const financials = await calculateUserFinancials(uid);

    // 4. Top Products Breakdown
    // Aggregate order items across valid attributed orders
    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        productImage?: string;
        ordersCount: number;
        unitsSold: number;
        revenueGenerated: number;
        commissionEarned: number;
      }
    >();

    for (const order of attributedOrders) {
      const orderCommission = order.referrerCommission || 0;
      const orderTotal = order.totalAmount || 1; // prevent div by zero

      for (const item of order.items) {
        const pId = item.productId ? item.productId.toString() : "unknown";
        const itemRevenue = (item.price || 0) * (item.quantity || 1);
        // Attribute item-level proportional commission from order
        const itemCommission =
          orderTotal > 0
            ? Math.round(((itemRevenue / orderTotal) * orderCommission) * 100) / 100
            : 0;

        if (productMap.has(pId)) {
          const entry = productMap.get(pId)!;
          entry.ordersCount += 1;
          entry.unitsSold += item.quantity || 1;
          entry.revenueGenerated = Math.round((entry.revenueGenerated + itemRevenue) * 100) / 100;
          entry.commissionEarned = Math.round((entry.commissionEarned + itemCommission) * 100) / 100;
          if (!entry.productImage && item.image) {
            entry.productImage = item.image;
          }
        } else {
          productMap.set(pId, {
            productId: pId,
            productName: item.name || "Product",
            productImage: item.image || "",
            ordersCount: 1,
            unitsSold: item.quantity || 1,
            revenueGenerated: Math.round(itemRevenue * 100) / 100,
            commissionEarned: itemCommission,
          });
        }
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenueGenerated - a.revenueGenerated || b.ordersCount - a.ordersCount)
      .slice(0, 10);

    // 5. Top Campaigns Breakdown
    // Historical campaign attribution is not explicitly persisted on the Order schema.
    // Rather than fabricating fake attribution, we document this and report empty or derived mappings.
    const topCampaigns: Array<{
      campaignId: string;
      title: string;
      boostedRate: number;
      ordersCount: number;
      commissionEarned: number;
    }> = [];

    // 6. 7-Day Conversion Trend (Last 7 Calendar Days including today)
    const trend: Array<{
      date: string;
      clicks: number;
      orders: number;
      sales: number;
      commission: number;
    }> = [];

    const now = new Date();
    // Build 7 calendar day buckets (oldest to newest)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      trend.push({
        date: dateStr,
        clicks: 0,
        orders: 0,
        sales: 0,
        commission: 0,
      });
    }

    // Populate clicks in trend
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentClicks = await ReferralClick.find({
      referrerId: uid,
      createdAt: { $gte: sevenDaysAgo },
    });

    for (const click of recentClicks) {
      const clickDate = new Date(click.createdAt);
      const year = clickDate.getFullYear();
      const month = String(clickDate.getMonth() + 1).padStart(2, "0");
      const day = String(clickDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const point = trend.find((t) => t.date === dateStr);
      if (point) {
        point.clicks += 1;
      }
    }

    // Populate orders, sales, commission in trend
    for (const order of attributedOrders) {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= sevenDaysAgo) {
        const year = orderDate.getFullYear();
        const month = String(orderDate.getMonth() + 1).padStart(2, "0");
        const day = String(orderDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        const point = trend.find((t) => t.date === dateStr);
        if (point) {
          point.orders += 1;
          point.sales = Math.round((point.sales + (order.totalAmount || 0)) * 100) / 100;
          point.commission = Math.round((point.commission + (order.referrerCommission || 0)) * 100) / 100;
        }
      }
    }

    res.status(200).json({
      summary: {
        clicks: totalClicks,
        orders: totalOrders,
        conversionRate,
        totalSales,
        totalCommission,
        pendingCommission: financials.pendingAffiliateEarnings,
        availableCommission: financials.availableBalance,
      },
      topProducts,
      topCampaigns,
      trend,
    });
  } catch (error: any) {
    console.error("Error generating creator analytics:", error);
    res.status(500).json({ message: "Server error while generating creator analytics" });
  }
};

