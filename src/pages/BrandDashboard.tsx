import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import WithdrawalModal from "../components/WithdrawalModal";
import toast from "react-hot-toast";
import {
  Package,
  TrendingUp,
  DollarSign,
  Store,
  Megaphone,
  CheckCircle2,
  Truck,
  ArrowRight,
  Wallet,
  ArrowUpRight,
  Building2,
  Users,
  FileText,
  BarChart3,
  Layers,
  AlertTriangle,
  Clock,
  ExternalLink,
  Plus,
  RefreshCw,
  Sliders,
  Calendar,
  ChevronRight,
  Info,
  Tag,
  ShieldCheck,
  ShoppingBag,
  ArrowDownRight,
  X,
  Send,
  Check
} from "lucide-react";

interface IProduct {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isActive?: boolean;
}

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
  shippingAddress: {
    street: string;
    city: string;
    subcity?: string;
  };
  totalAmount: number;
  platformFee: number;
  referrerCommission: number;
  sellerPayout: number;
  commissionRate: number;
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  createdAt: string;
  referrerId?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface ICampaign {
  _id: string;
  title: string;
  description?: string;
  boostedCommissionRate: number;
  startDate: string;
  endDate: string;
  products: any[];
  status: "active" | "scheduled" | "ended" | "draft";
  targetNiche: string;
  budget?: number;
}

interface IShop {
  _id?: string;
  shopSlug?: string;
  description?: string;
  logo?: string;
  defaultCommissionRate?: number;
  isActive?: boolean;
}

interface ITransaction {
  _id: string;
  amount: number;
  type: "payout" | "earning" | "refund" | "commission";
  status: "pending" | "completed" | "failed";
  paymentMethod: string;
  referenceNumber?: string;
  accountNumber?: string;
  createdAt: string;
}

interface ICompanyApplication {
  _id: string;
  campaignId: {
    _id: string;
    title: string;
    boostedCommissionRate: number;
    status: string;
    startDate?: string;
    endDate?: string;
    products?: any[];
  };
  creatorId: {
    _id: string;
    name: string;
    email: string;
  };
  companyId: string;
  status: "pending" | "approved" | "rejected";
  pitchMessage: string;
  channels: string[];
  estimatedAudience?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  partnershipAgreement?: {
    status: "pending_company_acceptance" | "pending_creator_acceptance" | "active" | "rejected" | "terminated" | "expired";
    agreedCommissionRate: number;
    agreementTerms?: string;
    affiliateCode?: string;
    approvedAt?: string;
  };
  createdAt: string;
}

