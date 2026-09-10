import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { CreatorAnalyticsResponse } from "../types/analytics";
import WithdrawalModal from "../components/WithdrawalModal";
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Wallet,
  Clock,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  Calendar,
  Percent,
  Package,
  Megaphone,
  CheckCircle2,
  ChevronRight,
  ArrowRight
} from "lucide-react";

export default function CreatorAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<CreatorAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<"clicks" | "orders" | "sales" | "commission">("commission");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<CreatorAnalyticsResponse>("/referral/analytics");
      if (response.data && response.data.summary) {
        setData(response.data);
      } else {
        throw new Error("Invalid analytics payload structure");
      }
    } catch (err: any) {
      console.error("Failed to load creator analytics:", err);
      setError(
        err.response?.data?.message ||
        "Unable to load Creator Analytics. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (amount: number) => {
    return `${(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ETB`;
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // -------------------------------------------------------------
  // UX State: Loading Skeleton
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded-lg" />
            <div className="h-4 w-96 bg-gray-100 rounded-lg max-w-full" />
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded-xl" />
        </div>

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="w-16 h-5 bg-gray-100 rounded-full" />
              </div>
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-7 w-32 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Escrow Banner Skeleton */}
        <div className="h-28 bg-gray-100 rounded-2xl border border-gray-200" />

        {/* Chart Skeleton */}
        <div className="h-80 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-56 bg-gray-50 rounded-xl flex items-end justify-between p-6 gap-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-full bg-gray-200 rounded-t" style={{ height: `${(i + 2) * 12}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // UX State: Error State with Retry
  // -------------------------------------------------------------
  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Analytics Unavailable</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {error || "We couldn't retrieve your latest creator performance data right now."}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchAnalytics}
              className="inline-flex items-center justify-center gap-2 bg-[#2E7D32] hover:bg-green-800 text-white font-medium px-5 py-2.5 rounded-xl transition-colors min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-xl transition-colors min-h-[44px]"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { summary, topProducts, topCampaigns, trend } = data;

  // Compute trend scale metrics for chart visualization
  const maxTrendVal = Math.max(
    ...trend.map((t) => t[activeMetric] || 0),
    1 // avoid division by zero
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2E7D32] mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Creator Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Creator Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Real-time affiliate traffic, verified order conversions, and live escrow earnings for{" "}
            <span className="font-semibold text-gray-800">{user?.name}</span>.
          </p>
        </div>

        {/* Date Context & Payout Action */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3.5 py-2 rounded-xl border border-gray-200/60">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>Last 7 Days</span>
          </div>
          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="flex items-center gap-2 bg-[#2E7D32] hover:bg-green-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors min-h-[44px]"
            aria-label="Withdraw available earnings"
          >
            <Wallet className="w-4 h-4" />
            <span>Withdraw ETB</span>
          </button>
        </div>
      </div>

      {/* 2. Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Affiliate Clicks */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              Traffic
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Affiliate Clicks</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {(summary.clicks || 0).toLocaleString()}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Tracked referral clicks</p>
          </div>

        </div>

        {/* Attributed Orders */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center border border-purple-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full font-semibold">
              {summary.conversionRate}% Conv.
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Attributed Orders</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {(summary.orders || 0).toLocaleString()}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Verified customer purchases</p>
          </div>
        </div>

        {/* Total Attributed Sales */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center border border-amber-100">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">
              Gross GMV
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Referred Sales</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {formatCurrency(summary.totalSales)}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Merchant merchandise sales</p>
          </div>
        </div>

        {/* Total Earned Commission */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-emerald-50 text-[#2E7D32] rounded-xl flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full font-semibold">
              Lifetime
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-emerald-900 font-semibold">Total Commission</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2E7D32] mt-1">
              {formatCurrency(summary.totalCommission)}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Net affiliate commission generated</p>
          </div>
        </div>
      </div>

      {/* 3. Escrow Financial Lifecycle Overview */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-stone-800 text-stone-300 text-xs font-medium px-3 py-1 rounded-full">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>EthioInfluence 100% Escrow Protection</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Commission Liquidity & Escrow Breakdown
            </h3>
            <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
              Earnings transition automatically from pending escrow to available balance as soon as orders are delivered and verified.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Available Balance */}
            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Available Balance
                  </span>
                </div>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                  Instant Cashout
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary.availableCommission)}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Cleared from delivered orders minus past payouts.
              </p>
            </div>

            {/* Pending Escrow */}
            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Pending Escrow
                  </span>
                </div>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
                  In Transit
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-300">
                {formatCurrency(summary.pendingCommission)}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Held securely in escrow until order delivery is confirmed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 7-Day Performance Trend Chart */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              7-Day Conversion & Revenue Trend
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Daily activity tracking across referral clicks, orders, sales volume, and commission.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1.5 rounded-xl border border-gray-200/60" role="tablist">
            {(
              [
                { id: "commission", label: "Commission (ETB)" },
                { id: "sales", label: "Sales (ETB)" },
                { id: "orders", label: "Orders" },
                { id: "clicks", label: "Clicks" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeMetric === tab.id}
                onClick={() => setActiveMetric(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeMetric === tab.id
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="pt-4">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-56 pb-2 border-b border-gray-100">
            {trend.map((point, index) => {
              const val = point[activeMetric] || 0;
              const heightPercent = maxTrendVal > 0 ? Math.max((val / maxTrendVal) * 100, 4) : 4;
              const isToday = index === trend.length - 1;

              return (
                <div key={point.date} className="flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-12 z-20 bg-stone-900 text-white text-[11px] rounded-lg py-1 px-2.5 shadow-lg whitespace-nowrap transition-opacity">
                    <span className="font-bold">
                      {activeMetric === "commission" || activeMetric === "sales"
                        ? formatCurrency(val)
                        : `${val} ${activeMetric}`}
                    </span>
                    <span className="text-stone-400 block text-[9px]">{formatDateLabel(point.date)}</span>
                  </div>

                  {/* Value Above Bar */}
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5 text-center">
                    {activeMetric === "commission" || activeMetric === "sales"
                      ? val > 999 ? `${(val / 1000).toFixed(1)}k` : val
                      : val}
                  </span>

                  {/* Bar Element */}
                  <div
                    className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                      isToday
                        ? "bg-[#2E7D32] hover:bg-green-800"
                        : val > 0
                        ? "bg-emerald-600/80 hover:bg-emerald-600"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-Axis Date Labels */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-3 text-center">
            {trend.map((point, index) => (
              <div key={point.date} className="space-y-0.5">
                <span className={`text-[11px] sm:text-xs block font-medium ${
                  index === trend.length - 1 ? "text-[#2E7D32] font-bold" : "text-gray-500"
                }`}>
                  {formatDateLabel(point.date)}
                </span>
                {index === trend.length - 1 && (
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                    Today
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Top Products Breakdown */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Top Performing Products
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Merchandise that generated the highest commission and conversion volume through your link.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            {topProducts.length} {topProducts.length === 1 ? "product" : "products"} recorded
          </span>
        </div>

        {topProducts.length === 0 ? (
          /* Empty State for Products */
          <div className="text-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-2xl space-y-3">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto border border-gray-100">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-800">No product sales yet</h4>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
              Share your affiliate links from the Feed or active Campaigns to start generating product sales and commission.
            </p>
            <div className="pt-2">
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2E7D32] hover:text-green-800"
              >
                <span>Browse Boosted Campaigns</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Products Table / Responsive List */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3 text-center">Orders</th>
                  <th className="py-3 px-3 text-center">Units Sold</th>
                  <th className="py-3 px-3 text-right">Referred Sales</th>
                  <th className="py-3 px-3 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {topProducts.map((product) => (
                  <tr key={product.productId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                          {product.productImage ? (
                            <img
                              src={product.productImage}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{product.productName}</p>
                          <Link
                            to={product.productId !== "unknown" ? `/product/${product.productId}` : "#"}
                            className="text-xs text-[#2E7D32] hover:underline inline-flex items-center gap-1"
                          >
                            <span>View Storefront</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-gray-700">
                      {product.ordersCount}
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-gray-700">
                      {product.unitsSold}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-gray-900">
                      {formatCurrency(product.revenueGenerated)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#2E7D32]">
                      {formatCurrency(product.commissionEarned)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Top Campaigns Breakdown (Empty/Informational State Handling) */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Promotional Campaigns</h3>
              <p className="text-xs text-gray-500">
                Track boosted commission performance from brand marketing partnerships.
              </p>
            </div>
          </div>
        </div>

        {topCampaigns.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-1">
              <p className="text-sm font-semibold text-gray-800">
                No active boosted campaign attribution records yet
              </p>
              <p className="text-xs text-gray-500 max-w-lg leading-relaxed">
                When you share products enrolled in boosted brand campaigns, your higher commission overrides will automatically apply and report here.
              </p>
            </div>
            <Link
              to="/campaigns"
              className="shrink-0 bg-white hover:bg-gray-100 border border-gray-200 text-gray-900 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2 min-h-[40px]"
            >
              <span>Explore Campaigns</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {topCampaigns.map((camp) => (
              <div key={camp.campaignId} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{camp.title}</h4>
                  <span className="text-xs text-[#2E7D32] font-semibold">{camp.boostedRate}% Boosted Rate</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(camp.commissionEarned)}</p>
                  <p className="text-xs text-gray-500">{camp.ordersCount} orders</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Modal Integration */}
      <WithdrawalModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={summary.availableCommission}
        onSuccess={fetchAnalytics}
      />
    </div>
  );
}

// Local helper component for ShieldCheck icon to avoid duplicate imports
function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}
