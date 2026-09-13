import { Request, Response } from "express";
import User from "../models/User";
import BrandProfile from "../models/BrandProfile";
import CreatorProfile from "../models/CreatorProfile";
import Campaign from "../models/Campaign";
import PartnershipAgreement from "../models/PartnershipAgreement";
import Order from "../models/Order";
import Transaction from "../models/Transaction";
import { AuthRequest } from "../middleware/auth";

export const getCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companies = await BrandProfile.find().populate("userId", "name email status profilePic");
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const verifyCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    const company = await BrandProfile.findByIdAndUpdate(id, { isApproved }, { new: true });
    if (!company) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getCreators = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creators = await CreatorProfile.find().populate("userId", "name email status profilePic");
    res.json(creators);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (req.user?._id.toString() === id) {
      res.status(400).json({ message: "Cannot modify your own status" });
      return;
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select("-passwordHash");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getCampaigns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campaigns = await Campaign.find().populate("sellerId", "name");
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAgreements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const agreements = await PartnershipAgreement.find()
      .populate("companyId", "name")
      .populate("creatorId", "name");
    res.json(agreements);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate("sellerId", "name")
      .populate("buyerId", "name")
      .populate("referrerId", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const completedOrders = await Order.find({ paymentStatus: "paid", orderStatus: { $nin: ["cancelled", "returned"] } });
    
    const totalGMV = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalPlatformFees = completedOrders.reduce((sum, order) => sum + order.platformFee, 0);
    const totalCreatorCommissions = completedOrders.reduce((sum, order) => sum + order.referrerCommission, 0);
    
    res.json({
      totalGMV,
      totalPlatformFees,
      totalCreatorCommissions,
      orderCount: completedOrders.length
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateTransactionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tx = await Transaction.findByIdAndUpdate(id, { status }, { new: true });
    if (!tx) {
      res.status(404).json({ message: "Transaction not found" });
      return;
    }
    res.json(tx);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const releaseEscrow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    if (order.orderStatus === "delivered") {
      res.status(400).json({ message: "Escrow already released (Order delivered)" });
      return;
    }
    
    if (order.paymentStatus !== "paid") {
      res.status(400).json({ message: "Cannot release escrow for unpaid order" });
      return;
    }

    // Force transition to delivered which releases seller funds
    order.orderStatus = "delivered";
    order.deliveredAt = new Date();
    await order.save();

    // Create payout transaction for seller immediately
    await Transaction.create({
      userId: order.sellerId,
      orderId: order._id,
      type: "payout",
      amount: order.sellerPayout,
      currency: "ETB",
      method: "bank_transfer",
      status: "completed",
      reference: `ESCROW_RELEASE_${order.orderNumber}_${Date.now()}`,
      notes: "Admin manual escrow release",
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
