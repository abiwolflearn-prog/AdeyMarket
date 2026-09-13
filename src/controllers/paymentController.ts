import { Request, Response } from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction";
import Order from "../models/Order";
import { AuthRequest } from "../middleware/auth";

/**
 * Helper to compute real-time balances
 * Differentiates between:
 * - pendingBalance: earnings from in-transit / unconfirmed orders (pending, processing, shipped)
 * - availableBalance: cleared earnings from completed (delivered) orders minus withdrawals
 * - totalEarned: lifetime cleared earnings from delivered orders
 */
export const calculateUserFinancials = async (userId: mongoose.Types.ObjectId | string) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return {
      totalEarned: 0,
      sellerEarnings: 0,
      affiliateEarnings: 0,
      pendingBalance: 0,
      pendingSellerEarnings: 0,
      pendingAffiliateEarnings: 0,
      totalWithdrawn: 0,
      availableBalance: 0,
    };
  }

  const uid = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  // 1. Cleared Seller earnings from delivered orders (payment must not be failed)
  // Existing escrow behavior: seller earnings cleared once order is delivered
  const deliveredSellerOrders = await Order.find({
    sellerId: uid,
    orderStatus: "delivered",
    paymentStatus: { $ne: "failed" },
  });
  const sellerEarnings = deliveredSellerOrders.reduce((sum, o) => sum + (o.sellerPayout || 0), 0);

  // 2. Cleared Creator referral earnings:
  // Must be delivered, payment not failed, not cancelled, and:
  // EITHER commissionStatus === "confirmed" OR return window has completed (returnWindowEndsAt <= now)
  const payableAffiliateOrders = await Order.find({
    referrerId: uid,
    orderStatus: "delivered",
    paymentStatus: { $ne: "failed" },
    commissionStatus: { $ne: "cancelled" },
    $or: [
      { commissionStatus: "confirmed" },
      { returnWindowEndsAt: { $lte: now } },
      { returnWindowEndsAt: { $exists: false } },
    ],
  });
  const affiliateEarnings = payableAffiliateOrders.reduce((sum, o) => sum + (o.referrerCommission || 0), 0);

  const totalEarned = Math.round((sellerEarnings + affiliateEarnings) * 100) / 100;

  // 3. Pending/Escrow Seller earnings (orders currently in transit: pending, processing, shipped)
  const pendingSellerOrders = await Order.find({
    sellerId: uid,
    orderStatus: { $in: ["pending", "processing", "shipped"] },
    paymentStatus: { $ne: "failed" },
  });
  const pendingSellerEarnings = pendingSellerOrders.reduce((sum, o) => sum + (o.sellerPayout || 0), 0);

  // 4. Pending/Escrow Creator referral earnings:
  // In transit (pending, processing, shipped), OR delivered but return/cancellation window still open
  const pendingAffiliateOrders = await Order.find({
    referrerId: uid,
    paymentStatus: { $ne: "failed" },
    orderStatus: { $in: ["pending", "processing", "shipped", "delivered"] },
    commissionStatus: { $nin: ["confirmed", "cancelled"] },
    $or: [
      { orderStatus: { $in: ["pending", "processing", "shipped"] } },
      {
        orderStatus: "delivered",
        returnWindowEndsAt: { $gt: now },
      },
    ],
  });
  const pendingAffiliateEarnings = pendingAffiliateOrders.reduce((sum, o) => sum + (o.referrerCommission || 0), 0);

  const pendingBalance = Math.round((pendingSellerEarnings + pendingAffiliateEarnings) * 100) / 100;

  // 5. Lifetime completed / non-failed withdrawals
  const payouts = await Transaction.find({
    userId: uid,
    type: "payout",
    status: { $ne: "failed" },
  });
  const totalWithdrawn = Math.round(payouts.reduce((sum, p) => sum + (p.amount || 0), 0) * 100) / 100;

  // Available balance is cleared delivered earnings minus total withdrawn
  const availableBalance = Math.max(0, Math.round((totalEarned - totalWithdrawn) * 100) / 100);

  return {
    totalEarned,
    sellerEarnings: Math.round(sellerEarnings * 100) / 100,
    affiliateEarnings: Math.round(affiliateEarnings * 100) / 100,
    pendingBalance,
    pendingSellerEarnings: Math.round(pendingSellerEarnings * 100) / 100,
    pendingAffiliateEarnings: Math.round(pendingAffiliateEarnings * 100) / 100,
    totalWithdrawn,
    availableBalance,
  };
};

/**
 * @desc    Initiate Arifpay payment session for an order
 * @route   POST /api/payments/initiate
 * @access  Public / Authenticated
 */
