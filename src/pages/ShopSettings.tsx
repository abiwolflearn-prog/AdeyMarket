import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { Camera, Loader2, Save, Store } from "lucide-react";

export default function ShopSettings() {
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [shopSlug, setShopSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number | "">(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && (user.role === "brand" || user.role === "creator")) {
      loadShop();
    }
  }, [user]);

  const loadShop = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/shop/me/profile");
      if (data) {
        setShopSlug(data.shopSlug || "");
        setDescription(data.description || "");
        setLogo(data.logo || "");
        setDefaultCommissionRate(data.defaultCommissionRate || 0);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error("Failed to load shop settings");
      }
      // 404 just means they haven't activated a shop yet, which is fine
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      formData.append("logo", file);

      const { data } = await api.post("/shop/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLogo(data.logo);
      toast.success("Shop logo updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload logo. Ensure you have activated your shop first.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      const payload = {
        shopSlug,
        description,
        defaultCommissionRate: defaultCommissionRate === "" ? 0 : Number(defaultCommissionRate)
      };

      await api.post("/shop/activate", payload);
      toast.success("Shop settings saved successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save shop settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role === "consumer") {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-stone-500">
        Consumers do not have access to shop settings.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-stone-700" /> Shop Settings
          </h1>
          <p className="text-sm text-stone-500 mt-1">Configure your storefront appearance and default commission rates.</p>
        </div>

        {/* Logo Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 pb-10 border-b border-stone-100">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
              {logo ? (
                <img src={logo} alt="Shop Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                  <Camera className="w-8 h-8" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <h3 className="font-medium text-stone-900">Shop Logo</h3>
            <p className="text-sm text-stone-500 mt-1">Make your brand recognizable. JPG or PNG. 5MB max. Note: You must save your shop settings below at least once before uploading a logo.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-3 text-sm font-medium text-stone-900 bg-white border border-stone-200 px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors"
            >
              Change logo
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6">
            
            {/* Shop Slug */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Shop URL Slug</label>
              <div className="flex rounded-xl shadow-sm">
                <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-stone-200 bg-stone-50 text-stone-500 sm:text-sm">
                  ethioinfluence.com/shop/
                </span>
                <input
                  type="text"
                  required
                  value={shopSlug}
                  onChange={(e) => setShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-awesome-brand"
                  className="flex-1 block w-full min-w-0 px-4 py-2.5 border border-stone-200 rounded-none rounded-r-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
                />
              </div>
              <p className="text-xs text-stone-500 mt-1.5">Only lowercase letters, numbers, and hyphens.</p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Shop Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers about your shop..."
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors resize-none"
              />
            </div>

            {/* Default Commission Rate */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Default Commission Rate (%)</label>
              <input
                type="number"
                min="0"
                max="30"
                required
                value={defaultCommissionRate}
                onChange={(e) => setDefaultCommissionRate(e.target.value ? Number(e.target.value) : "")}
                className="w-full md:w-1/3 px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-stone-500 mt-1.5">The percentage you pay influencers for referring a sale (Max 30%).</p>
            </div>

          </div>

          <div className="pt-6 flex justify-end">
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
              Save Shop Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
