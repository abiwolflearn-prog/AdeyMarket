import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import CampaignApplication from "../models/CampaignApplication";
import PartnershipAgreement from "../models/PartnershipAgreement";
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

/**
 * @desc    Apply to a campaign as a creator
 * @route   POST /api/campaigns/:id/apply
 * @access  Private (Creator)
 */
export const applyToCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (user.role !== "creator") {
      res.status(403).json({ message: "Only creators can apply to campaigns" });
      return;
    }

    const campaignId = req.params.id as string;
    if (!campaignId || !mongoose.Types.ObjectId.isValid(campaignId)) {
      res.status(400).json({ message: "Invalid campaign ID" });
      return;
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    if (campaign.status === "ended") {
      res.status(400).json({ message: "Cannot apply to an ended campaign" });
      return;
    }

    // Company/Seller cannot apply to their own campaign
    if (campaign.sellerId.toString() === user._id.toString()) {
      res.status(400).json({ message: "You cannot apply to your own campaign" });
      return;
    }

    const { pitchMessage, channels, estimatedAudience } = req.body;
    if (!pitchMessage || !pitchMessage.trim()) {
      res.status(400).json({ message: "Please provide a pitch or collaboration proposal" });
      return;
    }

    // Check if creator has already applied
    const existingApplication = await CampaignApplication.findOne({
      campaignId: campaign._id,
      creatorId: user._id,
    });

    if (existingApplication) {
      res.status(400).json({
        message: "You have already applied to this campaign",
        application: existingApplication,
      });
      return;
    }

    // Process channels array safely
    const formattedChannels = Array.isArray(channels) && channels.length > 0
      ? channels.map((c: string) => String(c).trim()).filter(Boolean)
      : ["Social Media"];

    // IMPORTANT: No affiliate code or tracking link generated at application time!
    const application = await CampaignApplication.create({
      campaignId: campaign._id,
      companyId: campaign.sellerId,
      creatorId: user._id,
      status: "pending",
      pitchMessage: pitchMessage.trim(),
      channels: formattedChannels,
      estimatedAudience: estimatedAudience ? String(estimatedAudience).trim() : "",
    });

    const populated = await CampaignApplication.findById(application._id)
      .populate("campaignId", "title boostedCommissionRate status endDate")
      .populate("creatorId", "name email");

    res.status(201).json({
      message: "Application submitted successfully. Awaiting company review.",
      application: populated,
    });
  } catch (error: any) {
    console.error("Error applying to campaign:", error);
    res.status(500).json({ message: "Server error submitting application", error: error.message });
  }
};

/**
 * @desc    Get applications for a specific campaign (Company view)
 * @route   GET /api/campaigns/:id/applications
 * @access  Private (Campaign Owner Company / Admin)
 */
export const getCampaignApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const campaignId = req.params.id as string;
    if (!campaignId || !mongoose.Types.ObjectId.isValid(campaignId)) {
      res.status(400).json({ message: "Invalid campaign ID" });
      return;
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    // Company can manage applications only for campaigns they own
    if (campaign.sellerId.toString() !== user._id.toString()) {
      res.status(403).json({ message: "You can only view applications for campaigns you own" });
      return;
    }

    const applications = await CampaignApplication.find({ campaignId: campaign._id })
      .sort({ createdAt: -1 })
      .populate("creatorId", "name email");

    res.status(200).json(applications);
  } catch (error: any) {
    console.error("Error fetching campaign applications:", error);
    res.status(500).json({ message: "Server error fetching applications" });
  }
};

/**
 * @desc    Get all applications across all campaigns owned by company
 * @route   GET /api/campaigns/company/applications
 * @access  Private (Brand / Admin)
 */
export const getCompanyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (user.role !== "brand") {
      res.status(403).json({ message: "Only company accounts can access company applications" });
      return;
    }

    const applications = await CampaignApplication.find({ companyId: user._id })
      .sort({ createdAt: -1 })
      .populate("campaignId", "title boostedCommissionRate status startDate endDate products")
      .populate("creatorId", "name email");

    res.status(200).json(applications);
  } catch (error: any) {
    console.error("Error fetching company applications:", error);
    res.status(500).json({ message: "Server error fetching applications" });
  }
};

/**
 * @desc    Get all applications submitted by the logged-in creator
 * @route   GET /api/campaigns/creator/applications
 * @access  Private (Creator)
 */
export const getCreatorApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const applications = await CampaignApplication.find({ creatorId: user._id })
      .sort({ createdAt: -1 })
      .populate("campaignId", "title boostedCommissionRate status startDate endDate bannerImage products")
      .populate("companyId", "name email");

    res.status(200).json(applications);
  } catch (error: any) {
    console.error("Error fetching creator applications:", error);
    res.status(500).json({ message: "Server error fetching applications" });
  }
};

/**
 * @desc    Get creator's own application status for a specific campaign
 * @route   GET /api/campaigns/:id/my-application
 * @access  Private (Creator)
 */
export const getMyCampaignApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const campaignId = req.params.id as string;
    if (!campaignId || !mongoose.Types.ObjectId.isValid(campaignId)) {
      res.status(400).json({ message: "Invalid campaign ID" });
      return;
    }

    const application = await CampaignApplication.findOne({
      campaignId,
      creatorId: user._id,
    }).populate("campaignId", "title boostedCommissionRate status");

    if (!application) {
      res.status(200).json({ applied: false, application: null });
      return;
    }

    res.status(200).json({ applied: true, application });
  } catch (error: any) {
    console.error("Error fetching application status:", error);
    res.status(500).json({ message: "Server error checking application status" });
  }
};

