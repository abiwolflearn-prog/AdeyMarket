import { Request, Response } from "express";
import mongoose from "mongoose";
import ReferralClick from "../models/ReferralClick";
import ReferralLink from "../models/ReferralLink";
import PartnershipAgreement, { generateAffiliateTrackingCode } from "../models/PartnershipAgreement";
import Campaign from "../models/Campaign";
import CampaignApplication from "../models/CampaignApplication";
import Product from "../models/Product";
import Order from "../models/Order";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

/**
 * @desc    Generate a verified affiliate link under an ACTIVE Partnership Agreement
 * @route   POST /api/referral/generate-link
 * @access  Private (Creator / Brand)
 */
export const generateAffiliateLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { productId, campaignId, agreementId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "A valid productId is required to generate an affiliate link" });
      return;
    }

    // 1. Verify target product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404).json({ message: "Product not found or inactive" });
      return;
    }

    const sellerId = product.sellerId;
    const creatorId = new mongoose.Types.ObjectId(user._id);

    // Requirement 2: Creator cannot generate links for another creator
    if (req.body.creatorId && req.body.creatorId.toString() !== creatorId.toString()) {
      res.status(403).json({
        message: "Forbidden: You cannot generate affiliate links for another creator",
      });
      return;
    }

    // Build agreement lookup query
    const agreementQuery: any = {
      creatorId: creatorId,
      companyId: sellerId,
    };

    if (agreementId && mongoose.Types.ObjectId.isValid(agreementId)) {
      agreementQuery._id = new mongoose.Types.ObjectId(agreementId);
    } else if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
      agreementQuery.campaignId = new mongoose.Types.ObjectId(campaignId);
    }

    // Look for agreement matching creator and seller
    const agreement = await PartnershipAgreement.findOne(agreementQuery);

    // Requirement 1: Creator cannot generate a campaign affiliate link without an ACTIVE agreement
    if (!agreement) {
      // Check if creator is trying to access another company's private campaign without agreement
      if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
        const foreignCampaign = await Campaign.findById(campaignId);
        if (foreignCampaign && foreignCampaign.sellerId.toString() !== sellerId.toString()) {
          // Requirement 3: Creator cannot generate links for another company's private campaign
          res.status(403).json({
            message: "Forbidden: You cannot generate affiliate links for another company's private campaign",
          });
          return;
        }
      }

      res.status(403).json({
        message: "Cannot generate affiliate link without a valid, ACTIVE Company ↔ Creator partnership agreement. Please apply to the campaign first.",
      });
      return;
    }

    // Check status of agreement: Must be ACTIVE with mutual acceptance
    if (
      agreement.status !== "active" ||
      !agreement.companyAccepted ||
      !agreement.creatorAccepted
    ) {
      res.status(403).json({
        message: `Cannot generate affiliate link: Partnership agreement is in '${agreement.status}' status. An ACTIVE agreement accepted by both parties is required.`,
        agreementStatus: agreement.status,
      });
      return;
    }

    // Requirement 3: Creator cannot generate links for another company's private campaign
    const campaign = await Campaign.findById(agreement.campaignId);
    if (!campaign) {
      res.status(404).json({ message: "Associated campaign not found" });
      return;
    }

    if (campaign.sellerId.toString() !== agreement.companyId.toString()) {
      res.status(403).json({
        message: "Forbidden: Agreement company does not match campaign owner",
      });
      return;
    }

    // Validate applicable product:
    // If campaign has enrolled products list, the product must be enrolled in the campaign
    if (campaign.products && campaign.products.length > 0) {
      const isEnrolled = campaign.products.some(
        (p) => p.toString() === product._id.toString()
      );
      if (!isEnrolled) {
        res.status(400).json({
          message: `Product '${product.name}' is not an applicable enrolled product for campaign '${campaign.title}'`,
        });
        return;
      }
    }

    // If agreement specifies applicable products, check that too
    if (agreement.products && agreement.products.length > 0) {
      const inAgreement = agreement.products.some(
        (p) => p.toString() === product._id.toString()
      );
      if (!inAgreement) {
        res.status(400).json({
          message: `Product '${product.name}' is not in the list of applicable products for this partnership agreement`,
        });
        return;
      }
    }

    // Ensure unique tracking affiliate code exists on the agreement
    if (!agreement.affiliateCode) {
      agreement.affiliateCode = generateAffiliateTrackingCode(
        campaign.title,
        creatorId.toString()
      );
      await agreement.save();
    }

    const code = agreement.affiliateCode;
    const origin = req.get("origin") || req.get("referer") || "http://localhost:3000";
    const cleanOrigin = origin.replace(/\/$/, "");
    const trackingUrl = `${cleanOrigin}/product/${product._id}?ref=${creatorId}&code=${code}`;

    // Requirement 4: Links must be associated with:
    // - creator
    // - company/seller
    // - campaign
    // - applicable product
    // - agreement
    let referralLink = await ReferralLink.findOne({
      creatorId,
      agreementId: agreement._id,
      productId: product._id,
    });

    if (!referralLink) {
      referralLink = await ReferralLink.create({
        code,
        creatorId,
        companyId: agreement.companyId,
        campaignId: agreement.campaignId,
        agreementId: agreement._id,
        productId: product._id,
        url: trackingUrl,
        commissionRate: agreement.commissionRate,
      });
    } else {
      referralLink.url = trackingUrl;
      referralLink.commissionRate = agreement.commissionRate;
      referralLink.code = code;
      referralLink.companyId = agreement.companyId;
      referralLink.campaignId = agreement.campaignId;
      await referralLink.save();
    }

    res.status(200).json({
      success: true,
      message: "Affiliate tracking link successfully generated under active partnership agreement",
      link: {
        _id: referralLink._id,
        code: referralLink.code,
        url: referralLink.url,
        creatorId: referralLink.creatorId,
        companyId: referralLink.companyId,
        campaignId: referralLink.campaignId,
        agreementId: referralLink.agreementId,
        productId: referralLink.productId,
        commissionRate: referralLink.commissionRate,
        createdAt: referralLink.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error generating affiliate link:", error);
    res.status(500).json({ message: "Server error while generating affiliate link" });
  }
};

/**
 * @desc    Check affiliate eligibility for a product (whether creator has active agreement)
 * @route   GET /api/referral/check-eligibility/:productId
 * @access  Private (Creator / Brand)
 */
export const checkProductAffiliateEligibility = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const rawProductId = req.params.productId;
    const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;
    if (!productId || typeof productId !== "string" || !mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const creatorId = new mongoose.Types.ObjectId(user._id);
    const sellerId = product.sellerId;

    // 1. Check for active agreement
    const activeAgreement = await PartnershipAgreement.findOne({
      creatorId,
      companyId: sellerId,
      status: "active",
      companyAccepted: true,
      creatorAccepted: true,
    }).populate("campaignId", "title boostedCommissionRate products status");

    if (activeAgreement) {
      const existingLink = await ReferralLink.findOne({
        creatorId,
        agreementId: activeAgreement._id,
        productId: product._id,
      });

      const origin = req.get("origin") || req.get("referer") || "http://localhost:3000";
      const cleanOrigin = origin.replace(/\/$/, "");
      const generatedUrl = `${cleanOrigin}/product/${product._id}?ref=${creatorId}&code=${activeAgreement.affiliateCode}`;

      res.status(200).json({
        isEligible: true,
        status: "active",
        agreement: {
          _id: activeAgreement._id,
          campaignId: activeAgreement.campaignId,
          commissionRate: activeAgreement.commissionRate,
          affiliateCode: activeAgreement.affiliateCode,
          startDate: activeAgreement.startDate,
          endDate: activeAgreement.endDate,
        },
        affiliateCode: activeAgreement.affiliateCode,
        trackingUrl: existingLink ? existingLink.url : generatedUrl,
      });
      return;
    }

    // 2. Check for pending agreement
    const pendingAgreement = await PartnershipAgreement.findOne({
      creatorId,
      companyId: sellerId,
      status: { $in: ["pending_creator_acceptance", "pending_company_acceptance"] },
    }).populate("campaignId", "title boostedCommissionRate");

    if (pendingAgreement) {
      res.status(200).json({
        isEligible: false,
        status: pendingAgreement.status,
        message:
          pendingAgreement.status === "pending_creator_acceptance"
            ? "Partnership agreement offered! Please accept the agreement on the Campaigns page to unlock your tracking link."
            : "Partnership agreement created and awaiting company confirmation.",
        agreementId: pendingAgreement._id,
      });
      return;
    }

    // 3. Check for submitted application
    const application = await CampaignApplication.findOne({
      creatorId,
      companyId: sellerId,
      status: "pending",
    }).populate("campaignId", "title");

    if (application) {
      res.status(200).json({
        isEligible: false,
        status: "pending_application",
        message: "Your application to this brand's campaign is currently under review.",
      });
      return;
    }

    // 4. No agreement found
    res.status(200).json({
      isEligible: false,
      status: "no_agreement",
      message: "An active Partnership Agreement with the seller is required to generate affiliate tracking links.",
    });
  } catch (error: any) {
    console.error("Error checking affiliate eligibility:", error);
    res.status(500).json({ message: "Server error checking affiliate eligibility" });
  }
};

