import { Request, Response } from "express";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary";
import User from "../models/User";
import CreatorProfile from "../models/CreatorProfile";
import BrandProfile from "../models/BrandProfile";
import Shop from "../models/Shop";
import { AuthRequest } from "../middleware/auth";

/**
 * @desc    Get user profile (merged user + role profile)
 * @route   GET /api/profile/:userId
 * @access  Public or Private (depending on implementation, assuming public viewing)
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId as string)) {
      res.status(400).json({ message: "Invalid user ID format" });
      return;
    }

    // Fetch the base user (excluding password)
    const user = await User.findById(userId).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let roleProfile = null;

    // Fetch the specific role profile based on the user's role
    if (user.role === "creator") {
      roleProfile = await CreatorProfile.findOne({ userId });
    } else if (user.role === "brand") {
      roleProfile = await BrandProfile.findOne({ userId });
    }

    // Fetch shop if exists for brand/creator
    const shop = await Shop.findOne({ ownerId: userId, isActive: true });

    // Merge the data
    // We convert mongoose documents to plain objects for easier merging
    const mergedProfile = {
      ...user.toObject(),
      profile: roleProfile ? roleProfile.toObject() : null,
      shop: shop ? shop.toObject() : null,
    };



    res.status(200).json(mergedProfile);
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

/**
 * @desc    Upload avatar to Cloudinary and update user profile
 * @route   POST /api/profile/avatar
 * @access  Private
 */
export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }

    if (!req.file.mimetype || !req.file.mimetype.startsWith("image/")) {
      res.status(400).json({ message: "Unsupported image type" });
      return;
    }

    // Convert buffer to base64 string for Cloudinary upload
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: "avatars",
      public_id: `${user._id}_avatar`,
      overwrite: true,
      transformation: [{ width: 500, height: 500, crop: "fill" }],
    });

    if (!uploadResponse || !uploadResponse.secure_url) {
      res.status(500).json({ message: "Image upload failed" });
      return;
    }

    // Update user's profilePic URL in MongoDB
    user.profilePic = uploadResponse.secure_url;
    await user.save();

    res.status(200).json({
      message: "Avatar updated successfully",
      profilePic: user.profilePic,
    });
  } catch (error: any) {
    const errorMsg = error?.message || "";
    console.error("Error in uploadAvatar:", errorMsg);

    // Return safe, useful error messages without leaking credentials or stack traces
    if (errorMsg.includes("cloud_name") || errorMsg.includes("api_key") || errorMsg.includes("Cloudinary") || error?.http_code) {
      res.status(500).json({ message: "Image upload failed" });
      return;
    }

    res.status(500).json({ message: "Profile update failed" });
  }
};
/**
 * @desc    Update user profile (both base user fields and role-specific fields)
 * @route   PUT /api/profile
 * @access  Private
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { name, phone, profilePic, ...profileData } = req.body;

    // Update base user fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profilePic !== undefined) user.profilePic = profilePic;
    
    await user.save();

    let roleProfile = null;

    // Update or create the role-specific profile
    if (user.role === "creator") {
      roleProfile = await CreatorProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: profileData },
        { new: true, upsert: true }
      );
    } else if (user.role === "brand") {
      roleProfile = await BrandProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: profileData },
        { new: true, upsert: true }
      );
    }

    // Merge and remove passwordHash
    const userObj = user.toObject();
    delete userObj.passwordHash;

    const mergedProfile = {
      ...userObj,
      profile: roleProfile ? roleProfile.toObject() : null,
    };

    res.status(200).json(mergedProfile);
  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};
