import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderTracking,
  deliverOrder,
  confirmOrderCommission,
  cancelOrder,
} from "../controllers/orderController";
import { protect, optionalProtect } from "../middleware/auth";

const router = express.Router();

// Order creation (guest or authenticated)
router.post("/", optionalProtect, createOrder);

// Get user/seller orders
router.get("/", protect, getOrders);

// Get specific order details
router.get("/:id", optionalProtect, getOrderById);

// Seller adds shipping / tracking number
router.patch("/:id/ship", protect, updateOrderTracking);

// Mark order as delivered (releases seller escrow balance; commission enters return window)
router.patch("/:id/deliver", protect, deliverOrder);

// Confirm affiliate commission upon return/cancellation window completion
router.patch("/:id/confirm-commission", protect, confirmOrderCommission);

// Cancel order and revoke pending affiliate commission
router.patch("/:id/cancel", protect, cancelOrder);

export default router;

