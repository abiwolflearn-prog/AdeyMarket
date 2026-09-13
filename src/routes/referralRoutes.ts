import express from "express";
import {
  trackClick,
  getStats,
  getCreatorAnalytics,
  generateAffiliateLink,
  checkProductAffiliateEligibility,
  getMyReferralLinks,
} from "../controllers/referralController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// Public route to track clicks from any visitor (preserves 30-day attribution)
router.post("/track", trackClick);

// Protected routes to generate and check affiliate links under active agreements
router.post("/generate-link", protect, authorize("creator", "brand"), generateAffiliateLink);
router.get("/check-eligibility/:productId", protect, checkProductAffiliateEligibility);
router.get("/my-links", protect, authorize("creator"), getMyReferralLinks);

// Protected route for creators/brands to view their summary stats
router.get("/stats", protect, authorize("brand", "creator"), getStats);

// Protected route for creators to view detailed analytics
router.get("/analytics", protect, authorize("creator"), getCreatorAnalytics);

export default router;


