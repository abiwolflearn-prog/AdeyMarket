import express from "express";
import {
  initiatePayment,
  handlePaymentWebhook,
  requestWithdrawal,
  getFinancialBalance,
  getTransactionHistory,
} from "../controllers/paymentController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// Public payment initiation and webhook
router.post("/initiate", initiatePayment);
router.post("/webhook", handlePaymentWebhook);
router.post("/confirm", handlePaymentWebhook);

// Protected creator & brand payouts & balances
router.post("/withdraw", protect, authorize("creator", "brand"), requestWithdrawal);
router.get("/balance", protect, authorize("creator", "brand"), getFinancialBalance);
router.get("/transactions", protect, authorize("creator", "brand"), getTransactionHistory);

export default router;
