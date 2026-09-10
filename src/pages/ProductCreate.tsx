import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { Loader2, Save, ArrowLeft, Image as ImageIcon, X } from "lucide-react";

export default function ProductCreate() {
  const navigate = useNavigate();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">(0);
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    "Fashion & Apparel",
    "Health & Beauty",
    "Electronics",
    "Home & Lifestyle",
    "Digital Products",
    "Fitness",
    "Other"
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await api.post("/products/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImages(prev => [...prev, data.imageUrl]);
      toast.success("Image uploaded");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    
    try {
      setIsSaving(true);
      
      const payload = {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        category,
        images,
      };

      await api.post("/products", payload);
      toast.success("Product created successfully");
      navigate("/products");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create product");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate("/products")}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-8 border-b border-stone-100 bg-stone-50/50">
          <h1 className="text-2xl font-semibold text-stone-900">Add New Product</h1>
          <p className="text-sm text-stone-500 mt-1">List a new product on your storefront.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Images Section */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">Product Images</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((imgUrl, idx) => (
                <div key={idx} className="aspect-square bg-stone-100 rounded-2xl relative group overflow-hidden border border-stone-200">
                  <img src={imgUrl} alt={`Product ${idx+1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-red-50 hover:text-red-600 rounded-full flex items-center justify-center text-stone-700 shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {images.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="aspect-square bg-stone-50 hover:bg-stone-100 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-stone-500 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 mb-2 text-stone-400" />
                      <span className="text-xs font-medium">Add Image</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <p className="text-xs text-stone-500 mt-3">Upload up to 4 high-quality images (JPG/PNG). First image will be the cover.</p>
          </div>

          <div className="grid gap-6">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Product Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Premium Leather Wallet"
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
              />
            </div>

            {/* Price and Stock */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Price (ETB)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">Br</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                    className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Inventory Stock</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Category</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors bg-white"
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Description</label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product in detail..."
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors resize-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="py-2.5 px-6 font-medium text-stone-700 hover:bg-stone-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 py-2.5 px-6 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Publish Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