/**
 * @desc    Get all active referral links for the logged-in creator
 * @route   GET /api/referral/my-links
 * @access  Private (Creator)
 */
export const getMyReferralLinks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const creatorId = new mongoose.Types.ObjectId(user._id);
    const links = await ReferralLink.find({ creatorId })
      .populate("productId", "name price images")
      .populate("campaignId", "title boostedCommissionRate")
      .populate("companyId", "name email")
      .populate("agreementId", "status commissionRate affiliateCode")
      .sort({ createdAt: -1 });

    res.status(200).json(links);
  } catch (error: any) {
    console.error("Error getting referral links:", error);
    res.status(500).json({ message: "Server error getting referral links" });
  }
};

/**
 * @desc    Track an affiliate link click and set HTTP-only cookie
 * @route   POST /api/referral/track
 * @access  Public
 */
export const trackClick = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref, productId, code } = req.body;

    if (!ref && !code) {
      res.status(400).json({ message: "Invalid or missing ref or code parameter" });
      return;
    }

    let creatorId: mongoose.Types.ObjectId | null = null;
    let agreement: any = null;

    // Check if code or ref matches an active agreement
    const searchCode = (code || ref || "").toString().trim();
    if (searchCode.startsWith("ETHIO-") || searchCode.includes("-")) {
      agreement = await PartnershipAgreement.findOne({
        affiliateCode: searchCode,
        status: "active",
      });
      if (agreement) {
        creatorId = agreement.creatorId;
      }
    }

    // If not found via code, resolve creator from ref
    if (!creatorId && ref) {
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
    }

    if (!creatorId) {
      res.status(400).json({ message: "Referral creator not found" });
      return;
    }

    // Set the referral cookie for 30 days (Requirement 5: 30-day attribution intact)
    res.cookie("referral_creator_id", creatorId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    if (agreement && agreement.affiliateCode) {
      res.cookie("referral_affiliate_code", agreement.affiliateCode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }

    const validProductId =
      productId && mongoose.Types.ObjectId.isValid(productId)
        ? new mongoose.Types.ObjectId(productId)
        : undefined;

    // Record the click for analytics
    await ReferralClick.create({
      referrerId: creatorId,
      productId: validProductId,
      companyId: agreement?.companyId,
      campaignId: agreement?.campaignId,
      agreementId: agreement?._id,
      affiliateCode: agreement?.affiliateCode || (code ? String(code) : undefined),
    });

    // Increment click count on ReferralLink if applicable
    if (agreement?.affiliateCode && validProductId) {
      await ReferralLink.updateOne(
        { code: agreement.affiliateCode, productId: validProductId },
        { $inc: { clicks: 1 } }
      );
    }

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

    // 2. Fetch all valid attributed orders (exclude failed payments, cancelled and returned orders)
    const attributedOrders = await Order.find({
      referrerId: uid,
      paymentStatus: { $ne: "failed" },
      orderStatus: { $nin: ["cancelled", "returned"] },
      commissionStatus: { $ne: "cancelled" },
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

