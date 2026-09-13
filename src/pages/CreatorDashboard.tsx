import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import toast from "react-hot-toast";
import WithdrawalModal from "../components/WithdrawalModal";
import {
  BarChart3,
  Package,
  Users,
  DollarSign,
  Store,
  Megaphone,
  ArrowUpRight,
  Wallet,
  Sparkles,
  ShieldCheck,
  Clock,
  Send,
  ExternalLink,
  CheckCircle2,
  FileText,
  ArrowRight,
  Share2,
} from "lucide-react";

interface ICreatorApp {
  _id: string;
  campaignId: {
    _id: string;
    title: string;
    boostedCommissionRate: number;
    status: string;
  };
  companyId: {
    _id: string;
    name: string;
    email: string;
  };
  status: "pending" | "approved" | "rejected";
  pitchMessage: string;
  channels: string[];
  partnershipAgreement?: {
    status: "pending_company_acceptance" | "pending_creator_acceptance" | "active" | "rejected" | "terminated" | "expired";
    agreedCommissionRate: number;
    affiliateCode?: string;
    approvedAt?: string;
    agreementId?: string;
    agreementTerms?: string;
  };
  agreementId?: string;
  createdAt: string;
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [analyticsSummary, setAnalyticsSummary] = useState({
    clicks: 0,
    orders: 0,
    conversionRate: 0,
    pendingCommission: 0,
    totalCommission: 0,
  });
  const [financials, setFinancials] = useState({ availableBalance: 0, totalEarned: 0, totalWithdrawn: 0 });
  const [activeCampaignsCount, setActiveCampaignsCount] = useState<number>(0);
  const [applications, setApplications] = useState<ICreatorApp[]>([]);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [acceptingAgreementId, setAcceptingAgreementId] = useState<string | null>(null);

  const handleAcceptAgreement = async (app: ICreatorApp) => {
    const agreementId = app.agreementId || app.partnershipAgreement?.agreementId;
    setAcceptingAgreementId(app._id);
    try {
      if (agreementId) {
        await api.patch(`/agreements/${agreementId}/accept`);
      } else {
        const { data: userAgreements } = await api.get("/agreements");
        const matched = userAgreements.find(
          (a: any) =>
            a.campaignId?._id === app.campaignId?._id ||
            a.applicationId === app._id
        );
        if (!matched) {
          throw new Error("Could not find matching agreement");
        }
        await api.patch(`/agreements/${matched._id}/accept`);
      }
      await fetchStats();
      toast.success("Partnership agreement accepted!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to accept agreement");
    } finally {
      setAcceptingAgreementId(null);
    }
  };

