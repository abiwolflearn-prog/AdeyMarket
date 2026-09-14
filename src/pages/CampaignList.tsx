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
  Send,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Users,
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

interface PartnershipAgreement {
  status: "pending_company_acceptance" | "pending_creator_acceptance" | "active" | "rejected" | "terminated" | "expired";
  agreedCommissionRate: number;
  agreementTerms: string;
  affiliateCode: string;
  approvedAt: string;
  agreementId?: string;
}

interface CampaignApplicationItem {
  _id: string;
  campaignId: string | { _id: string; title: string };
  creatorId: string;
  companyId: string;
  status: "pending" | "approved" | "rejected";
  pitchMessage: string;
  channels: string[];
  estimatedAudience?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  partnershipAgreement?: PartnershipAgreement;
  agreementId?: string;
  createdAt: string;
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

const PROMOTIONAL_CHANNELS = ["TikTok", "Telegram", "Instagram", "YouTube", "Facebook", "X (Twitter)"];

export default function CampaignList() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNiche, setSelectedNiche] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<"active" | "all">("active");

  // Creator applications map: campaignId -> CampaignApplicationItem
  const [creatorApps, setCreatorApps] = useState<Record<string, CampaignApplicationItem>>({});
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  // Modals state
  const [briefModalCampaign, setBriefModalCampaign] = useState<CampaignItem | null>(null);
  const [applyingCampaign, setApplyingCampaign] = useState<CampaignItem | null>(null);
  const [agreementModalApp, setAgreementModalApp] = useState<{
    app: CampaignApplicationItem;
    campaign: CampaignItem | null;
  } | null>(null);

  // Application form state
  const [pitchMessage, setPitchMessage] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["TikTok", "Telegram"]);
  const [estimatedAudience, setEstimatedAudience] = useState("");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  // Copy tracking state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, [selectedStatus, selectedNiche]);

  useEffect(() => {
    if (user && user.role === "creator") {
      fetchCreatorApplications();
    }
  }, [user]);

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

  const fetchCreatorApplications = async () => {
    try {
      setIsLoadingApps(true);
      const { data } = await api.get("/campaigns/creator/applications");
      if (Array.isArray(data)) {
        const map: Record<string, CampaignApplicationItem> = {};
        data.forEach((app: CampaignApplicationItem) => {
          const campId = typeof app.campaignId === "object" ? app.campaignId._id : app.campaignId;
          if (campId) {
            map[campId] = app;
          }
        });
        setCreatorApps(map);
      }
    } catch (error) {
      console.error("Failed to load creator applications", error);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleOpenApplyModal = (camp: CampaignItem) => {
    if (!user) {
      toast.error("Please sign in as a creator to apply for campaigns");
      return;
    }
    if (user.role !== "creator") {
      toast.error("Only creator accounts can apply for brand campaigns");
      return;
    }
    setApplyingCampaign(camp);
    setPitchMessage("");
    setSelectedChannels(["TikTok", "Telegram"]);
    setEstimatedAudience("");
  };

  const toggleChannel = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter((c) => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingCampaign) return;

    if (!pitchMessage.trim()) {
      toast.error("Please provide a pitch or collaboration proposal");
      return;
    }

    if (selectedChannels.length === 0) {
      toast.error("Please select at least one promotion channel");
      return;
    }

    try {
      setIsSubmittingApp(true);
      const { data } = await api.post(`/campaigns/${applyingCampaign._id}/apply`, {
        pitchMessage: pitchMessage.trim(),
        channels: selectedChannels,
        estimatedAudience: estimatedAudience.trim(),
      });

      toast.success("Application submitted! The brand will review your request.");
      if (data?.application) {
        setCreatorApps((prev) => ({
          ...prev,
          [applyingCampaign._id]: data.application,
        }));
      } else {
        fetchCreatorApplications();
      }
      setApplyingCampaign(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit application");
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const [isAcceptingAgreement, setIsAcceptingAgreement] = useState(false);

  const handleAcceptAgreement = async () => {
    if (!agreementModalApp) return;

    const agreementId =
      agreementModalApp.app.agreementId ||
      agreementModalApp.app.partnershipAgreement?.agreementId;

    setIsAcceptingAgreement(true);
    try {
      let res;
      if (agreementId) {
        res = await api.patch(`/agreements/${agreementId}/accept`);
      } else {
        // Find matching agreement from API
        const { data: userAgreements } = await api.get("/agreements");
        const matched = userAgreements.find(
          (a: any) =>
            a.campaignId?._id === agreementModalApp.campaign?._id ||
            a.applicationId === agreementModalApp.app._id
        );
        if (!matched) {
          throw new Error("Could not find agreement to accept");
        }
        res = await api.patch(`/agreements/${matched._id}/accept`);
      }

      const updated = res.data.agreement;
      toast.success("Partnership agreement officially signed and active! Tracking credentials generated.");

      // Update local modal state
      setAgreementModalApp({
        ...agreementModalApp,
        app: {
          ...agreementModalApp.app,
          agreementId: updated._id,
          partnershipAgreement: {
            status: "active",
            agreedCommissionRate: updated.commissionRate,
            agreementTerms: `${updated.paymentRules} ${updated.cancellationRules}`,
            affiliateCode: updated.affiliateCode,
            approvedAt: updated.creatorAcceptedAt || new Date().toISOString(),
            agreementId: updated._id,
          },
        },
      });

      // Update creator apps mapping
      setCreatorApps((prev) => ({
        ...prev,
        [agreementModalApp.campaign._id]: {
          ...agreementModalApp.app,
          agreementId: updated._id,
          partnershipAgreement: {
            status: "active",
            agreedCommissionRate: updated.commissionRate,
            agreementTerms: `${updated.paymentRules} ${updated.cancellationRules}`,
            affiliateCode: updated.affiliateCode,
            approvedAt: updated.creatorAcceptedAt || new Date().toISOString(),
            agreementId: updated._id,
          },
        },
      }));

      // Refresh applications from backend
      fetchCreatorApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to accept agreement");
    } finally {
      setIsAcceptingAgreement(false);
    }
  };

  const copyTrackingLink = async (productId: string, affiliateCode: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/product/${productId}?ref=${user?._id}&code=${affiliateCode}`;
    
    try {
      if (agreementModalApp?.app?.agreementId) {
        await api.post("/referral/generate-link", {
          productId,
          agreementId: agreementModalApp.app.agreementId,
        }).catch(() => {});
      }
    } catch {}

    navigator.clipboard.writeText(link);
    setCopiedId(productId);
    toast.success("Official partner tracking link copied!");
    setTimeout(() => setCopiedId(null), 3000);
  };

  const copyTrackingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId("code");
    toast.success("Affiliate tracking code copied!");
    setTimeout(() => setCopiedId(null), 3000);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Header & Hero */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Boosted Commission Marketplace
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Creator → Brand Campaign Partnerships
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            Discover active brand campaigns offering boosted commission rates. Apply directly to collaborate. Upon brand approval and agreement establishment, receive your verified tracking credentials.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            {user?.role === "brand" && (
              <Link
                to="/campaigns/new"
                className="bg-[#2E7D32] hover:bg-green-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4" /> Create Brand Campaign
              </Link>
            )}
            {user?.role === "brand" && (
              <Link
                to="/company"
                className="bg-stone-800 hover:bg-stone-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors min-h-[44px]"
              >
                <Store className="w-4 h-4" /> Review Applications in Company Portal
              </Link>
            )}
            {user?.role === "creator" && (
              <Link
                to="/creator"
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors min-h-[44px]"
              >
                <Users className="w-4 h-4" /> My Creator Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Category Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
        {/* Niche Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {NICHES.map((niche) => (
            <button
              key={niche}
              onClick={() => setSelectedNiche(niche)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedNiche === niche
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {niche}
            </button>
          ))}
        </div>

        {/* Status Toggle */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl self-end sm:self-auto shrink-0">
          <button
            onClick={() => setSelectedStatus("active")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              selectedStatus === "active" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-500"
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              selectedStatus === "all" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-500"
            }`}
          >
            All Campaigns
          </button>
        </div>
      </div>

      {/* Campaign List Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2E7D32]" />
          <p className="text-xs text-stone-500">Loading eligible brand campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-stone-200/80 p-8 space-y-4">
          <Megaphone className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-900">No campaigns found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {selectedNiche !== "All"
              ? `There are currently no active campaigns in ${selectedNiche}. Try exploring other categories.`
              : "There are currently no campaigns matching your filters. Check back soon for new brand collaborations."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => {
            const daysLeft = calculateDaysRemaining(camp.endDate);
            const app = creatorApps[camp._id];
            const isOwner = user?._id && camp.sellerId?._id === user._id;

            return (
              <div
                key={camp._id}
                className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:border-stone-300 transition-all group"
              >
                <div>
                  {/* Banner / Header image */}
                  <div className="h-44 w-full relative bg-stone-100 overflow-hidden">
                    <img
                      src={
                        camp.bannerImage ||
                        camp.products?.[0]?.images?.[0] ||
                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
                      }
                      alt={camp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Boost rate pill */}
                    <div className="absolute top-3.5 left-3.5 bg-purple-600/95 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-black shadow-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      {camp.boostedCommissionRate}% Boosted Commission
                    </div>

                    {/* Category pill */}
                    <div className="absolute top-3.5 right-3.5 bg-black/50 backdrop-blur-md text-white px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider">
                      {camp.targetNiche || "General"}
                    </div>

                    {/* Days left indicator */}
                    <div className="absolute bottom-3 right-3 text-stone-200 text-xs font-semibold flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> {daysLeft}
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="font-semibold text-stone-800 flex items-center gap-1 truncate max-w-[180px]">
                        <Store className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        {camp.sellerId?.name || "Verified Brand"}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {camp.products?.length || 0} product(s)
                      </span>
                    </div>

                    <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-1 group-hover:text-[#2E7D32] transition-colors">
                      {camp.title}
                    </h3>

                    {camp.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {camp.description}
                      </p>
                    )}

                    {/* Products Thumbnail Row */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                        Enrolled Catalog
                      </span>
                      <div className="flex items-center -space-x-2">
                        {camp.products?.slice(0, 3).map((p) => (
                          <div
                            key={p._id}
                            className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white bg-stone-100 shadow-xs"
                            title={p.name}
                          >
                            <img
                              src={p.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {(camp.products?.length || 0) > 3 && (
                          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-xs">
                            +{(camp.products?.length || 0) - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Area */}
                <div className="p-5 pt-0 border-t border-stone-100/80 mt-2">
                  <div className="pt-3 flex items-center gap-2">
                    {/* Role-based action */}
                    {isOwner ? (
                      <Link
                        to="/company"
                        className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" /> Manage In Company Portal
                      </Link>
                    ) : app?.status === "approved" ? (
                      app.partnershipAgreement?.status === "active" ? (
                        <button
                          onClick={() => setAgreementModalApp({ app, campaign: camp })}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                          Active: View Agreement
                        </button>
                      ) : (
                        <button
                          onClick={() => setAgreementModalApp({ app, campaign: camp })}
                          className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs animate-pulse"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Sign Agreement
                        </button>
                      )
                    ) : app?.status === "pending" ? (
                      <button
                        disabled
                        className="flex-1 py-2.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Application In Review
                      </button>
                    ) : app?.status === "rejected" ? (
                      <button
                        disabled
                        className="flex-1 py-2.5 bg-stone-100 text-stone-500 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Application Declined
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenApplyModal(camp)}
                        className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Apply to Campaign
                      </button>
                    )}

                    <button
                      onClick={() => setBriefModalCampaign(camp)}
                      className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
                      title="View Campaign Brief"
                    >
                      Brief
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Creator Apply to Campaign Form */}
      {applyingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setApplyingCampaign(null)}
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 mb-6">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                Partnership Application
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                Apply to {applyingCampaign.title}
              </h2>
              <p className="text-xs text-stone-500">
                Brand: <strong className="text-stone-800">{applyingCampaign.sellerId?.name}</strong> • Boosted Rate:{" "}
                <strong className="text-purple-700">{applyingCampaign.boostedCommissionRate}%</strong>
              </p>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-5">
              {/* Pitch Message */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  Collaboration Pitch & Content Plan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                  placeholder="Introduce yourself, explain why you are excited to promote this brand, and describe the type of content you plan to post (e.g. unboxing, styling video, TikTok review)..."
                  className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
                  required
                />
              </div>

              {/* Promotional Channels */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  Primary Promotional Channels <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROMOTIONAL_CHANNELS.map((ch) => {
                    const selected = selectedChannels.includes(ch);
                    return (
                      <button
                        type="button"
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          selected
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {selected && "✓ "}
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Audience */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  Audience Reach / Social Handle (Optional)
                </label>
                <input
                  type="text"
                  value={estimatedAudience}
                  onChange={(e) => setEstimatedAudience(e.target.value)}
                  placeholder="e.g. @ethio_fashion on TikTok (25k followers) + Telegram channel (10k members)"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
                />
              </div>

              {/* Compliance & Governance Warning */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-stone-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Marketplace Governance Policy</span>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-500">
                  Submitting an application does not generate an affiliate tracking link or code. Tracking credentials are provided only after an approved partnership agreement is executed with the brand.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setApplyingCampaign(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApp}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmittingApp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Approved Partnership Agreement & Tracking Credentials */}
      {agreementModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto relative space-y-6">
            <button
              onClick={() => setAgreementModalApp(null)}
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  agreementModalApp.app.partnershipAgreement?.status === "active"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {agreementModalApp.app.partnershipAgreement?.status === "active" ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Partnership Agreement • Active</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Partnership Agreement Offered • Pending Your Signature</span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                {agreementModalApp.campaign?.title || "Campaign Partnership"}
              </h2>
              <p className="text-xs text-stone-500">
                Official partnership proposal between you and {agreementModalApp.campaign?.sellerId?.name || "Brand Partner"}
              </p>
            </div>

            {/* Partnership Details Card */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-stone-200/60">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Agreed Commission</span>
                  <span className="text-base font-extrabold text-purple-700">
                    {agreementModalApp.app.partnershipAgreement?.agreedCommissionRate ||
                      agreementModalApp.campaign?.boostedCommissionRate}%
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200/60">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Agreement Status</span>
                  {agreementModalApp.app.partnershipAgreement?.status === "active" ? (
                    <span className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" /> Active & Verified
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                      <Clock className="w-4 h-4" /> Awaiting Signature
                    </span>
                  )}
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200/60">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Settlement Escrow</span>
                  <span className="text-xs font-bold text-stone-900 mt-0.5 block">
                    Arifpay Protected
                  </span>
                </div>
              </div>

              {/* Action Banner for Pending Creator Acceptance */}
              {agreementModalApp.app.partnershipAgreement?.status !== "active" && (
                <div className="p-4 bg-purple-50/90 rounded-2xl border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-700" />
                      <span>Company has approved and signed this agreement</span>
                    </h5>
                    <p className="text-[11px] text-purple-800 leading-relaxed">
                      Per marketplace governance rules, affiliate tracking credentials and product links are generated only after both parties accept. Review the terms below and sign to activate.
                    </p>
                  </div>
                  <button
                    onClick={handleAcceptAgreement}
                    disabled={isAcceptingAgreement}
                    className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 disabled:opacity-50"
                  >
                    {isAcceptingAgreement ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Accept & Sign Agreement</span>
                  </button>
                </div>
              )}

              {/* Official Tracking Code (Active Only) */}
              {agreementModalApp.app.partnershipAgreement?.status === "active" &&
                agreementModalApp.app.partnershipAgreement?.affiliateCode && (
                  <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-900 block">
                        Official Partner Tracking Code
                      </span>
                      <span className="font-mono font-black text-purple-950 text-sm sm:text-base">
                        {agreementModalApp.app.partnershipAgreement.affiliateCode}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        copyTrackingCode(agreementModalApp.app.partnershipAgreement!.affiliateCode)
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors shrink-0"
                    >
                      {copiedId === "code" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === "code" ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                )}

              {/* Agreement Terms */}
              <div className="text-[11px] text-stone-600 leading-relaxed pt-1">
                <span className="font-semibold text-stone-800 block mb-0.5">Contract Terms & Attributions:</span>
                {agreementModalApp.app.partnershipAgreement?.agreementTerms ||
                  "Arifpay escrow protection applies to all orders. Commission payouts are released upon confirmed customer delivery. Standard 5% platform service fee applies."}
              </div>
            </div>

            {/* Enrolled Products Tracking Links */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-stone-900">
                  Eligible Campaign Products
                </h4>
                {agreementModalApp.app.partnershipAgreement?.status !== "active" && (
                  <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Links locked until agreement signed
                  </span>
                )}
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {agreementModalApp.campaign?.products?.map((prod) => {
                  const isCopied = copiedId === prod._id;
                  const rate =
                    agreementModalApp.app.partnershipAgreement?.agreedCommissionRate ||
                    agreementModalApp.campaign?.boostedCommissionRate ||
                    10;
                  const estEarning = Math.round((prod.price * rate) / 100);
                  const isActive = agreementModalApp.app.partnershipAgreement?.status === "active";

                  return (
                    <div
                      key={prod._id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"}
                          alt={prod.name}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-stone-900 truncate">{prod.name}</h5>
                          <p className="text-[11px] text-stone-500">
                            ETB {prod.price.toLocaleString()} •{" "}
                            <span className="text-purple-700 font-bold">~ETB {estEarning} commission</span>
                          </p>
                        </div>
                      </div>

                      {isActive ? (
                        <button
                          onClick={() =>
                            copyTrackingLink(
                              prod._id,
                              agreementModalApp.app.partnershipAgreement?.affiliateCode || ""
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                            isCopied ? "bg-green-600 text-white" : "bg-stone-900 hover:bg-stone-800 text-white"
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          <span>{isCopied ? "Link Copied" : "Copy Tracking Link"}</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shrink-0"
                          title="Sign agreement to unlock tracking link"
                        >
                          Link Locked
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setAgreementModalApp(null)}
                className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Campaign Brief Details */}
      {briefModalCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto relative space-y-6">
            <button
              onClick={() => setBriefModalCampaign(null)}
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> {briefModalCampaign.boostedCommissionRate}% Boosted Commission
              </div>
              <h2 className="text-2xl font-bold text-stone-900">{briefModalCampaign.title}</h2>
              <p className="text-xs text-stone-500 mt-1">
                Offered by {briefModalCampaign.sellerId?.name} • Valid until{" "}
                {new Date(briefModalCampaign.endDate).toLocaleDateString()}
              </p>
            </div>

            {briefModalCampaign.description && (
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 text-xs text-stone-700 leading-relaxed">
                <span className="font-bold text-stone-900 block mb-1">Campaign Brief & Guidelines:</span>
                {briefModalCampaign.description}
              </div>
            )}

            {/* Application Governance Notice: No link generation until approved */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Partner Approval Required for Tracking</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                In accordance with campaign rules, tracking credentials and shoppable referral links are issued exclusively after your partnership application is reviewed and approved by the company.
              </p>
            </div>

            {/* Enrolled products preview */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider text-stone-400 mb-3">
                Eligible Products ({briefModalCampaign.products?.length || 0})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {briefModalCampaign.products?.map((prod) => (
                  <div
                    key={prod._id}
                    className="p-3 rounded-xl border border-stone-200 flex items-center gap-3 bg-white"
                  >
                    <img
                      src={prod.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"}
                      alt={prod.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">{prod.name}</p>
                      <p className="text-[11px] text-stone-500">ETB {prod.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action footer */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => setBriefModalCampaign(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>

              {user?.role === "creator" && !creatorApps[briefModalCampaign._id] && (
                <button
                  onClick={() => {
                    const camp = briefModalCampaign;
                    setBriefModalCampaign(null);
                    handleOpenApplyModal(camp);
                  }}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Apply for Partnership
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
