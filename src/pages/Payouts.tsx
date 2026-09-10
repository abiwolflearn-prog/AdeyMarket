import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import WithdrawalModal from "../components/WithdrawalModal";
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Smartphone,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Wallet,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

interface FinancialData {
  totalEarned: number;
  sellerEarnings: number;
  affiliateEarnings: number;
  pendingBalance: number;
  pendingSellerEarnings?: number;
  pendingAffiliateEarnings?: number;
  totalWithdrawn: number;
  availableBalance: number;
}

interface TransactionItem {
  _id: string;
  type: "payment" | "payout" | "commission" | "refund";
  amount: number;
  currency: string;
  method: string;
  status: string;
  reference: string;
  accountDetails?: {
    payoutType?: string;
    phoneNumber?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
  };
  notes?: string;
  createdAt: string;
  orderId?: {
    orderNumber: string;
    totalAmount: number;
  };
}

export default function Payouts() {
  const [financials, setFinancials] = useState<FinancialData>({
    totalEarned: 0,
    sellerEarnings: 0,
    affiliateEarnings: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
    availableBalance: 0,
  });

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [balanceRes, txRes] = await Promise.all([
        api.get("/payments/balance"),
        api.get("/payments/transactions"),
      ]);
      setFinancials(balanceRes.data);
      setTransactions(txRes.data);
    } catch (error) {
      console.error("Failed to load payout data:", error);
      toast.error("Failed to load financial records");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-stone-800" /> Earnings & Payouts
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Track real-time revenue, commissions, and instant Telebirr & Bank payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl transition-colors"
            title="Refresh records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 shadow-sm transition-all"
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw Earnings
          </button>
        </div>
      </div>

      {/* Balance Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {/* Available Balance Card */}
        <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Available to Cash Out
            </div>
            <div className="text-2xl md:text-3xl font-black">
              ETB {financials.availableBalance.toLocaleString()}
            </div>
            <p className="text-xs text-stone-400 mt-2">
              Cleared funds ready for instant transfer to Telebirr or Ethiopian Banks.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-stone-800">
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              disabled={financials.availableBalance < 100}
              className="w-full bg-white text-stone-900 hover:bg-stone-100 py-2.5 rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
            >
              Transfer Funds
            </button>
          </div>
        </div>

        {/* Pending In-Transit Balance Card */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                In-Transit (Escrow)
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-stone-900">
              ETB {(financials.pendingBalance || 0).toLocaleString()}
            </div>
            <p className="text-xs text-stone-500 mt-2">
              Pending release upon confirmed customer order delivery.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 text-xs text-stone-500 space-y-1">
            <div className="flex justify-between">
              <span>Seller pending:</span>
              <span className="font-semibold text-stone-900">
                ETB {(financials.pendingSellerEarnings || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Affiliate pending:</span>
              <span className="font-semibold text-purple-700">
                ETB {(financials.pendingAffiliateEarnings || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Total Lifetime Earned Card */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Lifetime Cleared
              </span>
              <div className="w-8 h-8 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-stone-900">
              ETB {financials.totalEarned.toLocaleString()}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 text-xs text-stone-500 space-y-1">
            <div className="flex justify-between">
              <span>Direct Product Sales:</span>
              <span className="font-semibold text-stone-900">
                ETB {financials.sellerEarnings.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Affiliate Commissions:</span>
              <span className="font-semibold text-purple-700">
                ETB {financials.affiliateEarnings.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Total Withdrawn Card */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Total Withdrawn
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-stone-900">
              ETB {financials.totalWithdrawn.toLocaleString()}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 text-xs text-stone-500">
            <span>Successfully routed to Telebirr or local bank.</span>
          </div>
        </div>
      </div>


      {/* Transactions Table Section */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-stone-900 mb-6">Transaction History</h2>

        {transactions.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">No transactions recorded yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Your incoming order earnings and payout withdrawal records will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs uppercase tracking-wider text-stone-400 font-semibold">
                  <th className="pb-3 pl-2">Type</th>
                  <th className="pb-3">Reference / Details</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.map((tx) => {
                  const isPayout = tx.type === "payout";
                  return (
                    <tr key={tx._id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isPayout
                                ? "bg-amber-50 text-amber-700"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            {isPayout ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-stone-900 block capitalize">
                              {tx.type}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4">
                        <span className="font-mono text-xs font-medium text-stone-700 block">
                          {tx.reference}
                        </span>
                        <span className="text-xs text-stone-500 block truncate max-w-xs">
                          {tx.notes || (tx.orderId ? `Order #${tx.orderId.orderNumber}` : "Direct payout")}
                        </span>
                      </td>

                      <td className="py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 text-xs font-medium capitalize">
                          {tx.method === "telebirr" && <Smartphone className="w-3.5 h-3.5 text-blue-600" />}
                          {tx.method === "bank_transfer" && <Building2 className="w-3.5 h-3.5 text-purple-600" />}
                          {tx.method?.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-4 text-xs text-stone-500">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            tx.status === "completed"
                              ? "bg-green-50 text-green-700"
                              : tx.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {tx.status === "completed" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : tx.status === "pending" ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {tx.status}
                        </span>
                      </td>

                      <td
                        className={`py-4 pr-2 text-right font-bold text-sm ${
                          isPayout ? "text-stone-900" : "text-green-700"
                        }`}
                      >
                        {isPayout ? "-" : "+"}ETB {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        availableBalance={financials.availableBalance}
        onSuccess={fetchData}
      />
    </div>
  );
}
