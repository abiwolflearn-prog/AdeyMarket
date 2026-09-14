import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth";
import PartnershipAgreement, {
  IPartnershipAgreementDoc,
  generateAffiliateTrackingCode,
} from "../models/PartnershipAgreement";
import CampaignApplication from "../models/CampaignApplication";
import Campaign from "../models/Campaign";
import User from "../models/User";

/**
 * @desc    Get all agreements relevant to the authenticated user
 * @route   GET /api/agreements
 * @access  Private (Brand or Creator)
 */
export const getAgreements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { status } = req.query;
    const filter: any = {};

    if (user.role === "brand") {
      filter.companyId = user._id;
    } else if (user.role === "creator") {
      filter.creatorId = user._id;
    } else {
      res.status(403).json({ message: "Role not authorized to view agreements" });
      return;
    }

    if (status && typeof status === "string") {
      filter.status = status;
    }

    const agreements = await PartnershipAgreement.find(filter)
      .sort({ updatedAt: -1 })
      .populate("campaignId", "title boostedCommissionRate status startDate endDate bannerImage products")
      .populate("companyId", "name email phone")
      .populate("creatorId", "name email phone")
      .populate("products", "name price images category stock");

    res.status(200).json(agreements);
  } catch (error: any) {
    console.error("Error fetching agreements:", error);
    res.status(500).json({ message: "Server error fetching agreements", error: error.message });
  }
};

/**
 * @desc    Get single agreement by ID
 * @route   GET /api/agreements/:id
 * @access  Private (Company owner, Assigned creator, or Admin)
 */
export const getAgreementById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const agreementId = req.params.id as string;
    if (!agreementId || !mongoose.Types.ObjectId.isValid(agreementId)) {
      res.status(400).json({ message: "Invalid agreement ID" });
      return;
    }

    const agreement = await PartnershipAgreement.findById(agreementId)
      .populate("campaignId", "title boostedCommissionRate status startDate endDate bannerImage products")
      .populate("companyId", "name email phone")
      .populate("creatorId", "name email phone")
      .populate("products", "name price images category stock");

    if (!agreement) {
      res.status(404).json({ message: "Agreement not found" });
      return;
    }

    // Authorization rule: Company can manage only its own agreements; Creator can view only agreements assigned to them
    const isCompany = agreement.companyId._id
      ? agreement.companyId._id.toString() === user._id.toString()
      : agreement.companyId.toString() === user._id.toString();

    const isCreator = agreement.creatorId._id
      ? agreement.creatorId._id.toString() === user._id.toString()
      : agreement.creatorId.toString() === user._id.toString();

    if (!isCompany && !isCreator) {
      res.status(403).json({ message: "You are not authorized to view this agreement" });
      return;
    }

    res.status(200).json(agreement);
  } catch (error: any) {
    console.error("Error fetching agreement:", error);
    res.status(500).json({ message: "Server error fetching agreement", error: error.message });
  }
};

/**
 * @desc    Company creates a new partnership agreement proposal directly
 * @route   POST /api/agreements
 * @access  Private (Brand / Company)
 */
