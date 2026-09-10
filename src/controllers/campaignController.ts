import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import Product from "../models/Product";
import { AuthRequest } from "../middleware/auth";

/**
 * @desc    Create a new promotional boost campaign
 * @route   POST /api/campaigns
 * @access  Private (Seller/Brand)
 */
export const createCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const {
      title,
      description,
      boostedCommissionRate,
      startDate,
      endDate,
      products,
      bannerImage,
      targetNiche,
      budget,
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ message: "Campaign title is required" });
      return;
    }

    const rate = parseFloat(boostedCommissionRate);
    if (isNaN(rate) || rate < 1 || rate > 70) {
      res.status(400).json({ message: "Boosted commission rate must be between 1% and 70%" });
      return;
    }

    if (!startDate || !endDate) {
      res.status(400).json({ message: "Start date and end date are required" });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ message: "Invalid date format provided" });
      return;
    }

    if (end <= start) {
      res.status(400).json({ message: "End date must be after start date" });
      return;
    }

    // Validate products belong to seller
    let productIds: mongoose.Types.ObjectId[] = [];
    if (Array.isArray(products) && products.length > 0) {
      productIds = products
        .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
        .map((id: string) => new mongoose.Types.ObjectId(id));

      const sellerProductsCount = await Product.countDocuments({
        _id: { $in: productIds },
        sellerId: user._id,
      });

      if (sellerProductsCount === 0) {
        res.status(400).json({ message: "Please select valid products from your catalog" });
        return;
      }
    } else {
      // If no specific products provided, select all active products of this seller
      const sellerProducts = await Product.find({ sellerId: user._id, isActive: true }).select("_id");
      productIds = sellerProducts.map((p) => p._id as mongoose.Types.ObjectId);
    }

    const now = new Date();
    let initialStatus: "active" | "scheduled" | "ended" = "active";
    if (now < start) {
      initialStatus = "scheduled";
    } else if (now > end) {
      initialStatus = "ended";
    }

    const campaign = await Campaign.create({
      sellerId: user._id,
      title: title.trim(),
      description: description?.trim() || "",
      boostedCommissionRate: rate,
      startDate: start,
      endDate: end,
      products: productIds,
      bannerImage: bannerImage?.trim() || "",
      status: initialStatus,
      targetNiche: targetNiche?.trim() || "General",
      budget: Number(budget) || 0,
    });

    const populated = await Campaign.findById(campaign._id)
      .populate("products", "name price images category stock")
      .populate("sellerId", "name email");

    res.status(201).json({
      message: "Campaign created successfully",
      campaign: populated,
    });
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ message: "Server error creating campaign", error: error.message });
  }
};

/**
 * @desc    Get all public campaigns (with filters for active/all)
 * @route   GET /api/campaigns
 * @access  Public
 */
export const getCampaigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, sellerId, niche } = req.query;

    const query: any = {};

    const now = new Date();
    if (status === "active") {
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
      query.status = { $ne: "draft" };
    } else if (status) {
      query.status = status;
    }

    if (sellerId && mongoose.Types.ObjectId.isValid(sellerId as string)) {
      query.sellerId = sellerId;
    }

    if (niche && niche !== "All") {
      query.targetNiche = niche;
    }

    // Auto-seed demo campaigns if collection is completely empty
    const totalCount = await Campaign.countDocuments();
    if (totalCount === 0) {
      const anyProducts = await Product.find({ isActive: true }).limit(6);
      if (anyProducts.length > 0) {
        const sellerId = anyProducts[0].sellerId;
        const now = new Date();
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const threeWeeksLater = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

        await Campaign.create([
          {
            sellerId,
            title: "Meskel Festival Mega Creator Boost",
            description: "Promote handwoven Habesha Kemis, leather jackets, and artisan jewelry. Post Reels/TikToks unboxing items or showcasing styling. Earn a whopping 25% commission on each referral order.",
            boostedCommissionRate: 25,
            startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            endDate: twoWeeksLater,
            products: anyProducts.slice(0, 3).map((p) => p._id),
            targetNiche: "Fashion & Leather",
            bannerImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
            status: "active",
            budget: 50000,
          },
          {
            sellerId,
            title: "Ethiopian Specialty Coffee Global Wave",
            description: "Calling all food, lifestyle, and coffee content creators! Share Yirgacheffe roast blends with your audience using your boosted link and earn 20% commission on every bag sold.",
            boostedCommissionRate: 20,
            startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            endDate: threeWeeksLater,
            products: anyProducts.slice(3, 6).map((p) => p._id),
            targetNiche: "Coffee & Spices",
            bannerImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb",
            status: "active",
            budget: 35000,
          },
        ]);
      }
    }

    const campaigns = await Campaign.find(query)
      .sort({ boostedCommissionRate: -1, createdAt: -1 })
      .populate("sellerId", "name email")
      .populate("products", "name price images category stock");

    res.status(200).json(campaigns);
  } catch (error: any) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Server error fetching campaigns", error: error.message });
  }
};

