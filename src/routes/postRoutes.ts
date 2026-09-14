import express from "express";
import {
  getPosts,
  getPostById,
  createPost,
  deletePost,
} from "../controllers/postController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// Public routes
router.get("/", getPosts);
router.get("/:id", getPostById);

// Protected routes (Creators, Brands, Admin)
router.post("/", protect, authorize("creator", "brand", "admin"), createPost);
router.delete("/:id", protect, authorize("creator", "brand", "admin"), deletePost);

export default router;
