import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderTracking,
  deliverOrder,
} from "../controllers/orderController";
import { protect, optionalProtect } from "../middleware/auth";

const router = express.Router();

// Order creation (guest or authenticated)
router.post("/", optionalProtect, createOrder);

// Get user/seller orders
router.get("/", protect, getOrders);

// Get specific order details
router.get("/:id", getOrderById);

// Seller adds shipping / tracking number
router.patch("/:id/ship", protect, updateOrderTracking);

// Mark order as delivered (releases escrow balance)
router.patch("/:id/deliver", protect, deliverOrder);

export default router;

