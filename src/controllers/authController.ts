import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import BrandProfile from "../models/BrandProfile";
import CreatorProfile from "../models/CreatorProfile";
import { generateTokens } from "../utils/jwtUtils";
import { registerSchema, loginSchema, resetPasswordSchema } from "../utils/validators";

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
        await CreatorProfile.create({
          userId: user._id,
          displayName: name.trim(),
          username: username ? username.trim().toLowerCase() : "",
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

      const accessToken = generateTokens(res, user._id.toString());

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profilePic,
        accessToken,
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
      const accessToken = generateTokens(res, user._id.toString());

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        accessToken,
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

    const accessToken = generateTokens(res, user._id.toString());

    res.json({
      message: "Password reset successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
      accessToken,
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
 * @desc    Get new access token from refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: "Not authorized, no refresh token" });
      return;
    }

    const refreshSecret = process.env.REFRESH_SECRET || "fallback_refresh_secret";
    const decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string };

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: "Not authorized, user not found" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || "fallback_access_secret";
    const accessToken = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: "15m",
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