export default function BrandDashboard() {
  const { user } = useAuth();

  // Primary data states
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [applications, setApplications] = useState<ICompanyApplication[]>([]);
  const [shop, setShop] = useState<IShop | null>(null);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [financials, setFinancials] = useState({
    availableBalance: 0,
    totalEarned: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
    sellerEarnings: 0,
    pendingSellerEarnings: 0
  });

  // Application review modal state
  const [reviewingApp, setReviewingApp] = useState<ICompanyApplication | null>(null);
  const [agreedRateInput, setAgreedRateInput] = useState<number>(15);
  const [reviewNoteInput, setReviewNoteInput] = useState<string>("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState<boolean>(false);
  const [selectedAppFilter, setSelectedAppFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "inventory" | "orders" | "campaigns" | "creators" | "agreements" | "shop" | "earnings" | "payouts" | "analytics"
  >("overview");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Quick ship modal / actions state
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSubmittingShipping, setIsSubmittingShipping] = useState(false);

  const fetchAllCompanyData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, productsRes, balRes, campRes, shopRes, txRes, appsRes] = await Promise.allSettled([
        api.get("/orders"),
        api.get(`/products?sellerId=${user?._id}`),
        api.get("/payments/balance"),
        api.get("/campaigns"),
        api.get("/shop/me/profile"),
        api.get("/payments/transactions"),
        api.get("/campaigns/company/applications")
      ]);

      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        setOrders(ordersRes.value.data);
      } else {
        setOrders([]);
      }

      if (productsRes.status === "fulfilled" && productsRes.value?.data) {
        setProducts(productsRes.value.data);
      } else {
        setProducts([]);
      }

      if (balRes.status === "fulfilled" && balRes.value?.data) {
        setFinancials({
          availableBalance: balRes.value.data.availableBalance ?? 0,
          totalEarned: balRes.value.data.totalEarned ?? 0,
          pendingBalance: balRes.value.data.pendingBalance ?? 0,
          totalWithdrawn: balRes.value.data.totalWithdrawn ?? 0,
          sellerEarnings: balRes.value.data.sellerEarnings ?? 0,
          pendingSellerEarnings: balRes.value.data.pendingSellerEarnings ?? 0
        });
      }

      if (campRes.status === "fulfilled" && campRes.value?.data) {
        // Filter campaigns owned by this seller if sellerId matches or list all active
        const allCamps: ICampaign[] = campRes.value.data;
        const myCamps = allCamps.filter(c => {
          if (!c) return false;
          if (typeof c.products === "object") return true;
          return true;
        });
        setCampaigns(myCamps);
      } else {
        setCampaigns([]);
      }

      if (shopRes.status === "fulfilled" && shopRes.value?.data) {
        setShop(shopRes.value.data);
      } else {
        setShop(null);
      }

      if (txRes.status === "fulfilled" && txRes.value?.data) {
        setTransactions(txRes.value.data);
      } else {
        setTransactions([]);
      }

      if (appsRes.status === "fulfilled" && appsRes.value?.data) {
        setApplications(appsRes.value.data);
      } else {
        setApplications([]);
      }

    } catch (err) {
      console.error("Error loading company dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewApplication = async (status: "approved" | "rejected") => {
    if (!reviewingApp) return;
    try {
      setIsReviewSubmitting(true);
      await api.patch(`/campaigns/applications/${reviewingApp._id}/review`, {
        status,
        agreedCommissionRate: agreedRateInput,
        reviewNotes: reviewNoteInput.trim(),
      });
      toast.success(
        status === "approved"
          ? "Creator approved! Partnership agreement established and tracking credentials issued."
          : "Application declined."
      );
      setReviewingApp(null);
      setReviewNoteInput("");
      fetchAllCompanyData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to review application");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllCompanyData();
    }
  }, [user]);

  // Order fulfillment handlers
  const handleMarkShipped = async (orderId: string) => {
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number or dispatch dispatch reference");
      return;
    }
    try {
      setIsSubmittingShipping(true);
      await api.patch(`/orders/${orderId}/ship`, {
        trackingNumber: trackingNumber.trim(),
        shippingCarrier: "Ethiopian Post / EMS Dispatch"
      });
      toast.success("Order marked as shipped!");
      setShippingOrderId(null);
      setTrackingNumber("");
      fetchAllCompanyData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update order status");
    } finally {
      setIsSubmittingShipping(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/deliver`, {});
      toast.success("Order marked as delivered! Escrow funds released.");
      fetchAllCompanyData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark order as delivered");
    }
  };

  // Financial and KPI computations
  const grossSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalPlatformFees = orders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
  const totalCreatorCommissions = orders.reduce((sum, o) => sum + (o.referrerCommission || 0), 0);
  const totalNetEarnings = orders.reduce((sum, o) => sum + (o.sellerPayout || 0), 0);
  
  const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered");
  const inTransitOrders = orders.filter((o) => o.orderStatus === "shipped" || o.orderStatus === "processing" || o.orderStatus === "pending");
  const fulfillmentRate = orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 100;
  const aov = orders.length > 0 ? Math.round(grossSales / orders.length) : 0;

  // Inventory computations
  const totalInventoryUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  // Creator partnerships breakdown from real order data
  const creatorMap = new Map<string, { id: string; name: string; email: string; ordersCount: number; salesGenerated: number; commissionEarned: number }>();
  orders.forEach((ord) => {
    if (ord.referrerId && ord.referrerId._id) {
      const refId = ord.referrerId._id;
      const existing = creatorMap.get(refId) || {
        id: refId,
        name: ord.referrerId.name || "Creator Affiliate",
        email: ord.referrerId.email || "",
        ordersCount: 0,
        salesGenerated: 0,
        commissionEarned: 0
      };
      existing.ordersCount += 1;
      existing.salesGenerated += (ord.totalAmount || 0);
      existing.commissionEarned += (ord.referrerCommission || 0);
      creatorMap.set(refId, existing);
    }
  });
  const partnerCreators = Array.from(creatorMap.values());
  const referredOrdersCount = orders.filter(o => Boolean(o.referrerId)).length;
  const affiliateSalesPercentage = orders.length > 0 ? Math.round((referredOrdersCount / orders.length) * 100) : 0;

  // 7-day sales breakdown for analytics
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
    const dayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(dateStr));
    const dayGross = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const dayNet = dayOrders.reduce((sum, o) => sum + (o.sellerPayout || 0), 0);
    return { date: dateStr, label: dayLabel, count: dayOrders.length, gross: dayGross, net: dayNet };
  });
  const maxDaySales = Math.max(...last7Days.map(d => d.gross), 1);

  const formatCurrency = (amt: number) => `ETB ${(amt || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      
      {/* 1. Header / Welcome Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Company Enterprise Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            {user?.name || "Company Store"}
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          </h1>
          <p className="text-stone-400 text-sm max-w-xl leading-relaxed">
            Centralized management for your brand catalog, live order fulfillment, escrow earnings, creator partnerships, and marketplace storefront.
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-stone-300">
            <span className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1 rounded-lg">
              <Store className="w-3.5 h-3.5 text-stone-400" />
              <span>Shop: {shop?.shopSlug ? `@${shop.shopSlug}` : "Not Activated"}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Arifpay 100% Escrow Protection</span>
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors min-h-[44px]"
            aria-label="Withdraw available balance"
          >
            <Wallet className="w-4 h-4" />
            <span>Withdraw ETB</span>
          </button>
          <Link
            to="/products/new"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-900 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-stone-900" />
            <span>Add Product</span>
          </Link>
          <Link
            to="/shop-settings"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium px-4 py-2.5 rounded-xl border border-stone-700 transition-colors min-h-[44px]"
          >
            <Sliders className="w-4 h-4" />
            <span>Shop Settings</span>
          </Link>
        </div>
      </div>

      {/* 2. Navigation Module Tabs (Direct access to all 10 areas) */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-2 shadow-xs overflow-x-auto">
        <nav className="flex items-center gap-1 min-w-max" aria-label="Company Dashboard Navigation">
          {[
            { id: "overview", label: "Command Overview", count: null },
            { id: "products", label: "1. Products", count: products.length },
            { id: "inventory", label: "2. Inventory", count: totalInventoryUnits },
            { id: "orders", label: "3. Orders", count: orders.length },
            { id: "campaigns", label: "4. Campaigns", count: campaigns.length },
            { id: "creators", label: "5. Creator Applications", count: applications.filter(a => a.status === "pending").length > 0 ? `${applications.filter(a => a.status === "pending").length} pending` : applications.length },
            { id: "agreements", label: "6. Agreements", count: applications.filter(a => a.status === "approved" && a.partnershipAgreement?.status === "active").length },
            { id: "shop", label: "7. Shop", count: shop?.shopSlug ? "Live" : "Setup" },
            { id: "earnings", label: "8. Earnings", count: formatCurrency(totalNetEarnings) },
            { id: "payouts", label: "9. Payouts", count: formatCurrency(financials.availableBalance) },
            { id: "analytics", label: "10. Analytics", count: `${fulfillmentRate}%` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-stone-900 text-white shadow-xs font-bold"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? "bg-stone-800 text-stone-200"
                      : "bg-stone-100 text-stone-600 font-medium"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 3. Primary KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Available Liquidity */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 text-[#2E7D32] rounded-xl flex items-center justify-center border border-emerald-100">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              Cleared
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">Available to Cash Out</p>
            <h2 className="text-2xl font-bold text-stone-900 mt-1">
              {formatCurrency(financials.availableBalance)}
            </h2>
            <p className="text-[11px] text-stone-400 mt-1">Ready for instant Telebirr/Bank withdrawal</p>
          </div>
        </div>

        {/* Escrow Pending Balance */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              In Escrow
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">In-Transit Escrow Funds</p>
            <h2 className="text-2xl font-bold text-amber-700 mt-1">
              {formatCurrency(financials.pendingBalance || financials.pendingSellerEarnings)}
            </h2>
            <p className="text-[11px] text-stone-400 mt-1">Auto-releases upon order delivery verification</p>
          </div>
        </div>

        {/* Gross Sales */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center border border-blue-100">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-blue-800 bg-blue-100/80 px-2.5 py-0.5 rounded-full">
              Gross GMV
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">Total Marketplace Sales</p>
            <h2 className="text-2xl font-bold text-stone-900 mt-1">
              {formatCurrency(grossSales)}
            </h2>
            <p className="text-[11px] text-stone-400 mt-1">{orders.length} lifetime customer purchases</p>
          </div>
        </div>

        {/* Active Catalog & Inventory */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center border border-purple-100">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-full">
              {totalInventoryUnits} Units
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">Active Product Catalog</p>
            <h2 className="text-2xl font-bold text-stone-900 mt-1">
              {products.length} Products
            </h2>
            <p className="text-[11px] text-stone-400 mt-1">
              {outOfStockProducts.length > 0 ? `${outOfStockProducts.length} out of stock` : "All products in stock"}
            </p>
          </div>
        </div>

      </div>

      {/* 4. MAIN BODY SECTIONS */}
      {/* SECTION: OVERVIEW */}
      {(activeTab === "overview") && (
        <div className="space-y-8">
          
          {/* Quick Jump Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Products & Stock Card */}
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2 font-bold text-stone-900">
                    <Package className="w-4 h-4 text-stone-700" />
                    <span>Catalog & Inventory</span>
                  </div>
                  <button onClick={() => setActiveTab("products")} className="text-xs font-semibold text-[#2E7D32] hover:underline">
                    View &rarr;
                  </button>
                </div>
                <div className="py-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Total Catalog Items</span>
                    <span className="font-semibold text-stone-900">{products.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Total In-Stock Units</span>
                    <span className="font-semibold text-stone-900">{totalInventoryUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Low Stock Alert (≤5)</span>
                    <span className="font-semibold text-amber-600">{lowStockProducts.length} items</span>
                  </div>
                </div>
              </div>
              <Link
                to="/products/new"
                className="mt-2 w-full py-2 bg-stone-50 hover:bg-stone-100 text-stone-900 text-xs font-semibold rounded-xl text-center border border-stone-200 transition-colors"
              >
                + Add New Product
              </Link>
            </div>

            {/* Orders & Fulfillment Card */}
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2 font-bold text-stone-900">
                    <Truck className="w-4 h-4 text-amber-700" />
                    <span>Orders & Fulfillment</span>
                  </div>
                  <button onClick={() => setActiveTab("orders")} className="text-xs font-semibold text-[#2E7D32] hover:underline">
                    Manage &rarr;
                  </button>
                </div>
                <div className="py-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Pending & In-Transit</span>
                    <span className="font-semibold text-amber-600">{inTransitOrders.length} orders</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Delivered & Verified</span>
                    <span className="font-semibold text-emerald-600">{deliveredOrders.length} orders</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Fulfillment Success Rate</span>
                    <span className="font-semibold text-stone-900">{fulfillmentRate}%</span>
                  </div>
                </div>
              </div>
              <Link
                to="/orders"
                className="mt-2 w-full py-2 bg-stone-50 hover:bg-stone-100 text-stone-900 text-xs font-semibold rounded-xl text-center border border-stone-200 transition-colors"
              >
                Go to Order Dispatch Center
              </Link>
            </div>

            {/* Creator Growth & Campaigns Card */}
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2 font-bold text-stone-900">
                    <Megaphone className="w-4 h-4 text-purple-700" />
                    <span>Affiliate & Boosts</span>
                  </div>
                  <button onClick={() => setActiveTab("campaigns")} className="text-xs font-semibold text-[#2E7D32] hover:underline">
                    Boosts &rarr;
                  </button>
                </div>
                <div className="py-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Active Brand Campaigns</span>
                    <span className="font-semibold text-stone-900">{campaigns.length} active</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Partner Creators Active</span>
                    <span className="font-semibold text-stone-900">{partnerCreators.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Affiliate Sales Share</span>
                    <span className="font-semibold text-purple-700">{affiliateSalesPercentage}% of GMV</span>
                  </div>
                </div>
              </div>
              <Link
                to="/campaigns/new"
                className="mt-2 w-full py-2 bg-stone-50 hover:bg-stone-100 text-stone-900 text-xs font-semibold rounded-xl text-center border border-stone-200 transition-colors"
              >
                + Launch Boost Campaign
              </Link>
            </div>

          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900">Live Orders Pipeline</h3>
                <p className="text-xs sm:text-sm text-stone-500">Latest customer transactions and shipping queue.</p>
              </div>
              <button
                onClick={() => setActiveTab("orders")}
                className="text-xs sm:text-sm font-semibold text-[#2E7D32] hover:text-green-800 inline-flex items-center gap-1"
              >
                <span>View all {orders.length} orders</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-stone-100 rounded-2xl space-y-3">
                <Package className="w-12 h-12 text-stone-300 mx-auto" />
                <h4 className="text-base font-bold text-stone-800">No customer orders yet</h4>
                <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
                  When buyers purchase items from your storefront or creator affiliate links, they will be listed here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-800">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            order.orderStatus === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.orderStatus === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                        {order.referrerId && (
                          <span className="text-[10px] font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                            Creator: {order.referrerId.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600">
                        Buyer: <span className="font-semibold text-stone-900">{order.customerName}</span> ({order.customerPhone}) • {order.items.length} item(s) • {order.shippingAddress?.city}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-bold text-stone-900">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-[11px] text-emerald-700 font-medium">Payout: {formatCurrency(order.sellerPayout)}</p>
                      </div>
                      {order.orderStatus === "pending" || order.orderStatus === "processing" ? (
                        <button
                          onClick={() => {
                            setShippingOrderId(order._id);
                            setTrackingNumber("");
                            setActiveTab("orders");
                          }}
                          className="text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Dispatch
                        </button>
                      ) : order.orderStatus === "shipped" ? (
                        <button
                          onClick={() => handleMarkDelivered(order._id)}
                          className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Confirm Delivery
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Delivered</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: PRODUCTS */}
      {(activeTab === "products") && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-stone-700" />
                <span>Product Catalog Management</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Add, edit, and organize merchandise active in your public storefront.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/products/new"
                className="inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-green-800 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl transition-colors min-h-[40px]"
              >
                <span>Full Catalog &rarr;</span>
              </Link>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-stone-100 rounded-2xl space-y-3">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">No products in your catalog</h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
                Create your first product to start selling on the marketplace and allow creators to promote it.
              </p>
              <Link
                to="/products/new"
                className="inline-flex items-center gap-2 bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((prod) => (
                <div key={prod._id} className="bg-stone-50/50 rounded-2xl border border-stone-200/80 overflow-hidden flex flex-col justify-between hover:border-stone-300 transition-all">
                  <div className="aspect-square bg-stone-100 relative">
                    {prod.images?.[0] ? (
                      <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-stone-300" />
                      </div>
                    )}
                    <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full shadow-xs ${
                      prod.stock > 0 ? "bg-white/95 text-stone-900" : "bg-red-500 text-white"
                    }`}>
                      {prod.stock > 0 ? `${prod.stock} units` : "Out of Stock"}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{prod.category}</span>
                      <h4 className="font-semibold text-stone-900 text-sm line-clamp-1 mt-0.5">{prod.name}</h4>
                      <p className="text-sm font-bold text-stone-900 mt-1">{formatCurrency(prod.price)}</p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                      <Link
                        to={`/products/${prod._id}/edit`}
                        className="text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 px-3 py-1.5 rounded-lg flex-1 text-center"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/product/${prod._id}`}
                        className="text-xs font-semibold text-[#2E7D32] hover:text-green-800 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex-1 text-center"
                      >
                        Storefront
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: INVENTORY */}
      {(activeTab === "inventory") && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-stone-700" />
                <span>Inventory & Stock Health</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Real-time inventory levels, low-stock warnings, and restock management.
              </p>
            </div>
            <Link
              to="/products"
              className="text-xs font-semibold text-[#2E7D32] hover:underline"
            >
              Manage in Product List &rarr;
            </Link>
          </div>

          {/* Inventory Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-800">Healthy Stock (&gt;5 units)</span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {products.filter(p => p.stock > 5).length} Products
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
              <span className="text-xs font-semibold text-amber-800">Low Stock Alert (1 - 5 units)</span>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {lowStockProducts.length} Products
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100">
              <span className="text-xs font-semibold text-red-800">Out of Stock (0 units)</span>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {outOfStockProducts.length} Products
              </p>
            </div>
          </div>

          {/* Stock Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Price</th>
                  <th className="py-3 px-3 text-center">Stock Level</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-stone-900">{prod.name}</td>
                    <td className="py-3 px-3 text-stone-500 text-xs">{prod.category}</td>
                    <td className="py-3 px-3 text-right font-medium">{formatCurrency(prod.price)}</td>
                    <td className="py-3 px-3 text-center font-bold">{prod.stock}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        prod.stock > 5
                          ? "bg-green-100 text-green-800"
                          : prod.stock > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {prod.stock > 5 ? "In Stock" : prod.stock > 0 ? "Low Stock" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/products/${prod._id}/edit`}
                        className="text-xs font-semibold text-[#2E7D32] hover:underline"
                      >
                        Update Stock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: ORDERS */}
      {(activeTab === "orders") && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-stone-700" />
                <span>Orders & Fulfillment Dispatch</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Manage order processing, courier tracking assignment, and delivery confirmations.
              </p>
            </div>
            <Link
              to="/seller/orders"
              className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
            >
              <span>Full Orders Hub &rarr;</span>
            </Link>
          </div>

          {/* Shipping Modal Inline Form if an order is selected */}
          {shippingOrderId && (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900">Dispatch Order for Delivery</h4>
                <button
                  onClick={() => setShippingOrderId(null)}
                  className="text-xs text-stone-400 hover:text-stone-700"
                >
                  Cancel
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter courier tracking / dispatch reference..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                />
                <button
                  onClick={() => handleMarkShipped(shippingOrderId)}
                  disabled={isSubmittingShipping}
                  className="bg-[#2E7D32] hover:bg-green-800 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmittingShipping ? "Updating..." : "Mark as Shipped"}
                </button>
              </div>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-stone-100 rounded-2xl">
              <Package className="w-12 h-12 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-700">No customer orders recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                    <th className="py-3 px-3">Order #</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Items</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3 text-right">Net Payout</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Fulfillment Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-xs text-stone-900">{ord.orderNumber}</td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-stone-900">{ord.customerName}</p>
                        <p className="text-xs text-stone-400">{ord.customerPhone}</p>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-stone-600">
                        {ord.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-stone-900">{formatCurrency(ord.totalAmount)}</td>
                      <td className="py-3.5 px-3 text-right font-bold text-[#2E7D32]">{formatCurrency(ord.sellerPayout)}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ord.orderStatus === "delivered"
                            ? "bg-green-100 text-green-800"
                            : ord.orderStatus === "shipped"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {ord.orderStatus === "pending" || ord.orderStatus === "processing" ? (
                          <button
                            onClick={() => {
                              setShippingOrderId(ord._id);
                              setTrackingNumber("");
                            }}
                            className="text-xs font-semibold bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800"
                          >
                            Dispatch
                          </button>
                        ) : ord.orderStatus === "shipped" ? (
                          <button
                            onClick={() => handleMarkDelivered(ord._id)}
                            className="text-xs font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"
                          >
                            Confirm Delivery
                          </button>
                        ) : (
                          <span className="text-xs text-stone-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: CAMPAIGNS */}
      {(activeTab === "campaigns") && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-700" />
                <span>Brand Commission Boost Campaigns</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Incentivize top Ethiopian creators by offering boosted commission rates on select merchandise.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/campaigns/new"
                className="inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-green-800 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Campaign</span>
              </Link>
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl transition-colors min-h-[40px]"
              >
                <span>Browse All Campaigns &rarr;</span>
              </Link>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-stone-100 rounded-2xl space-y-3">
              <Megaphone className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">No active campaigns running</h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
                Create a boost campaign with higher commission rates (e.g. 20-30%) to attract top influencers.
              </p>
              <Link
                to="/campaigns/new"
                className="inline-flex items-center gap-2 bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Launch Campaign</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaigns.map((camp) => (
                <div key={camp._id} className="p-5 rounded-2xl bg-stone-50/50 border border-stone-200/80 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full">
                        {camp.boostedCommissionRate}% Boosted Commission
                      </span>
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">{camp.targetNiche || "General"}</span>
                    </div>
                    <h4 className="font-bold text-stone-900 text-base mt-2">{camp.title}</h4>
                    {camp.description && <p className="text-xs text-stone-500 mt-1 line-clamp-2">{camp.description}</p>}
                  </div>
                  <div className="pt-3 border-t border-stone-200/60 text-xs text-stone-500 flex justify-between items-center">
                    <span>{camp.products?.length || 0} product(s) enrolled</span>
                    <Link to="/campaigns" className="font-semibold text-[#2E7D32] hover:underline">
                      View details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: CREATOR PARTNERSHIPS / APPLICATIONS */}
      {(activeTab === "creators") && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-stone-700" />
                <span>Creator Partnerships & Attributions</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Creators actively driving sales for your store and incoming collaboration inquiries.
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
              {partnerCreators.length} Verified Affiliates
            </span>
          </div>

          {/* Active Partner Creators Table */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-3">Active Performance Partners</h3>
            {partnerCreators.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-stone-100 rounded-2xl text-center space-y-2">
                <Users className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-medium text-stone-600">No creator referral sales recorded yet</p>
                <p className="text-[11px] text-stone-400">Launch a boosted commission campaign to attract creator partners.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                      <th className="py-2.5 px-3">Creator Name</th>
                      <th className="py-2.5 px-3 text-center">Orders Referred</th>
                      <th className="py-2.5 px-3 text-right">GMV Generated</th>
                      <th className="py-2.5 px-3 text-right">Commission Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {partnerCreators.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3 px-3 font-semibold text-stone-900">
                          <Link to={`/user/${c.id}`} className="hover:underline text-stone-900">{c.name}</Link>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-stone-700">{c.ordersCount}</td>
                        <td className="py-3 px-3 text-right font-medium text-stone-900">{formatCurrency(c.salesGenerated)}</td>
                        <td className="py-3 px-3 text-right font-bold text-purple-700">{formatCurrency(c.commissionEarned)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Creator Applications Review Hub */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-600" />
                  <span>Campaign Applications from Creators</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Review pitches, approve creators, and establish binding partnership agreements with official tracking credentials.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl self-start sm:self-auto">
                {(["all", "pending", "approved", "rejected"] as const).map((filter) => {
                  const count =
                    filter === "all"
                      ? applications.length
                      : applications.filter((a) => a.status === filter).length;
                  return (
                    <button
                      key={filter}
                      onClick={() => setSelectedAppFilter(filter)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                        selectedAppFilter === filter
                          ? "bg-white text-stone-900 shadow-xs font-bold"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      {filter} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Application Cards List */}
            {applications.filter((a) => selectedAppFilter === "all" || a.status === selectedAppFilter).length === 0 ? (
              <div className="p-8 border-2 border-dashed border-stone-100 rounded-2xl text-center space-y-2">
                <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-medium text-stone-600">
                  {selectedAppFilter === "pending"
                    ? "No pending creator applications to review"
                    : `No applications found matching status "${selectedAppFilter}"`}
                </p>
                <p className="text-[11px] text-stone-400">
                  When creators discover your boosted campaigns, their proposals will appear here for review.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications
                  .filter((a) => selectedAppFilter === "all" || a.status === selectedAppFilter)
                  .map((app) => {
                    const isPending = app.status === "pending";
                    const isApproved = app.status === "approved";

                    return (
                      <div
                        key={app._id}
                        className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-all space-y-4 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-stone-900 text-white font-bold flex items-center justify-center text-sm">
                              {app.creatorId?.name?.charAt(0) || "C"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link to={`/user/${app.creatorId?._id}`} className="text-sm font-bold text-stone-900 hover:underline">
                                  {app.creatorId?.name || "Creator"}
                                </Link>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isPending
                                    ? "bg-amber-100 text-amber-800"
                                    : isApproved
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-stone-100 text-stone-600"
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500">{app.creatorId?.email}</p>
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[11px] text-stone-400 block">Applied Campaign</span>
                            <span className="text-xs font-bold text-purple-700">
                              {app.campaignId?.title || "Campaign"} ({app.campaignId?.boostedCommissionRate || 0}% Boosted)
                            </span>
                          </div>
                        </div>

                        {/* Pitch & Content Plan */}
                        <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-xl text-xs text-stone-700">
                          <span className="font-bold text-stone-900 block">Creator Pitch & Collaboration Plan:</span>
                          <p className="text-stone-600 leading-relaxed italic">"{app.pitchMessage}"</p>
                        </div>

                        {/* Channels and Audience */}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-stone-400 font-medium">Proposed Channels:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {app.channels?.map((ch) => (
                                <span key={ch} className="px-2 py-0.5 bg-stone-100 rounded-md text-[11px] font-medium text-stone-700">
                                  {ch}
                                </span>
                              ))}
                            </div>
                          </div>

                          {app.estimatedAudience && (
                            <div className="text-stone-500 text-[11px]">
                              Audience / Reach: <strong className="text-stone-800">{app.estimatedAudience}</strong>
                            </div>
                          )}
                        </div>

                        {/* Approved Agreement Summary or Review Actions */}
                        {isApproved && app.partnershipAgreement && (
                          app.partnershipAgreement.status === "active" ? (
                            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                                  Active Partnership Agreement
                                </span>
                                <span className="font-semibold text-stone-800">
                                  Agreed Commission Rate: {app.partnershipAgreement.agreedCommissionRate}% • Tracking Code:{" "}
                                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-purple-800 font-bold">
                                    {app.partnershipAgreement.affiliateCode}
                                  </code>
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-500">
                                Approved on {new Date(app.partnershipAgreement.approvedAt || "").toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-purple-700" />
                                  Partnership Agreement Offered (Pending Creator Signature)
                                </span>
                                <span className="font-semibold text-stone-800">
                                  Offered Commission: {app.partnershipAgreement.agreedCommissionRate}% • Tracking credentials will be generated when creator accepts.
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-500">
                                Offered on {new Date(app.partnershipAgreement.approvedAt || "").toLocaleDateString()}
                              </span>
                            </div>
                          )
                        )}

                        {isPending && (
                          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                            <button
                              onClick={() => {
                                setReviewingApp(app);
                                setAgreedRateInput(app.campaignId?.boostedCommissionRate || 15);
                                setReviewNoteInput("");
                              }}
                              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Review & Decide</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 6: AGREEMENTS */}
      {(activeTab === "agreements") && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-stone-700" />
              <span>Agreements & Digital Contracts</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Contractual governance, affiliate commission policies, and terms of service.
            </p>
          </div>

          {/* Current Active Agreement Terms */}
          <div className="p-5 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-stone-900">Marketplace Master Seller & Affiliate Agreement</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-600 pt-1">
              <div className="p-3 bg-white rounded-xl border border-stone-200/60">
                <span className="text-stone-400 block font-medium">Platform Fee</span>
                <span className="text-sm font-bold text-stone-900">5.0% flat on verified sales</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-stone-200/60">
                <span className="text-stone-400 block font-medium">Shop Default Commission</span>
                <span className="text-sm font-bold text-stone-900">{shop?.defaultCommissionRate || 0}% affiliate rate</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-stone-200/60">
                <span className="text-stone-400 block font-medium">Escrow Settlement</span>
                <span className="text-sm font-bold text-stone-900">Arifpay 100% Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Active Creator Partnership Agreements */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Executed Creator Partnership Agreements</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Binding digital collaboration contracts with approved creator affiliates.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                {applications.filter((a) => a.status === "approved" && a.partnershipAgreement?.status === "active").length} Active Agreements
              </span>
            </div>

            {applications.filter((a) => a.status === "approved" && a.partnershipAgreement).length === 0 ? (
              <div className="p-8 border-2 border-dashed border-stone-100 rounded-2xl text-center space-y-2">
                <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-medium text-stone-600">No executed creator partnership agreements yet</p>
                <p className="text-[11px] text-stone-400">
                  Approve inbound creator applications in the "Creator Applications" tab to establish binding agreements.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                      <th className="py-2.5 px-3">Creator Affiliate</th>
                      <th className="py-2.5 px-3">Campaign</th>
                      <th className="py-2.5 px-3 text-center">Agreed Rate</th>
                      <th className="py-2.5 px-3 font-mono">Tracking Code</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-center">Agreement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {applications
                      .filter((a) => a.status === "approved" && a.partnershipAgreement)
                      .map((app) => {
                        const isActive = app.partnershipAgreement?.status === "active";
                        return (
                          <tr key={app._id} className="hover:bg-stone-50/60 transition-colors">
                            <td className="py-3 px-3">
                              <Link to={`/user/${app.creatorId?._id}`} className="font-bold text-stone-900 block hover:underline">
                                {app.creatorId?.name || "Creator"}
                              </Link>
                              <span className="text-[11px] text-stone-400">{app.creatorId?.email}</span>
                            </td>
                            <td className="py-3 px-3 font-medium text-stone-800">
                              {app.campaignId?.title || "Campaign"}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-purple-700">
                              {app.partnershipAgreement?.agreedCommissionRate}%
                            </td>
                            <td className="py-3 px-3 font-mono text-stone-900 font-semibold">
                              {isActive ? (
                                <code className="bg-purple-50 text-purple-900 px-1.5 py-0.5 rounded border border-purple-200">
                                  {app.partnershipAgreement?.affiliateCode}
                                </code>
                              ) : (
                                <span className="text-stone-400 text-xs italic">Pending Signature</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-stone-500 text-xs">
                              {app.partnershipAgreement?.approvedAt
                                ? new Date(app.partnershipAgreement.approvedAt).toLocaleDateString()
                                : "Recent"}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                                  <Clock className="w-3 h-3" /> Awaiting Signature
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 7: SHOP */}
      {(activeTab === "shop") && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-stone-700" />
                <span>Storefront & Brand Page</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Your public shop profile, logo, default affiliate commission, and storefront URL.
              </p>
            </div>
            <Link
              to="/shop-settings"
              className="inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-green-800 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Sliders className="w-4 h-4" />
              <span>Edit Shop Settings</span>
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50/70 border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
                {shop?.logo ? (
                  <img src={shop.logo} alt="Shop Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Store className="w-8 h-8 text-stone-300" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-stone-900">{user?.name}</h3>
                <p className="text-xs text-stone-500 max-w-md line-clamp-2">
                  {shop?.description || "No shop description provided yet."}
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="font-semibold text-[#2E7D32]">
                    Default Commission: {shop?.defaultCommissionRate || 0}%
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-500">{products.length} Products Active</span>
                </div>
              </div>
            </div>

            {shop?.shopSlug ? (
              <Link
                to={`/shop/${shop.shopSlug}`}
                className="inline-flex items-center gap-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-900 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
              >
                <span>View Public Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/shop-settings"
                className="inline-flex items-center gap-2 bg-stone-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
              >
                <span>Activate Storefront URL</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* SECTION 8: EARNINGS */}
      {(activeTab === "earnings") && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-stone-700" />
              <span>Earnings & Financial Breakdown</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Complete transparent breakdown of Gross GMV, Platform Fees (5%), Creator Commissions, and Net Seller Payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-xs font-medium text-stone-500">Gross Merchandise Value (GMV)</span>
              <p className="text-xl font-bold text-stone-900 mt-1">{formatCurrency(grossSales)}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Total customer payments received</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-xs font-medium text-stone-500">Platform Fee (5%)</span>
              <p className="text-xl font-bold text-stone-900 mt-1">{formatCurrency(totalPlatformFees)}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Marketplace & payment gateway fee</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-xs font-medium text-purple-700">Creator Commissions</span>
              <p className="text-xl font-bold text-purple-900 mt-1">{formatCurrency(totalCreatorCommissions)}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Distributed to referring creators</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800">Net Seller Earnings</span>
              <p className="text-xl font-bold text-[#2E7D32] mt-1">{formatCurrency(totalNetEarnings)}</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Gross GMV − Platform Fee − Commission</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: PAYOUTS */}
      {(activeTab === "payouts") && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-stone-700" />
                <span>Payouts & Wallet Transactions</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Withdraw cleared escrow earnings directly to Telebirr, CBE Birr, or Commercial Bank of Ethiopia.
              </p>
            </div>
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-green-800 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-[40px]"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw Funds</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-800">Cleared Balance Available</span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(financials.availableBalance)}</p>
            </div>
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-semibold text-stone-600">Total Cleared Lifetime Earnings</span>
              <p className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(financials.totalEarned)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-3">Recent Payout Records</h3>
            {transactions.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-stone-100 rounded-2xl text-center space-y-1">
                <Wallet className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-medium text-stone-600">No withdrawal transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Reference #</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td className="py-3 px-3 text-xs text-stone-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-900">{tx.paymentMethod}</td>
                        <td className="py-3 px-3 font-mono text-xs text-stone-500">{tx.referenceNumber || "—"}</td>
                        <td className="py-3 px-3 text-right font-bold text-stone-900">{formatCurrency(tx.amount)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            tx.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : tx.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 10: ANALYTICS */}
      {(activeTab === "analytics") && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8 space-y-8">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-stone-700" />
              <span>Business Analytics & Insights</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Key performance indicators, conversion metrics, and 7-day sales activity trends.
            </p>
          </div>

          {/* KPI Mini Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-xs font-semibold text-stone-500">Average Order Value (AOV)</span>
              <p className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(aov)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-xs font-semibold text-stone-500">Fulfillment Success Rate</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{fulfillmentRate}%</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-xs font-semibold text-stone-500">Creator Referral Sales Share</span>
              <p className="text-2xl font-bold text-purple-700 mt-1">{affiliateSalesPercentage}%</p>
            </div>
          </div>

          {/* 7-Day Visual Bar Graph */}
          <div className="p-6 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-4">
            <h3 className="text-sm font-bold text-stone-900">7-Day Sales Volume Trend</h3>
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-6 pb-2 border-b border-stone-200">
              {last7Days.map((d, index) => {
                const heightPercent = maxDaySales > 0 ? Math.max((d.gross / maxDaySales) * 100, 4) : 4;
                const isToday = index === last7Days.length - 1;
                return (
                  <div key={d.date} className="flex flex-col items-center h-full justify-end group relative">
                    <span className="text-[10px] font-semibold text-stone-600 mb-1">
                      {d.gross > 0 ? `${(d.gross / 1000).toFixed(1)}k` : "0"}
                    </span>
                    <div
                      className={`w-full max-w-[40px] rounded-t-lg transition-all ${
                        isToday ? "bg-[#2E7D32]" : d.gross > 0 ? "bg-emerald-600/80" : "bg-stone-200"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center">
              {last7Days.map((d, index) => (
                <span key={d.date} className={`text-[10px] sm:text-xs font-medium ${index === last7Days.length - 1 ? "text-[#2E7D32] font-bold" : "text-stone-500"}`}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Company Review Application Modal */}
      {reviewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto relative space-y-6">
            <button
              onClick={() => setReviewingApp(null)}
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                Partnership Review
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                Review Application from {reviewingApp.creatorId?.name || "Creator"}
              </h2>
              <p className="text-xs text-stone-500">
                Campaign: <strong>{reviewingApp.campaignId?.title}</strong> (Campaign Standard: {reviewingApp.campaignId?.boostedCommissionRate}%)
              </p>
            </div>

            {/* Creator Pitch Card */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
              <span className="font-bold text-stone-900 block">Creator Proposal & Strategy:</span>
              <p className="text-stone-700 leading-relaxed italic">"{reviewingApp.pitchMessage}"</p>
              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-stone-200/60">
                <span className="text-stone-400 text-[11px]">Proposed Channels:</span>
                {reviewingApp.channels?.map((c) => (
                  <span key={c} className="px-2 py-0.5 bg-white border border-stone-200 rounded-md font-medium text-stone-800 text-[11px]">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Review Form Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Agreed Commission Rate (%) for this Creator <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={agreedRateInput}
                    onChange={(e) => setAgreedRateInput(Number(e.target.value))}
                    className="w-28 p-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 font-bold focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none"
                  />
                  <span className="text-xs text-stone-500">
                    % on all delivered sales from this creator's referrals
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Welcome Message / Terms Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reviewNoteInput}
                  onChange={(e) => setReviewNoteInput(e.target.value)}
                  placeholder="e.g. Welcome to the brand! Please tag our official handle in your videos..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none"
                />
              </div>

              {/* Policy Note */}
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Partnership Agreement Execution</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Upon approval, a binding partnership agreement is established and official tracking credentials (unique affiliate code) will be automatically generated and provided to the creator.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isReviewSubmitting}
                onClick={() => handleReviewApplication("rejected")}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                Decline Application
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingApp(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isReviewSubmitting}
                  onClick={() => handleReviewApplication("approved")}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Approve & Execute Agreement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={financials.availableBalance}
        onSuccess={fetchAllCompanyData}
      />

    </div>
  );
}
