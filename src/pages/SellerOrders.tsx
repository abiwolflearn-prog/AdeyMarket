import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import {
  Package,
  Truck,
  CheckCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Loader2,
  DollarSign,
  TrendingUp,
  Share2,
  ExternalLink,
  ChevronDown,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface IOrder {
  _id: string;
  orderNumber: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
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
  platformFee: number;
  referrerCommission: number;
  sellerPayout: number;
  commissionRate: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingNumber?: string;
  shippingCarrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  referrerId?: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function SellerOrders() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Shipping Modal State
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("Ethiopian Post / EMS");
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);

  // Delivering Action State
  const [deliveringOrderId, setDeliveringOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/orders");
      setOrders(data);
    } catch (error) {
      toast.error("Failed to load seller orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkShipped = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingOrderId) return;
    if (!trackingNumber.trim()) {
      toast.error("Please provide a tracking number or delivery dispatch note");
      return;
    }

    try {
      setIsUpdatingTracking(true);
      const { data } = await api.patch(`/orders/${shippingOrderId}/ship`, {
        trackingNumber: trackingNumber.trim(),
        shippingCarrier: shippingCarrier.trim(),
      });

      toast.success("Order marked as shipped!");
      setOrders((prev) =>
        prev.map((o) => (o._id === shippingOrderId ? data.order : o))
      );
      setShippingOrderId(null);
      setTrackingNumber("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update shipping");
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      setDeliveringOrderId(orderId);
      const { data } = await api.patch(`/orders/${orderId}/deliver`);
      toast.success("Order marked as delivered! Funds released to available balance.");
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? data.order : o))
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark order as delivered");
    } finally {
      setDeliveringOrderId(null);
    }
  };


  // Financial calculations
  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPlatformFees = orders.reduce((sum, o) => sum + o.platformFee, 0);
  const totalAffiliateCommissions = orders.reduce((sum, o) => sum + o.referrerCommission, 0);
  const totalNetPayout = orders.reduce((sum, o) => sum + o.sellerPayout, 0);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      selectedStatus === "all" || o.orderStatus === selectedStatus;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-stone-700" /> Customer Orders
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage fulfillment, add tracking numbers, and view transparent commission payouts.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors self-start sm:self-auto"
        >
          Manage Catalog
        </Link>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Gross Sales
          </div>
          <div className="text-2xl font-black text-stone-900">
            ETB {totalSales.toLocaleString()}
          </div>
          <div className="text-xs text-stone-400 mt-1">{orders.length} total orders</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Platform Fee (5%)
          </div>
          <div className="text-2xl font-black text-stone-700">
            ETB {totalPlatformFees.toLocaleString()}
          </div>
          <div className="text-xs text-stone-400 mt-1">Adey core fee</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Creator Affiliate Payouts
          </div>
          <div className="text-2xl font-black text-purple-900">
            ETB {totalAffiliateCommissions.toLocaleString()}
          </div>
          <div className="text-xs text-purple-600 mt-1 font-medium">Referred sales</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Net Seller Payout
          </div>
          <div className="text-2xl font-black text-green-700">
            ETB {totalNetPayout.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 mt-1 font-medium">Deposited to bank</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["all", "processing", "shipped", "delivered", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedStatus === status
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order # or customer..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-100 p-16 text-center shadow-sm">
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900">No orders found</h3>
          <p className="text-stone-500 text-sm mt-1 max-w-sm mx-auto">
            {orders.length === 0
              ? "You haven't received any customer orders yet. Share your storefront link to drive traffic!"
              : "No orders match the selected filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm flex flex-col gap-6"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-stone-900 text-lg">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        order.orderStatus === "shipped"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : order.orderStatus === "delivered"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {order.orderStatus !== "shipped" && order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
                    <button
                      onClick={() => {
                        setShippingOrderId(order._id);
                        setTrackingNumber(order.trackingNumber || "");
                        setShippingCarrier(order.shippingCarrier || "Ethiopian Post / EMS");
                      }}
                      className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl font-medium text-xs transition-colors shadow-sm"
                    >
                      <Truck className="w-4 h-4" /> Ship Order
                    </button>
                  )}
                  {order.orderStatus === "shipped" && (
                    <button
                      onClick={() => handleMarkDelivered(order._id)}
                      disabled={deliveringOrderId === order._id}
                      className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
                    >
                      {deliveringOrderId === order._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Mark as Delivered
                    </button>
                  )}
                  <Link
                    to={`/order-confirmation/${order._id}`}
                    target="_blank"
                    className="p-2.5 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-colors"
                    title="View receipt"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

              </div>

              {/* Order Content Grid */}
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Items (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    Order Items
                  </h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-stone-50/50 p-3 rounded-2xl">
                      <div className="w-12 h-12 rounded-xl bg-stone-200 overflow-hidden shrink-0 border border-stone-200">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-stone-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-900 truncate">{item.name}</p>
                        <p className="text-xs text-stone-500">
                          {item.quantity} × ETB {item.price.toLocaleString()}
                        </p>
                      </div>
                      <span className="font-bold text-sm text-stone-900">
                        ETB {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  {/* Customer Delivery Info */}
                  <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-600 space-y-1">
                    <p className="font-semibold text-stone-900">Delivery Recipient:</p>
                    <p>
                      {order.customerName} • <strong>{order.customerPhone}</strong>
                    </p>
                    <p>
                      {order.shippingAddress.street},{" "}
                      {order.shippingAddress.subcity && `${order.shippingAddress.subcity}, `}
                      {order.shippingAddress.city}
                    </p>
                    {order.shippingAddress.note && (
                      <p className="italic text-stone-500">Note: {order.shippingAddress.note}</p>
                    )}
                  </div>
                </div>

                {/* Financial Payout Breakdown (5 cols) */}
                <div className="lg:col-span-5 bg-stone-50 rounded-2xl p-5 border border-stone-100 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                      Financial Breakdown
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Total Customer Payment</span>
                        <span className="font-bold text-stone-900">
                          ETB {order.totalAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between text-stone-600">
                        <span>Platform Fee (5%)</span>
                        <span className="text-stone-700">
                          - ETB {order.platformFee.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between text-stone-600">
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3.5 h-3.5 text-purple-600" />
                          Affiliate Comm. ({order.commissionRate}%)
                        </span>
                        <span className={order.referrerCommission > 0 ? "text-purple-700 font-semibold" : "text-stone-400"}>
                          {order.referrerCommission > 0
                            ? `- ETB ${order.referrerCommission.toLocaleString()}`
                            : "None (Direct)"}
                        </span>
                      </div>

                      {order.referrerId && (
                        <div className="text-[11px] text-purple-600 bg-purple-50 p-2 rounded-lg mt-1">
                          Referred by creator: <strong>{order.referrerId.name}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Net Payout Box */}
                  <div className="pt-4 mt-4 border-t border-stone-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        Net Payout to You:
                      </span>
                      <span className="text-lg font-black text-green-700">
                        ETB {order.sellerPayout.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipped Tracking Info Bar if present */}
              {order.trackingNumber && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-blue-900 gap-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>
                      Shipped via <strong>{order.shippingCarrier}</strong> • Tracking / Note:{" "}
                      <strong className="font-mono">{order.trackingNumber}</strong>
                    </span>
                  </div>
                  {order.shippedAt && (
                    <span className="text-blue-600">
                      Dispatched {new Date(order.shippedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Shipping Modal */}
      {shippingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-stone-800" /> Dispatch Order
              </h3>
              <button
                onClick={() => setShippingOrderId(null)}
                className="p-1.5 text-stone-400 hover:text-stone-900 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMarkShipped} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Shipping Courier / Delivery Service
                </label>
                <input
                  type="text"
                  required
                  value={shippingCarrier}
                  onChange={(e) => setShippingCarrier(e.target.value)}
                  placeholder="e.g. Ethiopian Post, Direct Messenger, EMS"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Tracking Code / Driver Contact
                </label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. ET-940283 or Driver: 0911000000"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShippingOrderId(null)}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTracking}
                  className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isUpdatingTracking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
