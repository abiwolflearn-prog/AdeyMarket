import express from "express";
import {
  getAgreements,
  getAgreementById,
  createAgreement,
  acceptAgreement,
  rejectAgreement,
  terminateAgreement,
  getAgreementCredentials,
} from "../controllers/agreementController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// Base collection endpoints
router.get("/", protect, getAgreements);
router.post("/", protect, authorize("brand", "admin"), createAgreement);

// Specific agreement actions
router.get("/:id", protect, getAgreementById);
router.patch("/:id/accept", protect, acceptAgreement);
router.patch("/:id/reject", protect, rejectAgreement);
router.patch("/:id/terminate", protect, terminateAgreement);
router.get("/:id/credentials", protect, getAgreementCredentials);

export default router;
