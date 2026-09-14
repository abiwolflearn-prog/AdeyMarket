import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Megaphone,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

interface ProductOption {
  _id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
}

const NICHES = [
  "General",
  "Fashion & Leather",
  "Coffee & Spices",
  "Tech & Electronics",
  "Beauty & Personal Care",
  "Art & Traditional Craft",
  "Home & Living",
];

export default function CampaignCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [boostedRate, setBoostedRate] = useState("15");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 14);
    return nextWeek.toISOString().split("T")[0];
  });
  const [targetNiche, setTargetNiche] = useState("General");
  const [bannerImage, setBannerImage] = useState("");
  const [budget, setBudget] = useState("");

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const { data } = await api.get("/products/seller/mine");
      setProducts(data);
      // default select all
      setSelectedProductIds(data.map((p: ProductOption) => p._id));
    } catch (error) {
      console.error("Failed to load seller products", error);
      toast.error("Failed to load your product catalog");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProductIds([]);
      setSelectAll(false);
    } else {
      setSelectedProductIds(products.map((p) => p._id));
      setSelectAll(true);
    }
  };

  const toggleProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      const next = selectedProductIds.filter((id) => id !== productId);
      setSelectedProductIds(next);
      setSelectAll(next.length === products.length);
    } else {
      const next = [...selectedProductIds, productId];
      setSelectedProductIds(next);
      setSelectAll(next.length === products.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a campaign title");
      return;
    }

    const rate = parseFloat(boostedRate);
    if (isNaN(rate) || rate < 1 || rate > 70) {
      toast.error("Boosted commission rate must be between 1% and 70%");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("Campaign end date must be after the start date");
      return;
    }

    if (products.length > 0 && selectedProductIds.length === 0) {
      toast.error("Please select at least one product for this campaign");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/campaigns", {
        title: title.trim(),
        description: description.trim(),
        boostedCommissionRate: rate,
        startDate,
        endDate,
        products: selectedProductIds,
        bannerImage: bannerImage.trim() || undefined,
        targetNiche,
        budget: budget ? parseFloat(budget) : 0,
      });

      toast.success("Promotional boost campaign launched!");
      navigate("/campaigns");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Top Breadcrumb */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Campaigns
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Influencer Booster
        </div>
        <h1 className="text-3xl font-bold text-stone-900">Create Promotional Campaign</h1>
        <p className="text-stone-500 text-sm mt-1">
          Incentivize top Ethiopian TikTok, Instagram & Telegram creators by offering boosted commission rates on your products.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Campaign Basics Card */}
        <div className="bg-white rounded-3xl border border-stone-100 p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-stone-700" /> Campaign Overview
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Campaign Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Meskel Holiday 20% Mega Boost"
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Boosted Commission Rate (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="70"
                  required
                  value={boostedRate}
                  onChange={(e) => setBoostedRate(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">
                  %
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Standard rate is usually 5-10%. Boosted rates between 15-25% attract 4x more creator promotions.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Target Creator Niche
              </label>
              <select
                value={targetNiche}
                onChange={(e) => setTargetNiche(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
              >
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Brief & Guidelines for Creators
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell creators how to highlight your brand (e.g. Unboxing video on TikTok, styling reel on Instagram, include #Adey)..."
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Banner Image URL (Optional)
              </label>
              <input
                type="url"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Promotional Budget (ETB, Optional)
              </label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 50,000"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Product Selection Card */}
        <div className="bg-white rounded-3xl border border-stone-100 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-stone-700" /> Applicable Products
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Creators will earn {boostedRate}% commission when their followers purchase these products.
              </p>
            </div>
            {products.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-stone-700 hover:text-stone-900 underline"
              >
                {selectAll ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          {isLoadingProducts ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-100">
              <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-700">No active products found in your shop</p>
              <p className="text-xs text-stone-400 mt-1">
                Please add products to your store first before launching a boost campaign.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {products.map((p) => {
                const isSelected = selectedProductIds.includes(p._id);
                return (
                  <div
                    key={p._id}
                    onClick={() => toggleProduct(p._id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-purple-600 bg-purple-50/40 shadow-xs"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <img
                      src={p.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-stone-900 truncate">{p.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                        <span className="font-semibold text-stone-800">ETB {p.price.toLocaleString()}</span>
                        <span>•</span>
                        <span>Stock: {p.stock}</span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-purple-600 border-purple-600 text-white" : "border-stone-300"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-stone-200 text-stone-700 rounded-full font-semibold text-sm hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || products.length === 0}
            className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-semibold text-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Launch Campaign
          </button>
        </div>
      </form>
    </div>
  );
}