export const createAgreement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (user.role !== "brand") {
      res.status(403).json({ message: "Only company accounts can initiate partnership agreements" });
      return;
    }

    const {
      campaignId,
      creatorId,
      applicationId,
      commissionRate,
      products,
      startDate,
      endDate,
      paymentRules,
      cancellationRules,
      companyAccepted = true, // By default company approves and accepts their proposal terms
    } = req.body;

    if (!campaignId || !creatorId) {
      res.status(400).json({ message: "campaignId and creatorId are required" });
      return;
    }

    // Verify campaign ownership
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    if (campaign.sellerId.toString() !== user._id.toString()) {
      res.status(403).json({ message: "You can only create agreements for your own campaigns" });
      return;
    }

    // Verify creator exists
    const creator = await User.findById(creatorId);
    if (!creator || creator.role !== "creator") {
      res.status(400).json({ message: "Target user must be a valid creator account" });
      return;
    }

    const rate = Number(commissionRate) || campaign.boostedCommissionRate || 10;
    const isCompanyAccepting = Boolean(companyAccepted);

    const agreement = new PartnershipAgreement({
      companyId: user._id,
      creatorId,
      campaignId,
      applicationId: applicationId || undefined,
      commissionRate: rate,
      products: Array.isArray(products) && products.length > 0 ? products : campaign.products || [],
      startDate: startDate ? new Date(startDate) : campaign.startDate || new Date(),
      endDate: endDate ? new Date(endDate) : campaign.endDate,
      paymentRules:
        paymentRules?.trim() ||
        "Arifpay escrow protection applies to all orders. Commission payouts are released upon confirmed customer delivery. Standard 5% platform service fee applies.",
      cancellationRules:
        cancellationRules?.trim() ||
        "Either party may terminate this agreement with written notice prior to campaign completion. Delivered orders prior to termination are honored for payout.",
      companyAccepted: isCompanyAccepting,
      companyAcceptedAt: isCompanyAccepting ? new Date() : undefined,
      creatorAccepted: false,
      creatorAcceptedAt: undefined,
      status: isCompanyAccepting ? "pending_creator_acceptance" : "pending_company_acceptance",
      affiliateCode: undefined, // Strictly no tracking credentials until BOTH sides accept!
    });

    await agreement.save();

    // If linked to an application, update the application record
    if (applicationId) {
      const app = await CampaignApplication.findById(applicationId);
      if (app) {
        app.agreementId = agreement._id as any;
        app.status = "approved";
        app.partnershipAgreement = {
          status: agreement.status as any,
          agreedCommissionRate: agreement.commissionRate,
          agreementTerms: `${agreement.paymentRules} ${agreement.cancellationRules}`,
          affiliateCode: "", // Empty string until active!
          approvedAt: new Date(),
          agreementId: agreement._id as any,
        };
        await app.save();
      }
    }

    const populated = await PartnershipAgreement.findById(agreement._id)
      .populate("campaignId", "title boostedCommissionRate status startDate endDate bannerImage products")
      .populate("companyId", "name email phone")
      .populate("creatorId", "name email phone")
      .populate("products", "name price images category stock");

    res.status(201).json({
      message: "Partnership agreement proposal created successfully",
      agreement: populated,
    });
  } catch (error: any) {
    console.error("Error creating agreement:", error);
    res.status(500).json({ message: "Server error creating agreement", error: error.message });
  }
};

/**
 * @desc    Accept partnership agreement (Company or Creator)
 * @route   PATCH /api/agreements/:id/accept
 * @access  Private (Company or Creator assigned to the agreement)
 */
export const acceptAgreement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const agreementId = req.params.id as string;
    if (!agreementId || !mongoose.Types.ObjectId.isValid(agreementId)) {
      res.status(400).json({ message: "Invalid agreement ID" });
      return;
    }

    const agreement = await PartnershipAgreement.findById(agreementId);
    if (!agreement) {
      res.status(404).json({ message: "Agreement not found" });
      return;
    }

    const isCompany = agreement.companyId.toString() === user._id.toString();
    const isCreator = agreement.creatorId.toString() === user._id.toString();

    if (!isCompany && !isCreator) {
      res.status(403).json({
        message: "You are not an authorized party to accept this agreement",
      });
      return;
    }

    // Guard: Prevent acceptance on non-pending statuses (rejected, terminated, expired)
    if (agreement.status === "rejected") {
      res.status(400).json({
        message: "Cannot accept an agreement that has been rejected",
      });
      return;
    }

    if (agreement.status === "terminated") {
      res.status(400).json({
        message: "Cannot accept an agreement that has been terminated",
      });
      return;
    }

    if (agreement.status === "expired" || (agreement.endDate && new Date() > agreement.endDate)) {
      agreement.status = "expired";
      await agreement.save();
      res.status(400).json({
        message: "Cannot accept an agreement that has expired",
      });
      return;
    }

    const now = new Date();

    if (isCompany) {
      // Company can manage only its own agreements & cannot modify creator's acceptance
      if (agreement.companyAccepted) {
        res.status(400).json({ message: "Company has already accepted this agreement" });
        return;
      }
      agreement.companyAccepted = true;
      agreement.companyAcceptedAt = now;
    } else if (isCreator) {
      // Creator can accept only agreements assigned to them & cannot modify company's acceptance
      if (agreement.creatorAccepted) {
        res.status(400).json({ message: "Creator has already accepted this agreement" });
        return;
      }
      agreement.creatorAccepted = true;
      agreement.creatorAcceptedAt = now;
    }

    // Lifecycle check: An agreement cannot become ACTIVE until both sides accept!
    if (agreement.companyAccepted && agreement.creatorAccepted) {
      agreement.status = "active";

      // Affiliate tracking credentials may ONLY then be generated
      if (!agreement.affiliateCode) {
        const campaign = await Campaign.findById(agreement.campaignId);
        const campaignTitle = campaign?.title || "CAMP";
        const creatorSuffix = agreement.creatorId.toString().slice(-4).toUpperCase();
        agreement.affiliateCode = generateAffiliateTrackingCode(campaignTitle, creatorSuffix);
      }
    } else if (agreement.companyAccepted && !agreement.creatorAccepted) {
      agreement.status = "pending_creator_acceptance";
      agreement.affiliateCode = undefined;
    } else if (!agreement.companyAccepted && agreement.creatorAccepted) {
      agreement.status = "pending_company_acceptance";
      agreement.affiliateCode = undefined;
    }

    await agreement.save();

    // If linked to an application, sync the state
    if (agreement.applicationId) {
      const app = await CampaignApplication.findById(agreement.applicationId);
      if (app) {
        app.partnershipAgreement = {
          status: agreement.status as any,
          agreedCommissionRate: agreement.commissionRate,
          agreementTerms: `${agreement.paymentRules} ${agreement.cancellationRules}`,
          affiliateCode: agreement.status === "active" ? (agreement.affiliateCode || "") : "",
          approvedAt: agreement.companyAcceptedAt || new Date(),
          agreementId: agreement._id as any,
        };
        await app.save();
      }
    }

    const populated = await PartnershipAgreement.findById(agreement._id)
      .populate("campaignId", "title boostedCommissionRate status startDate endDate bannerImage products")
      .populate("companyId", "name email phone")
      .populate("creatorId", "name email phone")
      .populate("products", "name price images category stock");

    res.status(200).json({
      message:
        agreement.status === "active"
          ? "Agreement fully accepted by both parties! Partnership is now ACTIVE and tracking credentials are generated."
          : `Acceptance recorded. Waiting for ${!agreement.companyAccepted ? "company" : "creator"} acceptance.`,
      agreement: populated,
    });
  } catch (error: any) {
    console.error("Error accepting agreement:", error);
    res.status(500).json({ message: "Server error accepting agreement", error: error.message });
  }
};