/**
 * @desc    Get single campaign by ID
 * @route   GET /api/campaigns/:id
 * @access  Public
 */
export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid campaign ID" });
      return;
    }

    const campaign = await Campaign.findById(id)
      .populate("sellerId", "name email")
      .populate("products", "name price images category stock description");

    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    res.status(200).json(campaign);
  } catch (error: any) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ message: "Server error fetching campaign", error: error.message });
  }
};

/**
 * @desc    Get seller's own campaigns
 * @route   GET /api/campaigns/seller/mine
 * @access  Private (Seller/Brand)
 */
export const getSellerCampaigns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const campaigns = await Campaign.find({ sellerId: user._id })
      .sort({ createdAt: -1 })
      .populate("products", "name price images category stock");

    res.status(200).json(campaigns);
  } catch (error: any) {
    console.error("Error fetching seller campaigns:", error);
    res.status(500).json({ message: "Server error fetching seller campaigns" });
  }
};

/**
 * @desc    Update a campaign
 * @route   PATCH /api/campaigns/:id
 * @access  Private (Owner)
 */
export const updateCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const id = req.params.id as string;

    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid campaign ID" });
      return;
    }

    const campaign = await Campaign.findOne({ _id: id, sellerId: user._id });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found or you do not have permission to edit" });
      return;
    }

    const {
      title,
      description,
      boostedCommissionRate,
      startDate,
      endDate,
      products,
      status,
      bannerImage,
      targetNiche,
      budget,
    } = req.body;

    if (title) campaign.title = title.trim();
    if (description !== undefined) campaign.description = description.trim();
    if (boostedCommissionRate) {
      const rate = parseFloat(boostedCommissionRate);
      if (rate >= 1 && rate <= 70) campaign.boostedCommissionRate = rate;
    }
    if (startDate) campaign.startDate = new Date(startDate);
    if (endDate) campaign.endDate = new Date(endDate);
    if (Array.isArray(products)) {
      campaign.products = products
        .filter((p: string) => mongoose.Types.ObjectId.isValid(p))
        .map((p: string) => new mongoose.Types.ObjectId(p));
    }
    if (status) campaign.status = status;
    if (bannerImage !== undefined) campaign.bannerImage = bannerImage;
    if (targetNiche) campaign.targetNiche = targetNiche;
    if (budget !== undefined) campaign.budget = Number(budget);

    await campaign.save();

    const updated = await Campaign.findById(campaign._id)
      .populate("products", "name price images category stock")
      .populate("sellerId", "name email");

    res.status(200).json({ message: "Campaign updated successfully", campaign: updated });
  } catch (error: any) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ message: "Server error updating campaign", error: error.message });
  }
};

/**
 * @desc    Delete a campaign
 * @route   DELETE /api/campaigns/:id
 * @access  Private (Owner)
 */
export const deleteCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const id = req.params.id as string;

    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid campaign ID" });
      return;
    }

    const campaign = await Campaign.findOneAndDelete({ _id: id, sellerId: user._id });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found or you do not have permission to delete" });
      return;
    }

    res.status(200).json({ message: "Campaign deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ message: "Server error deleting campaign" });
  }
};
