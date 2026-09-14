import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import { AuthRequest } from "../middleware/auth";
import Shop from "../models/Shop";
import Product from "../models/Product";
import User from "../models/User";

/**
 * @desc    Get the current user's shop
 * @route   GET /api/shop/me
 * @access  Private (Brand / Creator only)
 */
export const getMyShop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const shop = await Shop.findOne({ ownerId: user._id });
    if (!shop) {
      res.status(404).json({ message: "Shop not found" });
      return;
    }

    res.status(200).json(shop);
  } catch (error: any) {
    console.error("Error in getMyShop:", error);
    res.status(500).json({ message: "Server error while fetching shop" });
  }
};

/**
 * @desc    Upload shop logo to Cloudinary
 * @route   POST /api/shop/logo
 * @access  Private (Brand / Creator only)
 */
export const uploadLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No image file provided" });
      return;
    }

    const shop = await Shop.findOne({ ownerId: user._id });
    if (!shop) {
      res.status(404).json({ message: "Please activate your shop first before uploading a logo." });
      return;
    }

    // Convert buffer to base64 string for Cloudinary upload
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: "shop_logos",
      public_id: `${user._id}_shop_logo`,
      overwrite: true,
      transformation: [{ width: 500, height: 500, crop: "fill" }],
    });

    // Update shop's logo URL
    shop.logo = uploadResponse.secure_url;
    await shop.save();

    res.status(200).json({
      message: "Logo updated successfully",
      logo: shop.logo,
    });
  } catch (error) {
    console.error("Error in uploadLogo:", error);
    res.status(500).json({ message: "Server error while uploading logo" });
  }
};

/**
 * @desc    Activate a shop / set shopSlug for a Brand or Creator
 * @route   POST /api/shop/activate
 * @access  Private (Brand / Creator only)
 */
export const activateShop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (user.role === "consumer") {
      res.status(403).json({ message: "Consumers cannot create shops." });
      return;
    }

    const { shopSlug, description, defaultCommissionRate } = req.body;

    if (!shopSlug) {
      res.status(400).json({ message: "Shop slug is required." });
      return;
    }

    // Check if slug is taken
    const existingShop = await Shop.findOne({ shopSlug });
    if (existingShop && existingShop.ownerId.toString() !== user._id.toString()) {
      res.status(400).json({ message: "This shop slug is already taken." });
      return;
    }

    // Upsert shop
    const shop = await Shop.findOneAndUpdate(
      { ownerId: user._id },
      {
        ownerId: user._id,
        ownerRole: user.role,
        shopSlug: shopSlug.toLowerCase(),
        description: description || "",
        defaultCommissionRate: defaultCommissionRate || 0,
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Shop activated successfully", shop });
  } catch (error: any) {
    console.error("Error in activateShop:", error);
    res.status(500).json({ message: error.message || "Server error while activating shop" });
  }
};

/**
 * @desc    Get public shop by slug
 * @route   GET /api/shop/:slug
 * @access  Public
 */
export const getShopBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    
    const shop = await Shop.findOne({ shopSlug: slug.toLowerCase() })
      .populate("ownerId", "name profilePic role");

    if (!shop) {
      res.status(404).json({ message: "Shop not found" });
      return;
    }

    res.status(200).json(shop);
  } catch (error: any) {
    console.error("Error in getShopBySlug:", error);
    res.status(500).json({ message: "Server error while fetching shop" });
  }
};

/**
 * @desc    Get products for a specific shop
 * @route   GET /api/shop/:slug/products
 * @access  Public
 */
export const getShopProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    
    const shop = await Shop.findOne({ shopSlug: slug.toLowerCase() });

    if (!shop) {
      res.status(404).json({ message: "Shop not found" });
      return;
    }

    // Get all active products for this shop owner
    const products = await Product.find({ 
      sellerId: shop.ownerId,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error: any) {
    console.error("Error in getShopProducts:", error);
    res.status(500).json({ message: "Server error while fetching shop products" });
  }
};

/**
 * @desc    Get directory of all shops
 * @route   GET /api/shop/directory
 * @access  Public
 */
export const getShopDirectory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    let query: any = {};
    if (role && (role === "brand" || role === "creator")) {
      query.ownerRole = role;
    }

    const shops = await Shop.find(query)
      .populate("ownerId", "name profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(shops);
  } catch (error: any) {
    console.error("Error in getShopDirectory:", error);
    res.status(500).json({ message: "Server error while fetching shop directory" });
  }
};
