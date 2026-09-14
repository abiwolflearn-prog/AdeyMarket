import { Request, Response } from "express";
import mongoose from "mongoose";
import Post from "../models/Post";
import Product from "../models/Product";
import CreatorProfile from "../models/CreatorProfile";
import { AuthRequest } from "../middleware/auth";

/**
 * @desc    Get all creator posts
 * @route   GET /api/posts
 * @access  Public
 */
export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { creatorId, category, search } = req.query;

    const query: any = {};

    if (creatorId && mongoose.Types.ObjectId.isValid(creatorId as string)) {
      query.creatorId = creatorId;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { caption: { $regex: search, $options: "i" } },
        { creatorName: { $regex: search, $options: "i" } },
        { creatorUsername: { $regex: search, $options: "i" } },
      ];
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate("creatorId", "name profilePic role")
      .populate("taggedProductId", "name price images category stock sellerId");

    res.status(200).json(posts);
  } catch (error: any) {
    console.error("Error fetching creator posts:", error);
    res.status(500).json({ message: "Server error while fetching creator posts" });
  }
};

/**
 * @desc    Get single post by ID
 * @route   GET /api/posts/:id
 * @access  Public
 */
export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      res.status(400).json({ message: "Invalid post ID" });
      return;
    }

    const post = await Post.findById(id)
      .populate("creatorId", "name profilePic role")
      .populate("taggedProductId", "name price images category stock sellerId");

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.status(200).json(post);
  } catch (error: any) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Server error while fetching post" });
  }
};

/**
 * @desc    Create a new creator look / shoppable post
 * @route   POST /api/posts
 * @access  Private (Creator / Brand / Admin)
 */
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { caption, mediaUrl, taggedProductId, category } = req.body;

    if (!caption || !caption.trim()) {
      res.status(400).json({ message: "Caption is required" });
      return;
    }

    if (!mediaUrl || !mediaUrl.trim()) {
      res.status(400).json({ message: "Media image/video URL is required" });
      return;
    }

    // Try to retrieve creator handle/username if available
    let creatorUsername = "";
    if (user.role === "creator") {
      const creatorProfile = await CreatorProfile.findOne({ userId: user._id });
      if (creatorProfile) {
        creatorUsername = creatorProfile.username || "";
      }
    }

    let validTaggedProductId: mongoose.Types.ObjectId | null = null;
    let postCategory = category || "General";

    if (taggedProductId && mongoose.Types.ObjectId.isValid(taggedProductId)) {
      validTaggedProductId = new mongoose.Types.ObjectId(taggedProductId);
      const product = await Product.findById(validTaggedProductId);
      if (product && product.category) {
        postCategory = product.category;
      }
    }

    const post = await Post.create({
      creatorId: user._id,
      creatorName: user.name,
      creatorUsername: creatorUsername || user.name.toLowerCase().replace(/\s+/g, "_"),
      creatorAvatar: user.profilePic || "",
      caption: caption.trim(),
      mediaUrl: mediaUrl.trim(),
      taggedProductId: validTaggedProductId,
      category: postCategory,
    });

    const populatedPost = await Post.findById(post._id)
      .populate("creatorId", "name profilePic role")
      .populate("taggedProductId", "name price images category stock sellerId");

    res.status(201).json(populatedPost);
  } catch (error: any) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server error while creating post", error: error.message });
  }
};

/**
 * @desc    Delete a creator post
 * @route   DELETE /api/posts/:id
 * @access  Private (Owner / Admin)
 */
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      res.status(400).json({ message: "Invalid post ID" });
      return;
    }

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.creatorId.toString() !== user?._id.toString() && user?.role !== "admin") {
      res.status(403).json({ message: "Not authorized to delete this post" });
      return;
    }

    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error while deleting post" });
  }
};
