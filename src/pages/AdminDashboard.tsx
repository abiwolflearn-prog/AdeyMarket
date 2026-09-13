import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Users, Store, Target, Receipt, CreditCard, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState<any>({});
  const [companies, setCompanies] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);

  useEffect(() => {
    fetchMetrics();
    fetchCompanies();
    fetchCreators();
    fetchOrders();
    fetchTransactions();
    fetchCampaigns();
    fetchAgreements();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get("/admin/metrics");
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/admin/companies");
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCreators = async () => {
    try {
      const res = await api.get("/admin/creators");
      setCreators(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/admin/transactions");
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await api.get("/admin/campaigns");
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAgreements = async () => {
    try {
      const res = await api.get("/admin/agreements");
      setAgreements(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const verifyCompany = async (id: string, isApproved: boolean) => {
    try {
      await api.patch(`/admin/companies/${id}/verify`, { isApproved });
      toast.success(`Company ${isApproved ? "verified" : "unverified"} successfully`);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const suspendUser = async (id: string, status: "active" | "suspended") => {
    try {
      await api.patch(`/admin/users/${id}/status`, { status });
      toast.success(`User ${status} successfully`);
      fetchCompanies();
      fetchCreators();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user status");
    }
  };

  const releaseEscrow = async (id: string) => {
    try {
      await api.post(`/admin/orders/${id}/release-escrow`);
      toast.success("Escrow released successfully");
      fetchOrders();
      fetchMetrics();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to release escrow");
    }
  };

  const updateTransaction = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/transactions/${id}/status`, { status });
      toast.success("Transaction updated");
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update transaction");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Admin Portal</h1>
        <p className="text-stone-500 mt-1">Platform management and administration</p>
      </div>

      <div className="flex space-x-1 border-b border-stone-200 overflow-x-auto whitespace-nowrap">
        {["overview", "companies", "creators", "campaigns", "agreements", "orders", "transactions"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col">
            <h3 className="text-stone-500 text-sm font-medium">Total GMV</h3>
            <p className="text-2xl font-bold text-stone-900 mt-1">ETB {metrics.totalGMV?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col">
            <h3 className="text-stone-500 text-sm font-medium">Platform Fees</h3>
            <p className="text-2xl font-bold text-stone-900 mt-1">ETB {metrics.totalPlatformFees?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col">
            <h3 className="text-stone-500 text-sm font-medium">Creator Commissions</h3>
            <p className="text-2xl font-bold text-stone-900 mt-1">ETB {metrics.totalCreatorCommissions?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col">
            <h3 className="text-stone-500 text-sm font-medium">Total Orders</h3>
            <p className="text-2xl font-bold text-stone-900 mt-1">{metrics.orderCount || 0}</p>
          </div>
        </div>
      )}

      {activeTab === "companies" && (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-stone-900">Company</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Email</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Status</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {companies.map((c: any) => (
                <tr key={c._id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-medium text-stone-900">{c.companyName}</td>
                  <td className="px-6 py-4 text-stone-500">{c.userId?.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${c.isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {c.isApproved ? "Verified" : "Unverified"}
                    </span>
                    {c.userId?.status === "suspended" && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    <button onClick={() => verifyCompany(c._id, !c.isApproved)} className="text-stone-600 hover:text-stone-900 font-medium">
                      {c.isApproved ? "Revoke" : "Verify"}
                    </button>
                    <button 
                      onClick={() => suspendUser(c.userId?._id, c.userId?.status === "active" ? "suspended" : "active")} 
                      className={`${c.userId?.status === "active" ? "text-red-600 hover:text-red-700" : "text-emerald-600 hover:text-emerald-700"} font-medium`}
                    >
                      {c.userId?.status === "active" ? "Suspend" : "Unsuspend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "creators" && (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-stone-900">Creator</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Email</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Status</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {creators.map((c: any) => (
                <tr key={c._id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-medium text-stone-900">{c.displayName}</td>
                  <td className="px-6 py-4 text-stone-500">{c.userId?.email}</td>
                  <td className="px-6 py-4">
                    {c.userId?.status === "suspended" ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700">
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => suspendUser(c.userId?._id, c.userId?.status === "active" ? "suspended" : "active")} 
                      className={`${c.userId?.status === "active" ? "text-red-600 hover:text-red-700" : "text-emerald-600 hover:text-emerald-700"} font-medium`}
                    >
                      {c.userId?.status === "active" ? "Suspend" : "Unsuspend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-stone-900">Order ID</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Seller</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Total (ETB)</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Status</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Payment</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((o: any) => (
                <tr key={o._id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-medium text-stone-900">{o.orderNumber}</td>
                  <td className="px-6 py-4 text-stone-500">{o.sellerId?.name || "Unknown"}</td>
                  <td className="px-6 py-4 font-medium">{o.totalAmount}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-xs font-medium bg-stone-100 text-stone-700 px-2 py-1 rounded">
                      {o.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`capitalize text-xs font-medium px-2 py-1 rounded ${o.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {o.paymentStatus === "paid" && o.orderStatus !== "delivered" && o.orderStatus !== "cancelled" && o.orderStatus !== "returned" && (
                      <button 
                        onClick={() => releaseEscrow(o._id)} 
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Release Escrow
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-stone-900">Ref</th>
                <th className="px-6 py-4 font-semibold text-stone-900">User</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Type</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Amount (ETB)</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Status</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transactions.map((t: any) => (
                <tr key={t._id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-medium text-stone-900">{t.reference}</td>
                  <td className="px-6 py-4 text-stone-500">{t.userId?.name || "Unknown"}</td>
                  <td className="px-6 py-4 capitalize text-stone-500">{t.type}</td>
                  <td className="px-6 py-4 font-medium">{t.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`capitalize text-xs font-medium px-2 py-1 rounded ${t.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : t.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    {t.status === "pending" && (
                      <>
                        <button onClick={() => updateTransaction(t._id, "completed")} className="text-emerald-600 hover:text-emerald-700 font-medium">
                          Complete
                        </button>
                        <button onClick={() => updateTransaction(t._id, "failed")} className="text-red-600 hover:text-red-700 font-medium">
                          Fail
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "campaigns" && (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-stone-900">Title</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Seller</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Status</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Commission Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {campaigns.map((c: any) => (
                <tr key={c._id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-medium text-stone-900">{c.title}</td>
                  <td className="px-6 py-4 text-stone-500">{c.sellerId?.name || "Unknown"}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-xs font-medium bg-stone-100 text-stone-700 px-2 py-1 rounded">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-stone-900">{c.commissionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "agreements" && (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-stone-900">Company</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Creator</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Status</th>
                <th className="px-6 py-4 font-semibold text-stone-900">Tracking Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {agreements.map((a: any) => (
                <tr key={a._id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-medium text-stone-900">{a.companyId?.name || "Unknown"}</td>
                  <td className="px-6 py-4 font-medium text-stone-900">{a.creatorId?.name || "Unknown"}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-xs font-medium bg-stone-100 text-stone-700 px-2 py-1 rounded">
                      {a.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-stone-500">{a.trackingCode || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
