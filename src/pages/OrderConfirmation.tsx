import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
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
} from "lucide-react";

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Order Not Found</h2>
        <p className="text-stone-500 mb-6">We couldn't locate this order confirmation.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-full font-medium"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-stone-100 shadow-sm text-center mb-8">
        <div className="w-16 h-16 bg-green-50 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">Thank You for Your Order!</h1>
        <p className="text-stone-600 max-w-lg mx-auto mb-6 text-sm md:text-base">
          We've received your order and the seller is preparing your items for delivery.
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-stone-50 py-2.5 px-6 rounded-2xl border border-stone-200 text-sm">
          <span className="text-stone-500">Order Number:</span>
          <span className="font-mono font-bold text-stone-900">{order.orderNumber}</span>
          <span className="text-stone-300">•</span>
          <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-900 text-white">
            {order.orderStatus}
          </span>
        </div>
      </div>

      {/* Shipping / Tracking Alert if Shipped */}
      {order.trackingNumber && (
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 mb-8 flex items-start gap-4">
          <Truck className="w-6 h-6 text-blue-700 shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900">Your order has been shipped!</h3>
            <p className="text-sm text-blue-700 mt-1">
              Carrier: <strong>{order.shippingCarrier || "Local Courier"}</strong> • Tracking Code:{" "}
              <strong className="font-mono">{order.trackingNumber}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Order Details Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
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
      <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm mb-12">
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

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/directory"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-8 py-3.5 rounded-full font-medium transition-colors"
        >
          Explore More Products <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 px-8 py-3.5 rounded-full font-medium transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
