import express from "express";
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  getSellerCampaigns,
  updateCampaign,
  deleteCampaign,
} from "../controllers/campaignController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// Public routes
router.get("/", getCampaigns);
router.get("/seller/mine", protect, authorize("brand", "admin"), getSellerCampaigns);
router.get("/:id", getCampaignById);

// Brand/Seller protected routes
router.post("/", protect, authorize("brand", "admin"), createCampaign);
router.patch("/:id", protect, authorize("brand", "admin"), updateCampaign);
router.delete("/:id", protect, authorize("brand", "admin"), deleteCampaign);

export default router;
