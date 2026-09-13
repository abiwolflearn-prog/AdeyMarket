import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Loader2,
  Calendar,
  CreditCard,
  Sparkles,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";

interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface IOrder {
  _id: string;
  orderNumber: string;
  items: IOrderItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    street: string;
    city: string;
    subcity?: string;
    note?: string;
  };
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingNumber?: string;
  shippingCarrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  sellerId?: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBuyerOrders();
    }
  }, [user]);

  const fetchBuyerOrders = async () => {
    if (!user) return; // Wait for auth
    try {
      setIsLoading(true);
      const { data } = await api.get("/orders?type=purchased");
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load buyer orders:", error);
      toast.error("Failed to load your orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      setConfirmingOrderId(orderId);
      const { data } = await api.patch(`/orders/${orderId}/deliver`);
      toast.success("Delivery confirmed! Thank you for verifying receipt.");
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? data.order : o))
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to confirm delivery");
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.orderStatus === statusFilter;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      (order.trackingNumber &&
        order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const activeOrdersCount = orders.filter(
    (o) => o.orderStatus === "pending" || o.orderStatus === "processing" || o.orderStatus === "shipped"
  ).length;
  const deliveredOrdersCount = orders.filter((o) => o.orderStatus === "delivered").length;
  const totalSpent = orders
    .filter((o) => o.paymentStatus === "paid" || o.orderStatus === "delivered")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-[#2E7D32] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Buyer Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900">
            Welcome back, {user?.name || "Shopper"}!
          </h1>
          <p className="text-stone-500 text-sm mt-1 max-w-xl">
            Track your shipments in real-time, view order receipts, and manage your delivery addresses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/directory"
            className="inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-green-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xs"
          >
            <Store className="w-4 h-4" /> Explore Brands
          </Link>
          <Link
            to="/bag"
            className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <ShoppingBag className="w-4 h-4" /> View Bag
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Active Shipments
            </span>
            <span className="text-2xl font-black text-stone-900">
              {activeOrdersCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Delivered Orders
            </span>
            <span className="text-2xl font-black text-stone-900">
              {deliveredOrdersCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Total Purchases
            </span>
            <span className="text-2xl font-black text-stone-900">
              ETB {totalSpent.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-stone-700" /> My Orders & Shipments
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Live updates for packages dispatched by Ethiopian artisan stores.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders or items..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["all", "processing", "shipped", "delivered"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                    statusFilter === status
                      ? "bg-stone-900 text-white shadow-xs"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center shadow-sm">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-900">No purchases found</h3>
            <p className="text-stone-500 text-sm mt-1 max-w-sm mx-auto">
              {orders.length === 0
                ? "You haven't placed any orders yet. Discover unique fashion, art, and coffee from Ethiopian sellers!"
                : "No orders match your filter criteria."}
            </p>
            {orders.length === 0 && (
              <Link
                to="/directory"
                className="inline-flex items-center gap-2 mt-5 bg-stone-900 hover:bg-stone-800 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm space-y-6"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-stone-900 text-base md:text-lg">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          order.orderStatus === "delivered"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : order.orderStatus === "shipped"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {order.sellerId && (
                        <>
                          <span>•</span>
                          <span>Seller: <strong>{order.sellerId.name}</strong></span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {order.orderStatus === "shipped" && (
                      <button
                        onClick={() => handleConfirmDelivery(order._id)}
                        disabled={confirmingOrderId === order._id}
                        className="inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-green-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
                      >
                        {confirmingOrderId === order._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Confirm Package Received
                      </button>
                    )}

                    <Link
                      to={`/order-confirmation/${order._id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Receipt & Tracking
                    </Link>
                  </div>
                </div>

                {/* Shipped Tracking Notification Box if in transit */}
                {order.orderStatus === "shipped" && order.trackingNumber && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <span className="font-semibold block">Package in Transit</span>
                        <span>
                          Courier: <strong>{order.shippingCarrier || "Local Courier"}</strong> • Tracking code:{" "}
                          <strong className="font-mono">{order.trackingNumber}</strong>
                        </span>
                      </div>
                    </div>
                    {order.shippedAt && (
                      <span className="text-blue-700 sm:text-right">
                        Dispatched {new Date(order.shippedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Delivery Lifecycle Step Bar */}
                <div className="py-2">
                  <div className="grid grid-cols-3 text-center text-xs font-medium">
                    {/* Step 1: Processing */}
                    <div className="space-y-1.5">
                      <div
                        className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                          order.orderStatus === "processing" || order.orderStatus === "shipped" || order.orderStatus === "delivered"
                            ? "bg-stone-900 text-white"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        1
                      </div>
                      <span className="text-stone-800 font-semibold block">Processing</span>
                      <span className="text-[11px] text-stone-400 hidden sm:block">Seller packing items</span>
                    </div>

                    {/* Step 2: Shipped */}
                    <div className="space-y-1.5">
                      <div
                        className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                          order.orderStatus === "shipped" || order.orderStatus === "delivered"
                            ? "bg-stone-900 text-white"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        2
                      </div>
                      <span className="text-stone-800 font-semibold block">Shipped</span>
                      <span className="text-[11px] text-stone-400 hidden sm:block">With courier</span>
                    </div>

                    {/* Step 3: Delivered */}
                    <div className="space-y-1.5">
                      <div
                        className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                          order.orderStatus === "delivered"
                            ? "bg-green-600 text-white"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        ✓
                      </div>
                      <span className="text-stone-800 font-semibold block">Delivered</span>
                      <span className="text-[11px] text-stone-400 hidden sm:block">Package received</span>
                    </div>
                  </div>
                </div>

                {/* Ordered Items Summary */}
                <div className="grid md:grid-cols-12 gap-6 pt-4 border-t border-stone-100">
                  <div className="md:col-span-8 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Items in Package
                    </h4>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-stone-50/60 p-3 rounded-2xl">
                        <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-stone-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-stone-900 truncate">{item.name}</p>
                          <p className="text-xs text-stone-500">
                            Qty: {item.quantity} × ETB {item.price.toLocaleString()}
                          </p>
                        </div>
                        <span className="font-bold text-sm text-stone-900">
                          ETB {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Info */}
                  <div className="md:col-span-4 bg-stone-50 rounded-2xl p-4 border border-stone-100 flex flex-col justify-between text-xs space-y-3">
                    <div>
                      <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] block mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-500" /> Destination
                      </span>
                      <p className="font-medium text-stone-900">{order.customerName}</p>
                      <p className="text-stone-600 mt-0.5">{order.shippingAddress.street}</p>
                      <p className="text-stone-600">
                        {order.shippingAddress.subcity && `${order.shippingAddress.subcity}, `}
                        {order.shippingAddress.city}
                      </p>
                      <p className="text-stone-500 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" /> {order.customerPhone}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                      <span className="text-stone-600">Total Paid:</span>
                      <span className="text-base font-black text-stone-900">
                        ETB {order.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buyer Protection Footer Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg">EthioInfluence Escrow Protection</h3>
            <p className="text-stone-400 text-xs md:text-sm mt-0.5 max-w-md">
              Your payments are securely held in escrow until your package is safely delivered and verified.
            </p>
          </div>
        </div>

        <Link
          to="/directory"
          className="inline-flex items-center gap-2 bg-white text-stone-900 px-6 py-3 rounded-full text-sm font-semibold hover:bg-stone-100 transition-colors shrink-0"
        >
          Continue Shopping <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
