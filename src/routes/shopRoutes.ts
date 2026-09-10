import express from "express";
import multer from "multer";
import { 
  activateShop, 
  getMyShop, 
  uploadLogo, 
  getShopBySlug, 
  getShopProducts, 
  getShopDirectory 
} from "../controllers/shopController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

// Protected routes
router.get("/me/profile", protect, authorize("brand", "creator"), getMyShop); // Changed from /me to avoid /:slug collision if called without token, but express processes in order, so we need to put /me/profile or just ensure order is correct. Let's use /me/profile
router.post("/activate", protect, authorize("brand", "creator"), activateShop);
router.post("/logo", protect, authorize("brand", "creator"), upload.single("logo"), uploadLogo);

// Public routes
router.get("/directory", getShopDirectory);
router.get("/directory/all", getShopDirectory);
router.get("/:slug", getShopBySlug);
router.get("/:slug/products", getShopProducts);

export default router;