export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, phone, email } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "Valid orderId is required" });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const reference = `ARIF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create a pending transaction record
    await Transaction.create({
      userId: order.sellerId,
      orderId: order._id,
      type: "payment",
      amount: order.totalAmount,
      currency: "ETB",
      method: "arifpay",
      status: "pending",
      reference,
      notes: `Arifpay checkout session for order ${order.orderNumber}`,
    });

    // In production, you make a POST call to Arifpay API:
    // https://api.arifpay.net/checkout/session
    // For local dev / testing, return direct gateway simulation URL
    const paymentUrl = `/checkout/arifpay-sim?ref=${reference}&orderId=${order._id}&amount=${order.totalAmount}`;

    res.status(200).json({
      message: "Payment initiated",
      reference,
      paymentUrl,
      orderId: order._id,
      amount: order.totalAmount,
    });
  } catch (error: any) {
    console.error("Error initiating payment:", error);
    res.status(500).json({ message: "Server error initiating payment", error: error.message });
  }
};

/**
 * @desc    Webhook / confirmation for Arifpay payment
 * @route   POST /api/payments/webhook
 * @access  Public
 */
export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference, orderId, status = "completed" } = req.body;

    if (!reference && !orderId) {
      res.status(400).json({ message: "Reference or orderId required" });
      return;
    }

    let transaction = null;
    if (reference) {
      transaction = await Transaction.findOne({ reference });
    } else if (orderId) {
      transaction = await Transaction.findOne({ orderId, type: "payment" });
    }

    let targetOrderId = orderId || transaction?.orderId;
    if (targetOrderId) {
      const order = await Order.findById(targetOrderId);
      if (order) {
        order.paymentStatus = status === "completed" ? "paid" : "failed";
        order.orderStatus = "processing";
        await order.save();
      }
    }

    if (transaction) {
      transaction.status = status === "completed" ? "completed" : "failed";
      await transaction.save();
    }

    res.status(200).json({ message: "Payment processed successfully", status });
  } catch (error: any) {
    console.error("Error processing payment webhook:", error);
    res.status(500).json({ message: "Webhook error", error: error.message });
  }
};

/**
 * @desc    Request withdrawal / payout (Telebirr or Ethiopian Bank Transfer)
 * @route   POST /api/payments/withdraw
 * @access  Private (Creator or Brand)
 */
export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { amount, payoutType, phoneNumber, bankName, accountNumber, accountHolderName } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ message: "Please provide a valid withdrawal amount" });
      return;
    }

    if (parsedAmount < 100) {
      res.status(400).json({ message: "Minimum withdrawal amount is ETB 100" });
      return;
    }

    // Validate account details
    if (payoutType === "telebirr") {
      if (!phoneNumber || !accountHolderName) {
        res.status(400).json({ message: "Telebirr phone number and account name are required" });
        return;
      }
    } else if (payoutType === "bank_transfer") {
      if (!bankName || !accountNumber || !accountHolderName) {
        res.status(400).json({ message: "Bank name, account number, and holder name are required" });
        return;
      }
    } else {
      res.status(400).json({ message: "Invalid payout type. Choose 'telebirr' or 'bank_transfer'" });
      return;
    }

    // Check financial balance
    const financials = await calculateUserFinancials(user._id as mongoose.Types.ObjectId);

    if (parsedAmount > financials.availableBalance) {
      res.status(400).json({
        message: `Insufficient balance. Available to withdraw: ETB ${financials.availableBalance.toLocaleString()}`,
      });
      return;
    }

    const reference = `WD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction = await Transaction.create({
      userId: user._id,
      type: "payout",
      amount: parsedAmount,
      currency: "ETB",
      method: payoutType === "telebirr" ? "telebirr" : "bank_transfer",
      status: "completed", // Instant simulated payout processing for Ethiopia
      reference,
      accountDetails: {
        payoutType,
        phoneNumber: phoneNumber?.trim(),
        bankName: bankName?.trim(),
        accountNumber: accountNumber?.trim(),
        accountHolderName: accountHolderName?.trim(),
      },
      notes: `Withdrawal to ${payoutType === "telebirr" ? `Telebirr (${phoneNumber})` : `${bankName} (${accountNumber})`}`,
    });

    const updatedFinancials = await calculateUserFinancials(user._id as mongoose.Types.ObjectId);

    res.status(201).json({
      message: "Withdrawal processed successfully",
      transaction,
      financials: updatedFinancials,
    });
  } catch (error: any) {
    console.error("Error requesting withdrawal:", error);
    res.status(500).json({ message: "Server error during withdrawal", error: error.message });
  }
};

/**
 * @desc    Get user financial balances
 * @route   GET /api/payments/balance
 * @access  Private
 */
export const getFinancialBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const financials = await calculateUserFinancials(user._id as mongoose.Types.ObjectId);
    res.status(200).json(financials);
  } catch (error: any) {
    console.error("Error fetching balance:", error);
    res.status(200).json({
      totalEarned: 0,
      sellerEarnings: 0,
      affiliateEarnings: 0,
      totalWithdrawn: 0,
      availableBalance: 0,
    });
  }
};

/**
 * @desc    Get user transaction history
 * @route   GET /api/payments/transactions
 * @access  Private
 */
export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate("orderId", "orderNumber totalAmount items");

    res.status(200).json(transactions || []);
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    res.status(200).json([]);
  }
};