/**
 * @desc    Review (Approve or Reject) a creator campaign application
 * @route   PATCH /api/campaigns/applications/:applicationId/review
 * @access  Private (Campaign Owner Company / Admin)
 */
export const reviewCampaignApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    // Creators cannot approve applications
    if (user.role === "creator") {
      res.status(403).json({ message: "Creators cannot approve or reject applications" });
      return;
    }

    const applicationId = req.params.applicationId as string;
    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
      res.status(400).json({ message: "Invalid application ID" });
      return;
    }

    const application = await CampaignApplication.findById(applicationId);
    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    // Creator cannot approve themselves
    if (application.creatorId.toString() === user._id.toString()) {
      res.status(403).json({ message: "You cannot review your own application" });
      return;
    }

    // Company cannot manage another company's applications
    if (application.companyId.toString() !== user._id.toString()) {
      res.status(403).json({ message: "You cannot manage another company's applications" });
      return;
    }

    const { status, reviewNotes, agreedCommissionRate } = req.body;
    if (!status || !["approved", "rejected"].includes(status)) {
      res.status(400).json({ message: "Status must be either 'approved' or 'rejected'" });
      return;
    }

    if (status === "approved") {
      // Fetch associated campaign for commission rate and details
      const campaign = await Campaign.findById(application.campaignId);
      const commissionRate =
        agreedCommissionRate && !isNaN(Number(agreedCommissionRate))
          ? Number(agreedCommissionRate)
          : campaign?.boostedCommissionRate || 15;

      const paymentRules =
        "Arifpay escrow protection applies to all orders. Commission payouts are released upon confirmed customer delivery. Standard 5% platform service fee applies.";
      const cancellationRules =
        "Either party may terminate this agreement with written notice prior to campaign completion. Delivered orders prior to termination are honored for payout.";

      // Create formal partnership agreement
      // Lifecycle Stage: Company approves & accepts -> Agreement created -> Pending Creator Acceptance
      // STRICT: No affiliate tracking credentials generated until creator ALSO accepts!
      const agreement = new PartnershipAgreement({
        companyId: application.companyId,
        creatorId: application.creatorId,
        campaignId: application.campaignId,
        applicationId: application._id,
        commissionRate,
        products: campaign?.products || [],
        startDate: campaign?.startDate || new Date(),
        endDate: campaign?.endDate,
        paymentRules,
        cancellationRules,
        companyAccepted: true,
        companyAcceptedAt: new Date(),
        creatorAccepted: false,
        creatorAcceptedAt: undefined,
        status: "pending_creator_acceptance",
        affiliateCode: undefined, // Zero credentials until both sides accept!
      });

      await agreement.save();

      application.status = "approved";
      application.reviewedAt = new Date();
      application.reviewNotes =
        reviewNotes?.trim() || "Application approved. Partnership agreement established and pending creator acceptance.";
      application.agreementId = agreement._id as any;
      application.partnershipAgreement = {
        status: "pending_creator_acceptance",
        agreedCommissionRate: commissionRate,
        agreementTerms: `${paymentRules} ${cancellationRules}`,
        affiliateCode: "", // No affiliate code until active!
        approvedAt: new Date(),
        agreementId: agreement._id as any,
      };
    } else {
      application.status = "rejected";
      application.reviewedAt = new Date();
      application.reviewNotes = reviewNotes?.trim() || "Application not accepted at this time.";
      application.partnershipAgreement = undefined;

      if (application.agreementId) {
        await PartnershipAgreement.findByIdAndUpdate(application.agreementId, {
          status: "rejected",
          rejectionReason: application.reviewNotes,
          rejectedBy: user._id,
          rejectedAt: new Date(),
          affiliateCode: undefined,
        });
      }
    }

    await application.save();

    const updated = await CampaignApplication.findById(application._id)
      .populate("campaignId", "title boostedCommissionRate status startDate endDate products")
      .populate("creatorId", "name email")
      .populate("companyId", "name email")
      .populate("agreementId");

    res.status(200).json({
      message:
        status === "approved"
          ? "Application approved and partnership agreement created! Awaiting creator acceptance."
          : "Application rejected.",
      application: updated,
    });
  } catch (error: any) {
    console.error("Error reviewing campaign application:", error);
    res.status(500).json({ message: "Server error reviewing application", error: error.message });
  }
};

/**
 * @desc    Get partnership agreements for company
 * @route   GET /api/campaigns/company/agreements
 * @access  Private (Brand / Admin)
 */
export const getCompanyAgreements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const agreements = await PartnershipAgreement.find({
      companyId: user._id,
    })
      .sort({ updatedAt: -1 })
      .populate("campaignId", "title boostedCommissionRate status products bannerImage startDate endDate")
      .populate("creatorId", "name email")
      .populate("products", "name price images category stock");

    res.status(200).json(agreements);
  } catch (error: any) {
    console.error("Error fetching company agreements:", error);
    res.status(500).json({ message: "Server error fetching agreements" });
  }
};

/**
 * @desc    Get partnership agreements for creator
 * @route   GET /api/campaigns/creator/agreements
 * @access  Private (Creator)
 */
export const getCreatorAgreements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const agreements = await PartnershipAgreement.find({
      creatorId: user._id,
    })
      .sort({ updatedAt: -1 })
      .populate("campaignId", "title boostedCommissionRate status products bannerImage startDate endDate")
      .populate("companyId", "name email")
      .populate("products", "name price images category stock");

    res.status(200).json(agreements);
  } catch (error: any) {
    console.error("Error fetching creator agreements:", error);
    res.status(500).json({ message: "Server error fetching agreements" });
  }
};

