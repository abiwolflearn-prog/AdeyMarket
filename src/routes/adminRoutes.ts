import express from "express";
import {
  getCompanies,
  verifyCompany,
  getCreators,
  updateUserStatus,
  getCampaigns,
  getAgreements,
  getOrders,
  getMetrics,
  getTransactions,
  updateTransactionStatus,
  releaseEscrow,
} from "../controllers/adminController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// Apply strict admin protection to all routes
router.use(protect, authorize("admin"));

// Company management
router.get("/companies", getCompanies);
router.patch("/companies/:id/verify", verifyCompany);

// Creator management
router.get("/creators", getCreators);

// User management
router.patch("/users/:id/status", updateUserStatus);

// Partnership and Campaigns
router.get("/campaigns", getCampaigns);
router.get("/agreements", getAgreements);

// Orders and Financials
router.get("/orders", getOrders);
router.post("/orders/:id/release-escrow", releaseEscrow);
router.get("/metrics", getMetrics);
router.get("/transactions", getTransactions);
router.patch("/transactions/:id/status", updateTransactionStatus);

export default router;
