import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User";
import BrandProfile from "../models/BrandProfile";
import CreatorProfile from "../models/CreatorProfile";
import { generateTokens } from "../utils/jwtUtils";
import { registerSchema, loginSchema, resetPasswordSchema } from "../utils/validators";
import { AuthRequest } from "../middleware/auth";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    const { 
      name, 
      email, 
      password, 
      role, 
      companyName, 
      phone, 
      city, 
      address, 
      businessCategory, 
      taxId, 
      website,
      username,
      niche,
      bio,
      tiktok,
      instagram,
      youtube,
      telegram,
    } = value;
    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : "",
      passwordHash: password, // Pre-save hook hashes this automatically
      role: role || "consumer",
    });

    if (user) {
      try {
        // If brand/company, initialize BrandProfile with provided onboarding data
        if (user.role === "brand") {
          await BrandProfile.create({
            userId: user._id,
            companyName: (companyName && companyName.trim()) || name.trim(),
            phone: phone ? phone.trim() : "",
            city: city ? city.trim() : "",
            address: address ? address.trim() : "",
            businessCategory: businessCategory ? businessCategory.trim() : "",
            taxId: taxId ? taxId.trim() : "",
            website: website ? website.trim() : "",
            isApproved: false,
          });
        } else if (user.role === "creator") {
          let cleanUsername = username ? username.trim().toLowerCase().replace(/^@/, "") : "";
          if (!cleanUsername) {
            cleanUsername = name.trim().toLowerCase().replace(/\s+/g, "_");
          }
          await CreatorProfile.create({
            userId: user._id,
            displayName: name.trim(),
            username: cleanUsername,
            niche: niche ? niche.trim() : "",
            city: city ? city.trim() : "",
            bio: bio ? bio.trim() : "",
            socialLinks: {
              tiktok: tiktok ? tiktok.trim() : "",
              instagram: instagram ? instagram.trim() : "",
              youtube: youtube ? youtube.trim() : "",
              telegram: telegram ? telegram.trim() : "",
            },
          });
        }
      } catch (profileError: any) {
        // Rollback user creation if profile setup fails
        await User.findByIdAndDelete(user._id);
        res.status(400).json({ message: profileError.message || "Failed to create profile for user" });
        return;
      }

      const { accessToken, refreshToken } = generateTokens(res, user._id.toString(), user.email, user.role);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profilePic,
        accessToken,
        refreshToken,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    const { email, password } = value;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (user && user.status === "suspended") {
      res.status(403).json({ message: "Account suspended. Please contact support." });
      return;
    }

    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(res, user._id.toString(), user.email, user.role);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        phone: user.phone,
        city: user.city,
        address: user.address,
        accessToken,
        refreshToken,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * @desc    Reset password for a user
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    const { email, newPassword } = value;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(404).json({ message: "No account found with this email address" });
      return;
    }

    user.passwordHash = newPassword;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(res, user._id.toString(), user.email, user.role);

    res.json({
      message: "Password reset successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = (req: Request, res: Response): void => {
  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

/**
 * @desc    Get new access token from refresh token (cookie or body)
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: "Not authorized, no refresh token" });
      return;
    }

    const refreshSecret = process.env.REFRESH_SECRET || "fallback_refresh_secret";
    const decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string; email?: string; role?: string };

    let user: any = null;
    if (decoded.userId && mongoose.Types.ObjectId.isValid(decoded.userId)) {
      user = await User.findById(decoded.userId);
    }
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase() });
    }

    if (!user) {
      res.status(401).json({ message: "Not authorized, user not found" });
      return;
    }

    const tokens = generateTokens(res, user._id.toString(), user.email, user.role);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    profilePic: req.user.profilePic,
    phone: req.user.phone,
    city: req.user.city,
    address: req.user.address,
    bio: req.user.bio,
    website: req.user.website,
  });
};
