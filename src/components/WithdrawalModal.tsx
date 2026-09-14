import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { X, Smartphone, Building2, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { ETHIOPIAN_BANKS } from "../pages/ProfileEdit";
import { AnimatedModal } from "./animations/AnimatedModal";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess?: () => void;
}

export default function WithdrawalModal({
  isOpen,
  onClose,
  availableBalance,
  onSuccess,
}: WithdrawalModalProps) {
  const { user } = useAuth();
  const [payoutType, setPayoutType] = useState<"telebirr" | "bank_transfer">("telebirr");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState(ETHIOPIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user?._id) {
      api.get(`/profile/${user._id}`).then(({ data }) => {
        if (data.profile?.payoutInfo) {
          const info = data.profile.payoutInfo;
          if (info.preferredMethod) {
            setPayoutType(info.preferredMethod);
          }
          if (info.phoneNumber) setPhoneNumber(info.phoneNumber);
          if (info.accountHolderName) setAccountHolderName(info.accountHolderName);
          if (info.bankName) setBankName(info.bankName);
          if (info.accountNumber) setAccountNumber(info.accountNumber);
        } else if (data.name) {
          setAccountHolderName(data.name);
        }
      }).catch(() => {
        // Non-blocking fallback
      });
    }
  }, [isOpen, user?._id]);

  if (!isOpen) return null;

  const handleMaxAmount = () => {
    setAmount(availableBalance.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 100) {
      toast.error("Minimum withdrawal amount is ETB 100");
      return;
    }

    if (parsed > availableBalance) {
      toast.error("Amount exceeds your available balance");
      return;
    }

    if (payoutType === "telebirr") {
      if (!phoneNumber.trim()) {
        toast.error("Please enter your Telebirr phone number");
        return;
      }
      if (!accountHolderName.trim()) {
        toast.error("Please enter your registered Telebirr account name");
        return;
      }
    } else {
      if (!accountNumber.trim()) {
        toast.error("Please enter your bank account number");
        return;
      }
      if (!accountHolderName.trim()) {
        toast.error("Please enter the bank account holder name");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await api.post("/payments/withdraw", {
        amount: parsed,
        payoutType,
        phoneNumber: phoneNumber.trim(),
        bankName,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
      });

      toast.success(`Withdrawal of ETB ${parsed.toLocaleString()} initiated!`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process withdrawal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Withdraw Earnings</h2>
            <p className="text-xs text-stone-500 mt-0.5">Transfer funds directly to your Ethiopian account</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-900 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-stone-50 rounded-2xl p-4 mb-6 border border-stone-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
              Available to Withdraw
            </span>
            <span className="text-2xl font-black text-stone-900">
              ETB {availableBalance.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={handleMaxAmount}
            disabled={availableBalance <= 0}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
          >
            Use Max
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Amount (ETB) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-sm">
                ETB
              </span>
              <input
                type="number"
                min="100"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1,000"
                className="w-full pl-14 pr-4 py-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
            <span className="text-[11px] text-stone-400">Min. withdrawal: ETB 100 • 0% withdrawal fee</span>
          </div>

          {/* Payout method choice */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Destination Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayoutType("telebirr")}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${
                  payoutType === "telebirr"
                    ? "border-stone-900 bg-stone-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-stone-900">Telebirr</span>
                  <span className="block text-[10px] text-stone-500">Instant Mobile</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPayoutType("bank_transfer")}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${
                  payoutType === "bank_transfer"
                    ? "border-stone-900 bg-stone-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-stone-900">Bank Transfer</span>
                  <span className="block text-[10px] text-stone-500">CBE, Awash, etc.</span>
                </div>
              </button>
            </div>
          </div>

          {/* Telebirr Details */}
          {payoutType === "telebirr" && (
            <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-100 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  Telebirr Registered Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+251 91 234 5678"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  Account Holder Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Exact name matching Telebirr profile"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>
          )}

          {/* Bank Details */}
          {payoutType === "bank_transfer" && (
            <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-100 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  {ETHIOPIAN_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  Bank Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 1000123456789"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  Account Holder Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Name as registered with the bank"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-stone-200 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableBalance < 100}
              className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Confirm Transfer
            </button>
          </div>
        </form>
      </div>
    </AnimatedModal>
  );
}
