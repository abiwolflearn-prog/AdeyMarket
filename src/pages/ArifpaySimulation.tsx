import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { CheckCircle2, ShieldCheck, Lock, Loader2, ArrowLeft, Smartphone, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

export default function ArifpaySimulation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const ref = searchParams.get("ref") || `ARIF-${Date.now()}`;
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount") || "0";

  const [selectedChannel, setSelectedChannel] = useState("telebirr");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCompletePayment = async () => {
    try {
      setIsProcessing(true);
      await api.post("/payments/confirm", {
        reference: ref,
        orderId,
        status: "completed",
      });

      toast.success("Arifpay payment completed successfully!");
      if (orderId) {
        navigate(`/order-confirmation/${orderId}`);
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error("Failed to complete simulated payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
        {/* Gateway Brand Header */}
        <div className="bg-[#1A365D] text-white p-6 text-center relative">
          <div className="inline-block bg-white text-[#1A365D] font-black text-lg px-3 py-1 rounded-lg mb-2">
            Arifpay
          </div>
          <p className="text-xs text-blue-200">Ethiopian Unified Payment Gateway (Sandbox)</p>
          <div className="mt-4 pt-4 border-t border-blue-800 flex justify-between items-center text-xs">
            <span className="text-blue-200">Adey Merchant</span>
            <span className="font-mono text-blue-100 font-bold">{ref}</span>
          </div>
        </div>

        {/* Amount Box */}
        <div className="p-6 border-b border-stone-100 text-center bg-stone-50/50">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Total Amount Due
          </span>
          <span className="text-3xl font-black text-stone-900 mt-1 block">
            ETB {parseFloat(amount).toLocaleString()}
          </span>
        </div>

        {/* Payment Channels */}
        <div className="p-6 space-y-4">
          <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">
            Choose Payment Method
          </label>

          <div className="space-y-2.5">
            {[
              { id: "telebirr", label: "Telebirr", icon: Smartphone },
              { id: "cbe", label: "CBE Birr / CBE Mobile", icon: CreditCard },
              { id: "awash", label: "Awash Birr", icon: CreditCard },
              { id: "card", label: "Local Debit Card (Visa/Mastercard)", icon: CreditCard },
            ].map((channel) => {
              const Icon = channel.icon;
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 text-left transition-all ${
                    selectedChannel === channel.id
                      ? "border-[#1A365D] bg-blue-50/40 text-stone-900 font-medium"
                      : "border-stone-200 hover:border-stone-300 text-stone-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-stone-500" />
                    <span className="text-sm">{channel.label}</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedChannel === channel.id
                        ? "border-[#1A365D] bg-[#1A365D] text-white"
                        : "border-stone-300"
                    }`}
                  >
                    {selectedChannel === channel.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4">
            <button
              onClick={handleCompletePayment}
              disabled={isProcessing}
              className="w-full bg-[#1A365D] hover:bg-[#142945] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authorizing Payment...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Authorize ETB {parseFloat(amount).toLocaleString()}
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-stone-400 pt-2">
            <ShieldCheck className="w-4 h-4 text-stone-500" />
            <span>256-bit SSL Encrypted Ethiopian Banking Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
}
