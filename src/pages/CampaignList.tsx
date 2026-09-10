import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Megaphone,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  Package,
  ArrowRight,
  Share2,
  Check,
  Loader2,
  Plus,
  Clock,
  Flame,
  Store,
  ExternalLink,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface CampaignItem {
  _id: string;
  sellerId: {
    _id: string;
    name: string;
    email: string;
  };
  title: string;
  description?: string;
  boostedCommissionRate: number;
  startDate: string;
  endDate: string;
  products: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    category: string;
    stock: number;
  }[];
  bannerImage?: string;
  status: "active" | "scheduled" | "ended" | "draft";
  targetNiche: string;
  budget?: number;
  totalReferrals?: number;
  totalSales?: number;
}

const NICHES = [
  "All",
  "Fashion & Leather",
  "Coffee & Spices",
  "Tech & Electronics",
  "Beauty & Personal Care",
  "Art & Traditional Craft",
  "Home & Living",
];

export default function CampaignList() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNiche, setSelectedNiche] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<"active" | "all">("active");
  const [activeModalCampaign, setActiveModalCampaign] = useState<CampaignItem | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, [selectedStatus, selectedNiche]);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (selectedStatus === "active") params.status = "active";
      if (selectedNiche !== "All") params.niche = selectedNiche;

      const { data } = await api.get("/campaigns", { params });
      setCampaigns(data);
    } catch (error) {
      console.error("Failed to load campaigns", error);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCreatorLink = (productId?: string) => {
    if (!user) {
      toast.error("Please sign in as a creator to generate affiliate links");
      return;
    }

    const baseUrl = window.location.origin;
    let link = "";
    if (productId) {
      link = `${baseUrl}/product/${productId}?ref=${user._id}`;
    } else {
      link = `${baseUrl}/?ref=${user._id}`;
    }

    navigator.clipboard.writeText(link);
    setCopiedLink(productId || "campaign");
    toast.success("Boosted referral link copied to clipboard!");
    setTimeout(() => setCopiedLink(null), 3000);
  };

  const calculateDaysRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "Ends today";
    if (diff === 1) return "1 day left";
    return `${diff} days left`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header & Hero */}
      <div className="bg-stone-900 text-white rounded-3xl p-8 md:p-12 mb-10 relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4 border border-purple-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Boosted Commission Marketplace
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Earn up to 25%+ on Top Brand Campaigns
          </h1>
          <p className="text-stone-300 text-sm md:text-base mt-3 leading-relaxed">
            Brands are offering limited-time boosted payouts for Ethiopian creators. Share products with your audience on Telegram, TikTok, and Instagram to unlock higher commissions.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            {user?.role === "brand" && (
              <Link
                to="/campaigns/new"
                className="bg-white text-stone-900 hover:bg-stone-100 px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" /> Create Campaign
              </Link>
            )}
            <a
              href="#explore-campaigns"
              className="bg-stone-800 hover:bg-stone-700 text-white px-6 py-3 rounded-full font-semibold text-sm transition-all"
            >
              Explore Active Boosts
            </a>
          </div>
        </div>

        {/* Decorative ambient pattern */}
        <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-purple-900/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 top-10 w-64 h-64 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Filter & Controls Bar */}
      <div id="explore-campaigns" className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center bg-stone-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setSelectedStatus("active")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === "active"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Active Boosts
            </button>
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === "all"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              All Campaigns
            </button>
          </div>

          {user?.role === "brand" && (
            <Link
              to="/campaigns/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Launch New Campaign
            </Link>
          )}
        </div>

        {/* Niche Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {NICHES.map((niche) => (
            <button
              key={niche}
              onClick={() => setSelectedNiche(niche)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedNiche === niche
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              {niche}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-100 p-16 text-center shadow-xs">
          <Megaphone className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900">No campaigns found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-6">
            There are currently no boosted campaigns matching your filter. Be the first brand to launch one!
          </p>
          {user?.role === "brand" && (
            <Link
              to="/campaigns/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Create a Campaign
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => {
            const daysLeft = calculateDaysRemaining(camp.endDate);
            const isEnded = camp.status === "ended";

            return (
              <div
                key={camp._id}
                className="bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Banner Image or Graphic Header */}
                  <div className="h-44 relative bg-stone-900 overflow-hidden">
                    <img
                      src={
                        camp.bannerImage ||
                        camp.products?.[0]?.images?.[0] ||
                        "https://images.unsplash.com/photo-1441986300917-64674bd600d8"
                      }
                      alt={camp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Rate Badge */}
                    <div className="absolute top-4 left-4">
                      <div className="px-3 py-1.5 rounded-full bg-purple-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {camp.boostedCommissionRate}% Commission
                      </div>
                    </div>

                    {/* Expiry Badge */}
                    <div className="absolute top-4 right-4">
                      <div
                        className={`px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md ${
                          isEnded
                            ? "bg-red-500/80 text-white"
                            : "bg-black/60 text-white border border-white/20"
                        }`}
                      >
                        {daysLeft}
                      </div>
                    </div>

                    {/* Title in image overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block mb-1">
                        {camp.targetNiche}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-snug drop-shadow-sm line-clamp-1">
                        {camp.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    {/* Brand Info */}
                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-3">
                      <Store className="w-3.5 h-3.5 text-stone-400" />
                      <span>By {camp.sellerId?.name || "Verified Brand"}</span>
                    </div>

                    {/* Description Brief */}
                    {camp.description && (
                      <p className="text-xs text-stone-600 line-clamp-2 mb-4 leading-relaxed">
                        {camp.description}
                      </p>
                    )}

                    {/* Products Included Preview */}
                    <div className="pt-3 border-t border-stone-100">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-2">
                        {camp.products?.length || 0} Eligible Products
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {camp.products?.slice(0, 4).map((p) => (
                          <div
                            key={p._id}
                            className="w-10 h-10 rounded-xl overflow-hidden border border-stone-200 shrink-0 relative"
                            title={p.name}
                          >
                            <img
                              src={p.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {(camp.products?.length || 0) > 4 && (
                          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-500 font-bold text-xs flex items-center justify-center shrink-0">
                            +{(camp.products?.length || 0) - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-6 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => setActiveModalCampaign(camp)}
                    className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Promote & Earn
                  </button>
                  <button
                    onClick={() => setActiveModalCampaign(camp)}
                    className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
                    title="View Brief Details"
                  >
                    View Brief
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaign Details & Promote Modal */}
      {activeModalCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-stone-100 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setActiveModalCampaign(null)}
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> {activeModalCampaign.boostedCommissionRate}% Boosted Commission
              </div>
              <h2 className="text-2xl font-bold text-stone-900">{activeModalCampaign.title}</h2>
              <p className="text-xs text-stone-500 mt-1">
                Offered by {activeModalCampaign.sellerId?.name} • Valid until{" "}
                {new Date(activeModalCampaign.endDate).toLocaleDateString()}
              </p>
            </div>

            {/* Campaign Brief */}
            {activeModalCampaign.description && (
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 mb-6 text-xs text-stone-700 leading-relaxed">
                <span className="font-bold text-stone-900 block mb-1">Campaign Brief & Guidelines:</span>
                {activeModalCampaign.description}
              </div>
            )}

            {/* Products with copyable affiliate links */}
            <div>
              <h3 className="text-sm font-bold text-stone-900 mb-3">
                Eligible Products ({activeModalCampaign.products?.length || 0})
              </h3>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {activeModalCampaign.products?.map((prod) => {
                  const isCopied = copiedLink === prod._id;
                  const estimatedEarning = Math.round(
                    (prod.price * activeModalCampaign.boostedCommissionRate) / 100
                  );

                  return (
                    <div
                      key={prod._id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 hover:border-stone-300 bg-white transition-all gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 truncate">{prod.name}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                            <span>ETB {prod.price.toLocaleString()}</span>
                            <span>•</span>
                            <span className="text-purple-700 font-bold">
                              Earn ~ETB {estimatedEarning.toLocaleString()} / sale
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copyCreatorLink(prod._id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isCopied
                              ? "bg-green-600 text-white"
                              : "bg-stone-900 hover:bg-stone-800 text-white"
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          {isCopied ? "Copied!" : "Get Link"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Close */}
            <div className="mt-8 pt-4 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setActiveModalCampaign(null)}
                className="px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
