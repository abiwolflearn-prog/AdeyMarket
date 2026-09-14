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
      cb(new Error("Unsupported image type"));
    }
  },
});

const handleMulterUpload = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  upload.single("avatar")(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "Oversized image file (max 5MB)" });
        return;
      }
      res.status(400).json({ message: err.message || "Unsupported image type" });
      return;
    }
    next();
  });
};

// Profile routes
router.get("/:userId", getProfile); // Public viewing of a profile
router.put("/", protect, updateProfile); // Update own profile
router.post("/avatar", protect, handleMulterUpload, uploadAvatar); // Upload own avatar

export default router;
