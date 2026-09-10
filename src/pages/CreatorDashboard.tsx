import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import WithdrawalModal from "../components/WithdrawalModal";
import { BarChart3, Package, Users, DollarSign, Store, Megaphone, ArrowUpRight, Wallet } from "lucide-react";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [refStats, setRefStats] = useState({ clicks: 0, conversions: 0, earnings: 0 });
  const [financials, setFinancials] = useState({ availableBalance: 0, totalEarned: 0, totalWithdrawn: 0 });
  const [activeCampaignsCount, setActiveCampaignsCount] = useState<number>(0);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const [refRes, balRes, campRes] = await Promise.allSettled([
        api.get("/referral/stats"),
        api.get("/payments/balance"),
        api.get("/campaigns"),
      ]);

      if (refRes.status === "fulfilled" && refRes.value?.data) {
        setRefStats({
          clicks: refRes.value.data.clicks ?? 0,
          conversions: refRes.value.data.conversions ?? 0,
          earnings: refRes.value.data.earnings ?? 0,
        });
      } else {
        setRefStats({ clicks: 0, conversions: 0, earnings: 0 });
      }

      if (balRes.status === "fulfilled" && balRes.value?.data) {
        setFinancials({
          availableBalance: balRes.value.data.availableBalance ?? 0,
          totalEarned: balRes.value.data.totalEarned ?? 0,
          totalWithdrawn: balRes.value.data.totalWithdrawn ?? 0,
        });
      } else {
        setFinancials({ availableBalance: 0, totalEarned: 0, totalWithdrawn: 0 });
      }

      if (campRes.status === "fulfilled" && campRes.value?.data) {
        const active = Array.isArray(campRes.value.data)
          ? campRes.value.data.filter((c: any) => c.status === "active").length
          : 0;
        setActiveCampaignsCount(active);
      } else {
        setActiveCampaignsCount(0);
      }
    } catch {
      // Safe fallback
      setRefStats({ clicks: 0, conversions: 0, earnings: 0 });
      setFinancials({ availableBalance: 0, totalEarned: 0, totalWithdrawn: 0 });
      setActiveCampaignsCount(0);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = [
    { label: "Available to Cash Out", value: `ETB ${financials.availableBalance.toLocaleString()}`, icon: Wallet, trend: "Instant" },
    { label: "Total Lifetime Earned", value: `ETB ${financials.totalEarned.toLocaleString()}`, icon: DollarSign, trend: "Net" },
    { label: "Referral Clicks", value: refStats.clicks.toLocaleString(), icon: Users, trend: `${refStats.conversions} orders` },
    { label: "Active Campaigns", value: activeCampaignsCount.toString(), icon: Megaphone, trend: "Promote" },
  ];


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
            to="/payouts"
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Wallet className="w-5 h-5" />
            Payout History
          </Link>
        </div>

      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-100">
                  <Icon className="w-6 h-6 text-stone-700" />
                </div>
                <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {stat.trend}
                </span>
              </div>
              <p className="text-sm text-stone-500 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{stat.value}</h3>
            </div>
          );
        })}
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

      <WithdrawalModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={financials.availableBalance}
        onSuccess={fetchStats}
      />
    </div>
  );
}