  const fetchStats = async () => {
    try {
      const [analyticsRes, balRes, campRes, appRes] = await Promise.allSettled([
        api.get("/referral/analytics"),
        api.get("/payments/balance"),
        api.get("/campaigns"),
        api.get("/campaigns/creator/applications"),
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data?.summary) {
        const summary = analyticsRes.value.data.summary;
        setAnalyticsSummary({
          clicks: summary.clicks ?? 0,
          orders: summary.orders ?? 0,
          conversionRate: summary.conversionRate ?? 0,
          pendingCommission: summary.pendingCommission ?? 0,
          totalCommission: summary.totalCommission ?? 0,
        });
      }

      if (balRes.status === "fulfilled" && balRes.value?.data) {
        setFinancials({
          availableBalance: balRes.value.data.availableBalance ?? 0,
          totalEarned: balRes.value.data.totalEarned ?? 0,
          totalWithdrawn: balRes.value.data.totalWithdrawn ?? 0,
        });
      }

      if (campRes.status === "fulfilled" && campRes.value?.data) {
        const active = Array.isArray(campRes.value.data)
          ? campRes.value.data.filter((c: any) => c.status === "active").length
          : 0;
        setActiveCampaignsCount(active);
      }

      if (appRes.status === "fulfilled" && Array.isArray(appRes.value?.data)) {
        setApplications(appRes.value.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Computed derived states for campaigns
  const appliedCampaignsCount = applications.filter(a => a.status === "pending").length;
  const approvedCampaignsCount = applications.filter(a => a.status === "approved").length;
  const awaitingAcceptanceCount = applications.filter(a =>
    a.partnershipAgreement?.status === "pending_creator_acceptance" ||
    a.partnershipAgreement?.status === "pending_company_acceptance"
  ).length;
  const activePartnershipsCount = applications.filter(a => a.partnershipAgreement?.status === "active").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-stone-400 mt-2">
            Available to withdraw: <span className="text-white font-bold">ETB {financials.availableBalance.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/dashboard/analytics"
            className="flex items-center gap-2 bg-[#2E7D32] hover:bg-green-800 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-white" />
            Analytics
          </Link>
          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="flex items-center gap-2 bg-white text-stone-900 hover:bg-stone-100 px-5 py-2.5 rounded-xl font-semibold transition-colors"
          >
            <ArrowUpRight className="w-5 h-5 text-stone-900" />
            Withdraw Earnings
          </button>
          <Link
            to="/profile/edit"
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            Creator Profile
          </Link>
          <Link
            to="/payouts"
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Wallet className="w-5 h-5" />
            Payout History
          </Link>
        </div>

      </div>

      {/* Stats Grids Grouped */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financials Group */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2 border-b border-stone-50 pb-3">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Financials
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500 font-medium">Available Balance</p>
              <p className="text-xl font-bold text-stone-900 mt-0.5">ETB {financials.availableBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Pending Commission</p>
              <p className="text-xl font-bold text-stone-900 mt-0.5">ETB {analyticsSummary.pendingCommission.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Confirmed Commission</p>
              <p className="text-xl font-bold text-stone-900 mt-0.5">ETB {analyticsSummary.totalCommission.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Total Withdrawn</p>
              <p className="text-xl font-bold text-stone-900 mt-0.5">ETB {financials.totalWithdrawn.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Marketing & Performance Group */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2 border-b border-stone-50 pb-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Performance Tracking
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500 font-medium">Affiliate Clicks</p>
              <p className="text-xl font-bold text-stone-900 mt-0.5">{analyticsSummary.clicks.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Referred Orders</p>
              <p className="text-xl font-bold text-stone-900 mt-0.5">{analyticsSummary.orders.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Conversion Rate</p>
              <p className="text-xl font-bold text-stone-900 mt-0.5">{analyticsSummary.conversionRate.toLocaleString()}%</p>
            </div>
          </div>
        </div>

        {/* Partnership Group */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2 border-b border-stone-50 pb-3">
            <Users className="w-5 h-5 text-purple-600" />
            Partnerships
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500 font-medium">Available Campaigns</p>
              <p className="text-xl font-bold text-stone-900 mt-0.5">{activeCampaignsCount}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Applied Campaigns</p>
              <p className="text-xl font-bold text-stone-900 mt-0.5">{appliedCampaignsCount}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Approved Campaigns</p>
              <p className="text-xl font-bold text-stone-900 mt-0.5">{approvedCampaignsCount}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Active Partnerships</p>
              <p className="text-xl font-bold text-stone-900 mt-0.5">{activePartnershipsCount}</p>
            </div>
            {awaitingAcceptanceCount > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded inline-block mt-2">
                  {awaitingAcceptanceCount} Agreement{awaitingAcceptanceCount > 1 ? 's' : ''} Awaiting Signature
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Recent Orders / Referrals */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-900">Recent Activity</h2>
            <Link to="/orders" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
              View all
            </Link>
          </div>
          
          {/* Empty State for MVP */}
          <div className="text-center py-12 border-2 border-dashed border-stone-100 rounded-2xl">
            <BarChart3 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-stone-900">No recent activity</h3>
            <p className="text-stone-500 mt-1 max-w-sm mx-auto">
              When you make a sale or someone buys through your affiliate link, it will appear here.
            </p>
          </div>
        </div>

        {/* Quick Links / Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8">
            <h2 className="text-lg font-bold text-stone-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/dashboard/analytics" className="flex items-center justify-between p-4 rounded-2xl hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5 text-[#2E7D32]" />
                  </div>
                  <span className="font-medium text-stone-900">Creator Analytics</span>
                </div>
              </Link>
              <Link to="/payouts" className="flex items-center justify-between p-4 rounded-2xl hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-all group">

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-stone-900">Payouts & Wallet</span>
                </div>
              </Link>
              <Link to="/campaigns" className="flex items-center justify-between p-4 rounded-2xl hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-stone-900">Find Campaigns</span>
                </div>
              </Link>
              <Link to="/profile" className="flex items-center justify-between p-4 rounded-2xl hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium text-stone-900">Edit Profile</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Campaign Partnerships & Applications Section */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-600" />
              <span>My Brand Campaign Partnerships & Applications</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Track the status of your brand proposals and access your verified partnership agreements.
            </p>
          </div>
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors self-start sm:self-auto"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Browse Active Campaigns</span>
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-stone-100 rounded-2xl space-y-3">
            <Megaphone className="w-10 h-10 text-stone-300 mx-auto" />
            <h4 className="text-sm font-bold text-stone-800">No campaign applications yet</h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Brands are actively looking for Ethiopian creators on TikTok, Telegram, and Instagram. Apply to boosted campaigns to earn up to 25%+ per sale.
            </p>
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2E7D32] hover:bg-green-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <span>Explore Campaigns & Apply</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app) => {
              const isApproved = app.status === "approved";
              const isPending = app.status === "pending";

              return (
                <div
                  key={app._id}
                  className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-all space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {app.companyId?.name || "Brand Partner"}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 mt-1">
                        {app.campaignId?.title || "Campaign"}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800"
                          : isPending
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-3 h-3" />}
                      {isPending && <Clock className="w-3 h-3" />}
                      {app.status}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 italic bg-stone-50 p-2.5 rounded-lg">
                    "{app.pitchMessage}"
                  </p>

                  {isApproved && app.partnershipAgreement && (
                    app.partnershipAgreement.status === "active" ? (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-900">Agreed Commission:</span>
                          <span className="font-extrabold text-purple-700">
                            {app.partnershipAgreement.agreedCommissionRate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-900">Official Tracking Code:</span>
                          <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-purple-900 font-bold">
                            {app.partnershipAgreement.affiliateCode}
                          </code>
                        </div>
                        <button
                          onClick={() => {
                            if (app.partnershipAgreement?.affiliateCode) {
                              navigator.clipboard.writeText(app.partnershipAgreement.affiliateCode);
                              toast.success("Affiliate tracking code copied!");
                            }
                          }}
                          className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Copy Affiliate Tracking Code</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-purple-900">Offered Commission:</span>
                          <span className="font-extrabold text-purple-700">
                            {app.partnershipAgreement.agreedCommissionRate}%
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-800">
                          Brand approved! Sign agreement to activate tracking credentials.
                        </p>
                        <button
                          onClick={() => handleAcceptAgreement(app)}
                          disabled={acceptingAgreementId === app._id}
                          className="w-full py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {acceptingAgreementId === app._id ? "Signing..." : "Accept Partnership Agreement"}
                          </span>
                        </button>
                      </div>
                    )
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs border-t border-stone-100">
                    <span className="text-stone-400 text-[11px]">
                      Applied on {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      to="/campaigns"
                      className="text-stone-900 font-bold hover:text-[#2E7D32] flex items-center gap-1 transition-colors"
                    >
                      <span>View in Campaigns</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WithdrawalModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={financials.availableBalance}
        onSuccess={fetchStats}
      />
    </div>
  );
}
