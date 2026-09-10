import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import WithdrawalModal from "../components/WithdrawalModal";
import { Package, TrendingUp, DollarSign, Store, Megaphone, CheckCircle2, Truck, ArrowRight, Wallet, ArrowUpRight } from "lucide-react";

export default function BrandDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [financials, setFinancials] = useState({ availableBalance: 0, totalEarned: 0, totalWithdrawn: 0 });
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, balRes] = await Promise.allSettled([
        api.get("/orders"),
        api.get("/payments/balance"),
      ]);

      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        setOrders(ordersRes.value.data);
      } else {
        setOrders([]);
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
    } catch {
      // Safe fallback
      setOrders([]);
      setFinancials({ availableBalance: 0, totalEarned: 0, totalWithdrawn: 0 });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalRevenue = financials.totalEarned || orders.reduce((sum, o) => sum + (o.sellerPayout || 0), 0);
  const deliveredCount = orders.filter((o) => o.orderStatus === "delivered").length;
  const fulfillmentRate = orders.length > 0 ? `${Math.round((deliveredCount / orders.length) * 100)}%` : "100%";

  // Stats
  const stats = [
    { label: "Available to Cash Out", value: `ETB ${financials.availableBalance.toLocaleString()}`, icon: Wallet, trend: "Instant" },
    { label: "Total Lifetime Sales", value: `ETB ${totalRevenue.toLocaleString()}`, icon: DollarSign, trend: "Net" },
    { label: "Active Orders", value: orders.length.toString(), icon: Package, trend: `${deliveredCount} delivered` },
    { label: "Fulfillment Rate", value: fulfillmentRate, icon: TrendingUp, trend: `${deliveredCount}/${orders.length || 0}` },
  ];


  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Welcome back, {user?.name}!
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
          </h1>
          <p className="text-stone-400 mt-2">
            Available balance: <span className="text-white font-bold">ETB {financials.availableBalance.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
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
            Payouts
          </Link>
          <Link
            to="/shop-settings"
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Store className="w-5 h-5" />
            Manage Shop
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
        
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-900">Recent Orders</h2>
            <Link to="/orders" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
              View all
            </Link>
          </div>
          
          {/* Orders list or Empty State */}
          {orders.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-stone-100 rounded-2xl">
              <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-stone-900">No recent orders</h3>
              <p className="text-stone-500 mt-1 max-w-sm mx-auto">
                When customers purchase your products, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div key={order._id} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-stone-900">{order.orderNumber}</span>
                    <p className="text-xs text-stone-500 mt-0.5">{order.customerName} • {order.items.length} item(s)</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-stone-900">ETB {order.totalAmount?.toLocaleString()}</span>
                    <span className="block text-[11px] text-green-700 font-semibold capitalize">{order.orderStatus}</span>
                  </div>
                </div>
              ))}
              <Link to="/orders" className="block text-center text-xs font-semibold text-stone-700 hover:text-stone-900 pt-2">
                Manage all {orders.length} orders & dispatch &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links / Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8">
            <h2 className="text-lg font-bold text-stone-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/payouts" className="flex items-center justify-between p-4 rounded-2xl hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-stone-900">Payouts & Wallet</span>
                </div>
              </Link>
              <Link to="/orders" className="flex items-center justify-between p-4 rounded-2xl hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Truck className="w-5 h-5 text-amber-700" />
                  </div>
                  <span className="font-medium text-stone-900">Manage & Ship Orders</span>
                </div>
              </Link>
              <Link to="/campaigns/new" className="flex items-center justify-between p-4 rounded-2xl hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-stone-900">Create Campaign</span>
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
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