/**
 * @desc    Reject partnership agreement proposal (Company or Creator)
 * @route   PATCH /api/agreements/:id/reject
 * @access  Private (Company or Creator assigned to the agreement)
 */
export const rejectAgreement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const agreementId = req.params.id as string;
    if (!agreementId || !mongoose.Types.ObjectId.isValid(agreementId)) {
      res.status(400).json({ message: "Invalid agreement ID" });
      return;
    }

    const agreement = await PartnershipAgreement.findById(agreementId);
    if (!agreement) {
      res.status(404).json({ message: "Agreement not found" });
      return;
    }

    const isCompany = agreement.companyId.toString() === user._id.toString();
    const isCreator = agreement.creatorId.toString() === user._id.toString();

    if (!isCompany && !isCreator) {
      res.status(403).json({ message: "You are not an authorized party to reject this agreement" });
      return;
    }

    // Guard: Cannot reject an already active agreement (must terminate instead)
    if (agreement.status === "active") {
      res.status(400).json({
        message: "Agreement is already active. Use the termination procedure instead of rejection.",
      });
      return;
    }

    if (agreement.status === "rejected" || agreement.status === "terminated") {
      res.status(400).json({ message: `Agreement is already ${agreement.status}` });
      return;
    }

    const { reason } = req.body;
    agreement.status = "rejected";
    agreement.rejectionReason = reason?.trim() || "Agreement rejected by participant";
    agreement.rejectedBy = user._id as any;
    agreement.rejectedAt = new Date();
    agreement.affiliateCode = undefined; // Rejected agreements CANNOT generate credentials

    await agreement.save();

    // Sync with application if exists
    if (agreement.applicationId) {
      const app = await CampaignApplication.findById(agreement.applicationId);
      if (app) {
        app.status = "rejected";
        app.reviewNotes = agreement.rejectionReason;
        if (app.partnershipAgreement) {
          app.partnershipAgreement.status = "rejected";
          app.partnershipAgreement.affiliateCode = "";
        }
        await app.save();
      }
    }

    res.status(200).json({
      message: "Agreement rejected",
      agreement,
    });
  } catch (error: any) {
    console.error("Error rejecting agreement:", error);
    res.status(500).json({ message: "Server error rejecting agreement", error: error.message });
  }
};

/**
 * @desc    Terminate an active partnership agreement
 * @route   PATCH /api/agreements/:id/terminate
 * @access  Private (Company or Creator assigned to the agreement)
 */
