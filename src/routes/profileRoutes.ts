import express from "express";
import multer from "multer";
import { getProfile, updateProfile, uploadAvatar } from "../controllers/profileController";
import { protect } from "../middleware/auth";

const router = express.Router();

// Configure multer for memory storage (for uploading buffer to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

// Profile routes
router.get("/:userId", getProfile); // Public viewing of a profile
router.put("/", protect, updateProfile); // Update own profile
router.post("/avatar", protect, upload.single("avatar"), uploadAvatar); // Upload own avatar

export default router;
