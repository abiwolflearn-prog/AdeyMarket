import express from "express";
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  getSellerCampaigns,
  updateCampaign,
  deleteCampaign,
  applyToCampaign,
  getCampaignApplications,
  getCompanyApplications,
  getCreatorApplications,
  getMyCampaignApplication,
  reviewCampaignApplication,
  getCompanyAgreements,
  getCreatorAgreements,
} from "../controllers/campaignController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// Specific brand & creator endpoints (defined before /:id to avoid param shadowing)
router.get("/seller/mine", protect, authorize("brand", "admin"), getSellerCampaigns);
router.get("/company/applications", protect, authorize("brand", "admin"), getCompanyApplications);
router.get("/company/agreements", protect, authorize("brand", "admin"), getCompanyAgreements);
router.get("/creator/applications", protect, authorize("creator", "admin"), getCreatorApplications);
router.get("/creator/agreements", protect, authorize("creator", "admin"), getCreatorAgreements);

// Application review by company
router.patch("/applications/:applicationId/review", protect, authorize("brand", "admin"), reviewCampaignApplication);

// Public & General Campaign creation
router.get("/", getCampaigns);
router.post("/", protect, authorize("brand", "admin"), createCampaign);

// Single campaign operations
router.get("/:id", getCampaignById);
router.patch("/:id", protect, authorize("brand", "admin"), updateCampaign);
router.delete("/:id", protect, authorize("brand", "admin"), deleteCampaign);

// Campaign specific application endpoints
router.post("/:id/apply", protect, authorize("creator", "admin"), applyToCampaign);
router.get("/:id/my-application", protect, authorize("creator", "admin"), getMyCampaignApplication);
router.get("/:id/applications", protect, authorize("brand", "admin"), getCampaignApplications);

export default router;

