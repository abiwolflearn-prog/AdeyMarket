import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  ShoppingBag,
  ArrowLeft,
  Lock,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Banknote,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Addis Ababa");
  const [subcity, setSubcity] = useState("Bole");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"telebirr" | "arifpay" | "cash_on_delivery">("telebirr");

  useEffect(() => {
    if (items.length === 0) {
      navigate("/bag");
    }
  }, [items, navigate]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!street.trim()) {
      toast.error("Please enter your delivery street address or landmark");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        shippingAddress: {
          street: street.trim(),
          city,
          subcity,
          note: note.trim() || undefined,
        },
        paymentMethod,
      };

      const { data } = await api.post("/orders", payload);

      clearCart();

      if (paymentMethod === "arifpay") {
        try {
          const payRes = await api.post("/payments/initiate", {
            orderId: data.order._id,
            phone: customerPhone.trim(),
            email: customerEmail.trim() || undefined,
          });
          if (payRes.data?.paymentUrl) {
            window.location.href = payRes.data.paymentUrl;
            return;
          }
        } catch (payErr) {
          console.error("Arifpay initiation failed, routing to confirmation", payErr);
        }
      }

      toast.success("Order placed successfully!");
      navigate(`/order-confirmation/${data.order._id}`);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to place order. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ethiopianSubcities = [
    "Bole",
    "Kirkos",
    "Yeka",
    "Arada",
    "Nifas Silk-Lafto",
    "Gullele",
    "Lideta",
    "Addis Ketema",
    "Kolfe Keranio",
    "Akaki Kality",
    "Lemi Kura",
    "Other Subcity / Zone",
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link
          to="/bag"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shopping Bag
        </Link>
        <h1 className="text-3xl font-bold text-stone-900 mt-3">Checkout & Delivery</h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid lg:grid-cols-12 gap-12">
        {/* Left: Shipping & Payment Details */}
        <div className="lg:col-span-7 space-y-10">
          {/* 1. Contact & Customer Details */}
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-semibold">
                1
              </span>
              Contact Information
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Abebe Kebede"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+251 91 123 4567"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="abebe@example.com"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow"
                />
                <span className="text-[11px] text-stone-400">Order receipts and tracking will be sent here.</span>
              </div>
            </div>
          </div>

          {/* 2. Delivery Address */}
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-semibold">
                2
              </span>
              Delivery Address
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Addis Ababa"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Subcity / District
                </label>
                <select
                  value={subcity}
                  onChange={(e) => setSubcity(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white transition-shadow"
                >
                  {ethiopianSubcities.map((sc) => (
                    <option key={sc} value={sc}>
                      {sc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Street Address & Landmark <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Near Edna Mall, Behind Medhanialem Church, House #402"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Delivery Note for Courier
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Call before arrival, gate code, or specific drop-off details..."
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow resize-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-semibold">
                3
              </span>
              Payment Method
            </h2>

            <div className="space-y-3">
              {/* Telebirr */}
              <label
                onClick={() => setPaymentMethod("telebirr")}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "telebirr"
                    ? "border-stone-900 bg-stone-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900 block text-sm">Telebirr SuperApp</span>
                    <span className="text-xs text-stone-500">Fast digital transfer via mobile number</span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    paymentMethod === "telebirr" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300"
                  }`}
                >
                  {paymentMethod === "telebirr" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </label>

              {/* Arifpay */}
              <label
                onClick={() => setPaymentMethod("arifpay")}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "arifpay"
                    ? "border-stone-900 bg-stone-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900 block text-sm">Arifpay (Cards & CBE Birr)</span>
                    <span className="text-xs text-stone-500">Local debit cards, CBE, Awash, Dashen</span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    paymentMethod === "arifpay" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300"
                  }`}
                >
                  {paymentMethod === "arifpay" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </label>

              {/* Cash on Delivery */}
              <label
                onClick={() => setPaymentMethod("cash_on_delivery")}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "cash_on_delivery"
                    ? "border-stone-900 bg-stone-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900 block text-sm">Cash on Delivery</span>
                    <span className="text-xs text-stone-500">Pay cash or mobile transfer upon package handover</span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    paymentMethod === "cash_on_delivery"
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-300"
                  }`}
                >
                  {paymentMethod === "cash_on_delivery" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm sticky top-28 space-y-6">
            <h2 className="text-xl font-bold text-stone-900">Your Order</h2>

            {/* Items summary */}
            <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.productId} className="py-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-100">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-stone-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Qty: {item.quantity} × ETB {item.price.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">
                    ETB {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-3 pt-4 border-t border-stone-100 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-medium text-stone-900">ETB {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery</span>
                <span className="text-green-700 font-medium">Free (Addis Ababa)</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline pt-4 border-t border-stone-100">
              <span className="text-base font-bold text-stone-900">Grand Total</span>
              <div className="text-right">
                <span className="text-2xl font-black text-stone-900">
                  ETB {subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Order...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Place Order (ETB {subtotal.toLocaleString()})
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-stone-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-stone-500" />
              <span>Encrypted & secure checkout</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
