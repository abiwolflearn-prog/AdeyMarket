import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth";
import Product from "../models/Product";

/**
 * @desc    Create a product
 * @route   POST /api/products
 * @access  Private (Brand / Creator only)
 */
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { name, description, price, images, stock, category } = req.body;

    const product = await Product.create({
      sellerId: user._id,
      sellerRole: user.role as "brand" | "creator",
      name,
      description,
      price,
      images: images || [],
      stock,
      category,
    });

    res.status(201).json(product);
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Server error while creating product" });
  }
};

/**
 * @desc    Get all products (with optional filters)
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId, category, search } = req.query;
    
    let query: any = { isActive: true };

    if (sellerId) query.sellerId = sellerId;
    if (category) query.category = category;
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .populate("sellerId", "name profilePic");

    res.status(200).json(products);
  } catch (error: any) {
    console.error("Error getting products:", error);
    res.status(500).json({ message: "Server error while fetching products" });
  }
};

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await Product.findById(id).populate("sellerId", "name profilePic role");

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json(product);
  } catch (error: any) {
    console.error("Error getting product:", error);
    res.status(500).json({ message: "Server error while fetching product" });
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private (Brand / Creator only)
 */
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Ensure the user owns the product
    if (product.sellerId.toString() !== user?._id.toString()) {
      res.status(403).json({ message: "Not authorized to update this product" });
      return;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedProduct);
  } catch (error: any) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error while updating product" });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private (Brand / Creator only)
 */
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Ensure the user owns the product
    if (product.sellerId.toString() !== user?._id.toString()) {
      res.status(403).json({ message: "Not authorized to delete this product" });
      return;
    }

    await product.deleteOne();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error while deleting product" });
  }
};

/**
 * @desc    Upload product image to Cloudinary
 * @route   POST /api/products/upload-image
 * @access  Private
 */
export const uploadProductImage = async (req: AuthRequest, res: Response): Promise<void> => {
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
      folder: "products",
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    });

    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: uploadResponse.secure_url,
    });
  } catch (error) {
    console.error("Error in uploadProductImage:", error);
    res.status(500).json({ message: "Server error while uploading image" });
  }
};
