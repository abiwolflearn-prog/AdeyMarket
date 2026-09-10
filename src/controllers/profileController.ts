import { Request, Response } from "express";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/User";
import CreatorProfile from "../models/CreatorProfile";
import BrandProfile from "../models/BrandProfile";
import Shop from "../models/Shop";
import { AuthRequest } from "../middleware/auth";


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
      res.status(400).json({ message: "No image file provided" });
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

    // Update user's profilePic URL
    user.profilePic = uploadResponse.secure_url;
    await user.save();

    res.status(200).json({
      message: "Avatar updated successfully",
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in uploadAvatar:", error);
    res.status(500).json({ message: "Server error while uploading avatar" });
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

    const { name, profilePic, ...profileData } = req.body;

    // Update base user fields
    if (name) user.name = name;
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
