import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
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

    const { name, email, password, role } = value;
    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: password, // Pre-save hook hashes this automatically
      role: role || "consumer",
    });

    if (user) {
      const accessToken = generateTokens(res, user._id.toString());

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
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
