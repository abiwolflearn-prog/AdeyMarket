import express from "express";
import multer from "multer";
import { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  uploadProductImage
} from "../controllers/productController";
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

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected routes (Brand and Creator only)
router.post("/", protect, authorize("brand", "creator"), createProduct);
router.put("/:id", protect, authorize("brand", "creator"), updateProduct);
router.delete("/:id", protect, authorize("brand", "creator"), deleteProduct);
router.post("/upload-image", protect, authorize("brand", "creator"), upload.single("image"), uploadProductImage);

export default router;
