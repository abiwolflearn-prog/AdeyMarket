import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Phone,
  ArrowRight,
  Loader2,
  Calendar,
  ShoppingBag,
  Search,
  Printer,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackSearch, setTrackSearch] = useState("");
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch (error) {
        console.error("Failed to load order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackSearch.trim()) {
      navigate(`/order-confirmation/${encodeURIComponent(trackSearch.trim())}`);
      setTrackSearch("");
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order) return;
    try {
      setIsConfirmingDelivery(true);
      const { data } = await api.patch(`/orders/${order._id}/deliver`);
      toast.success("Order marked as delivered! Funds released to seller balance.");
      setOrder(data.order);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark order delivered");
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-6">
        <Package className="w-16 h-16 text-stone-300 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Order Not Found</h2>
          <p className="text-stone-500 max-w-md mx-auto text-sm">
            We couldn't locate an order with ID or Number "{id}". Please verify your order number and try again.
          </p>
        </div>

        {/* Quick Order Lookup Form */}
        <form onSubmit={handleTrackSubmit} className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={trackSearch}
            onChange={(e) => setTrackSearch(e.target.value)}
            placeholder="e.g. ETH-M12AB-3901"
            className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
          <button
            type="submit"
            className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Track
          </button>
        </form>

        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-6 py-3 rounded-full font-medium text-sm transition-colors"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-stone-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-green-50 text-[#2E7D32] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">
          {order.orderStatus === "delivered" ? "Order Delivered!" : "Thank You for Your Order!"}
        </h1>
        <p className="text-stone-600 max-w-lg mx-auto mb-6 text-sm md:text-base">
          {order.orderStatus === "delivered"
            ? "Your package has been successfully delivered and verified."
            : "We've received your order and the seller is preparing your items for delivery."}
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-stone-50 py-2.5 px-6 rounded-2xl border border-stone-200 text-sm">
          <span className="text-stone-500">Order Number:</span>
          <span className="font-mono font-bold text-stone-900">{order.orderNumber}</span>
          <span className="text-stone-300">•</span>
          <span
            className={`capitalize px-3 py-0.5 rounded-full text-xs font-semibold ${
              order.orderStatus === "delivered"
                ? "bg-green-600 text-white"
                : order.orderStatus === "shipped"
                ? "bg-blue-600 text-white"
                : "bg-stone-900 text-white"
            }`}
          >
            {order.orderStatus}
          </span>
        </div>
      </div>

      {/* Visual Live Order Tracker */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm">
        <h2 className="text-base font-bold text-stone-900 mb-6 flex items-center gap-2">
          <Truck className="w-4 h-4 text-stone-700" /> Real-Time Shipment Status
        </h2>

        <div className="grid grid-cols-3 text-center text-xs font-medium">
          {/* Step 1: Processing */}
          <div className="space-y-2">
            <div
              className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all ${
                order.orderStatus === "processing" || order.orderStatus === "shipped" || order.orderStatus === "delivered"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-400"
              }`}
            >
              1
            </div>
            <span className="text-stone-900 font-semibold block text-sm">Order Placed</span>
            <span className="text-[11px] text-stone-500 hidden sm:block">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Step 2: Shipped */}
          <div className="space-y-2">
            <div
              className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all ${
                order.orderStatus === "shipped" || order.orderStatus === "delivered"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-400"
              }`}
            >
              2
            </div>
            <span className="text-stone-900 font-semibold block text-sm">In Transit</span>
            <span className="text-[11px] text-stone-500 hidden sm:block">
              {order.shippedAt ? new Date(order.shippedAt).toLocaleDateString() : "With courier"}
            </span>
          </div>

          {/* Step 3: Delivered */}
          <div className="space-y-2">
            <div
              className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all ${
                order.orderStatus === "delivered"
                  ? "bg-green-600 text-white shadow-xs"
                  : "bg-stone-100 text-stone-400"
              }`}
            >
              ✓
            </div>
            <span className="text-stone-900 font-semibold block text-sm">Delivered</span>
            <span className="text-[11px] text-stone-500 hidden sm:block">
              {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : "Package received"}
            </span>
          </div>
        </div>

        {/* Shipped / Tracking Alert if Shipped */}
        {order.trackingNumber && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 text-sm">Package is on the way</h3>
                <p className="text-xs text-blue-700 mt-0.5">
                  Carrier: <strong>{order.shippingCarrier || "Local Courier"}</strong> • Tracking Reference:{" "}
                  <strong className="font-mono">{order.trackingNumber}</strong>
                </p>
              </div>
            </div>

            {/* Buyer Confirm Receipt Button */}
            {order.orderStatus === "shipped" && user && (
              <button
                onClick={handleConfirmDelivery}
                disabled={isConfirmingDelivery}
                className="bg-[#2E7D32] hover:bg-green-800 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50"
              >
                {isConfirmingDelivery ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Confirm Package Received
              </button>
            )}
          </div>
        )}
      </div>

      {/* Order Details Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Delivery Details */}
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-stone-500" /> Delivery Address
          </h2>
          <div className="text-sm text-stone-600 space-y-1">
            <p className="font-semibold text-stone-900">{order.customerName}</p>
            <p>{order.shippingAddress?.street}</p>
            <p>
              {order.shippingAddress?.subcity && `${order.shippingAddress.subcity}, `}
              {order.shippingAddress?.city || "Addis Ababa"}
            </p>
            {order.shippingAddress?.note && (
              <p className="text-xs text-stone-500 pt-2 italic">Note: "{order.shippingAddress.note}"</p>
            )}
          </div>
          <div className="pt-3 border-t border-stone-100 flex items-center gap-2 text-sm text-stone-600">
            <Phone className="w-4 h-4 text-stone-400" />
            <span>{order.customerPhone}</span>
          </div>
        </div>

        {/* Payment & Seller info */}
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-stone-500" /> Payment & Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Payment Method:</span>
              <span className="font-semibold text-stone-900 capitalize">
                {order.paymentMethod?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Payment Status:</span>
              <span className="font-semibold text-green-700 capitalize">{order.paymentStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Placed on:</span>
              <span className="text-stone-900">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            {order.sellerId && (
              <div className="flex justify-between pt-2 border-t border-stone-100">
                <span className="text-stone-500">Seller:</span>
                <span className="font-medium text-stone-900">{order.sellerId.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ordered Items */}
      <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
        <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
          <Package className="w-5 h-5 text-stone-700" /> Items in this Order
        </h2>

        <div className="divide-y divide-stone-100">
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} className="py-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-stone-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-stone-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-stone-900 text-sm truncate">{item.name}</h4>
                <p className="text-xs text-stone-500 mt-1">
                  Quantity: {item.quantity} × ETB {item.price.toLocaleString()}
                </p>
              </div>
              <div className="font-bold text-stone-900 text-sm">
                ETB {(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-stone-100 flex justify-between items-baseline">
          <span className="font-bold text-stone-900 text-base">Total Amount Paid</span>
          <span className="font-black text-stone-900 text-2xl">
            ETB {order.totalAmount?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to="/directory"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-8 py-3.5 rounded-full font-medium transition-colors"
        >
          Explore More Products <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to={user ? "/dashboard" : "/"}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 px-8 py-3.5 rounded-full font-medium transition-colors"
        >
          {user ? "Go to Dashboard" : "Return to Home"}
        </Link>
      </div>
    </div>
  );
}