export const terminateAgreement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const agreementId = req.params.id as string;
    if (!agreementId || !mongoose.Types.ObjectId.isValid(agreementId)) {
      res.status(400).json({ message: "Invalid agreement ID" });
      return;
    }

    const agreement = await PartnershipAgreement.findById(agreementId);
    if (!agreement) {
      res.status(404).json({ message: "Agreement not found" });
      return;
    }

    const isCompany = agreement.companyId.toString() === user._id.toString();
    const isCreator = agreement.creatorId.toString() === user._id.toString();

    if (!isCompany && !isCreator) {
      res.status(403).json({ message: "You are not an authorized party to terminate this agreement" });
      return;
    }

    if (agreement.status !== "active") {
      res.status(400).json({
        message: `Only active agreements can be terminated. Current status: ${agreement.status}`,
      });
      return;
    }

    const { reason } = req.body;
    agreement.status = "terminated";
    agreement.terminationReason = reason?.trim() || "Agreement terminated by participant";
    agreement.terminatedBy = user._id as any;
    agreement.terminatedAt = new Date();

    await agreement.save();

    // Sync with application if exists
    if (agreement.applicationId) {
      const app = await CampaignApplication.findById(agreement.applicationId);
      if (app && app.partnershipAgreement) {
        app.partnershipAgreement.status = "terminated";
        await app.save();
      }
    }

    res.status(200).json({
      message: "Partnership agreement terminated",
      agreement,
    });
  } catch (error: any) {
    console.error("Error terminating agreement:", error);
    res.status(500).json({ message: "Server error terminating agreement", error: error.message });
  }
};

/**
 * @desc    Generate or fetch affiliate tracking credentials
 * @route   GET /api/agreements/:id/credentials
 * @access  Private (Assigned Creator or Company)
 */
export const getAgreementCredentials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const agreementId = req.params.id as string;
    if (!agreementId || !mongoose.Types.ObjectId.isValid(agreementId)) {
      res.status(400).json({ message: "Invalid agreement ID" });
      return;
    }

    const agreement = await PartnershipAgreement.findById(agreementId)
      .populate("campaignId", "title boostedCommissionRate products")
      .populate("products", "_id name price images");

    if (!agreement) {
      res.status(404).json({ message: "Agreement not found" });
      return;
    }

    const isCompany = agreement.companyId.toString() === user._id.toString();
    const isCreator = agreement.creatorId.toString() === user._id.toString();

    if (!isCompany && !isCreator) {
      res.status(403).json({ message: "Not authorized to access these credentials" });
      return;
    }

    // STRICT GUARD: Rejected / expired / pending agreements CANNOT generate affiliate credentials
    if (agreement.status !== "active") {
      res.status(400).json({
        message: `Affiliate credentials cannot be generated or accessed. Agreement status is '${agreement.status}'. Both company and creator must accept to make the agreement ACTIVE.`,
      });
      return;
    }

    if (!agreement.companyAccepted || !agreement.creatorAccepted) {
      res.status(400).json({
        message: "Agreement cannot generate affiliate credentials until both sides have accepted",
      });
      return;
    }

    if (!agreement.affiliateCode) {
      const campaign = agreement.campaignId as any;
      const campaignTitle = campaign?.title || "CAMP";
      const creatorSuffix = agreement.creatorId.toString().slice(-4).toUpperCase();
      agreement.affiliateCode = generateAffiliateTrackingCode(campaignTitle, creatorSuffix);
      await agreement.save();
    }

    const campaign = agreement.campaignId as any;
    const products = agreement.products as any[];
    const baseUrl = process.env.CLIENT_URL || "https://adeymarket.vercel.app";

    const productLinks = products.map((prod: any) => ({
      productId: prod._id,
      productName: prod.name,
      price: prod.price,
      commissionRate: agreement.commissionRate,
      estimatedEarning: Math.round((prod.price * agreement.commissionRate) / 100),
      trackingUrl: `${baseUrl}/product/${prod._id}?ref=${agreement.creatorId}&code=${agreement.affiliateCode}`,
    }));

    res.status(200).json({
      affiliateCode: agreement.affiliateCode,
      campaignId: campaign?._id,
      campaignTitle: campaign?.title,
      commissionRate: agreement.commissionRate,
      creatorId: agreement.creatorId,
      productLinks,
    });
  } catch (error: any) {
    console.error("Error fetching agreement credentials:", error);
    res.status(500).json({ message: "Server error fetching credentials", error: error.message });
  }
};
