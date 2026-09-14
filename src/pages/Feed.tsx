import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import {
  Search,
  Flame,
  Sparkles,
  Store,
  ShoppingBag,
  ArrowRight,
  Tag,
  Clock,
  Share2,
  Check,
  ShieldCheck,
  Filter,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Award,
} from "lucide-react";

import { 
  ScrollReveal, 
  AnimatedCard, 
  AnimatedButton, 
  AnimatedCounter, 
  StaggerContainer, 
  StaggerItem 
} from "../components/animations";

interface ProductItem {
  _id: string;
  name: string;
  price: number;
  description?: string;
  images: string[];
  stock: number;
  category: string;
  sellerId: {
    _id: string;
    name: string;
    profilePic?: string;
  };
  sellerRole?: string;
}

interface CampaignItem {
  _id: string;
  title: string;
  description?: string;
  boostedCommissionRate: number;
  startDate: string;
  endDate: string;
  bannerImage?: string;
  status: string;
  targetNiche?: string;
  products?: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
  }[];
  sellerId?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface ShopItem {
  _id: string;
  shopSlug: string;
  description?: string;
  logo?: string;
  banner?: string;
  defaultCommissionRate: number;
  ownerRole: string;
  ownerId: {
    _id: string;
    name: string;
    profilePic?: string;
  };
}

const CATEGORIES = [
  "All",
  "Fashion & Leather",
  "Food & Beverage",
  "Fashion & Clothing",
  "Cultural Crafts",
  "Home & Living",
  "Health & Beauty",
];

export default function Feed() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

  useEffect(() => {
    loadFeedData();
  }, [selectedCategory]);

  const loadFeedData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch products, active campaigns, and top shops concurrently
      const productParams: any = {};
      if (selectedCategory !== "All") {
        productParams.category = selectedCategory;
      }

      const [productsRes, campaignsRes, shopsRes] = await Promise.allSettled([
        api.get("/products", { params: productParams }),
        api.get("/campaigns", { params: { status: "active" } }),
        api.get("/shop/directory/all"),
      ]);

      if (productsRes.status === "fulfilled") {
        setProducts(Array.isArray(productsRes.value.data) ? productsRes.value.data : []);
      } else {
        console.error("Failed to load products:", productsRes.reason);
      }

      if (campaignsRes.status === "fulfilled") {
        const dataList = Array.isArray(campaignsRes.value.data) ? campaignsRes.value.data : [];
        const activeList = dataList.filter(
          (c: CampaignItem) => c.status === "active"
        );
        setCampaigns(activeList);
      } else {
        console.error("Failed to load campaigns:", campaignsRes.reason);
      }

      if (shopsRes.status === "fulfilled") {
        const shopList = Array.isArray(shopsRes.value.data) ? shopsRes.value.data : [];
        setShops(shopList.slice(0, 6)); // Top 6 shops
      } else {
        console.error("Failed to load shops:", shopsRes.reason);
      }

      if (productsRes.status === "rejected" && campaignsRes.status === "rejected") {
        setError("Failed to connect to the marketplace. Please check your connection.");
      }
    } catch (err: any) {
      console.error("Unexpected error loading feed:", err);
      setError("An unexpected error occurred while loading the marketplace.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Find if a product is part of an active campaign
  const getProductActiveCampaign = (productId: string, sellerId?: string) => {
    return campaigns.find((camp) => {
      const hasProduct = camp.products?.some(
        (p) => (typeof p === "string" ? p : p._id) === productId
      );
      if (hasProduct) return true;
      if (!camp.products || camp.products.length === 0) {
        return camp.sellerId?._id === sellerId;
      }
      return false;
    });
  };

  // Helper: Format remaining days
  const formatDaysRemaining = (endDateStr: string) => {
    try {
      const end = new Date(endDateStr).getTime();
      const now = new Date().getTime();
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return "Ending today";
      if (diffDays === 1) return "1 day left";
      return `${diffDays} days left`;
    } catch {
      return "Active";
    }
  };

  // Helper: Handle Creator Copy Referral Link
  const handleCopyAffiliateLink = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      toast.error("Please log in as a creator to copy your affiliate link");
      navigate("/login");
      return;
    }

    const creatorRef = user._id || user.name.toLowerCase().replace(/\s+/g, "");
    const link = `${window.location.origin}/product/${productId}?ref=${creatorRef}`;
    navigator.clipboard.writeText(link);
    setCopiedProductId(productId);
    toast.success("Affiliate link copied! 30-day attribution active.");
    setTimeout(() => setCopiedProductId(null), 3000);
  };

  // Filter products by search input
  const filteredProducts = products.filter((prod) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      prod.name.toLowerCase().includes(query) ||
      (prod.description || "").toLowerCase().includes(query) ||
      (prod.sellerId?.name || "").toLowerCase().includes(query) ||
      (prod.category || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full pb-20 space-y-16">
      {/* 1. HERO / DISCOVERY SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-100/70 via-stone-50 to-white pt-10 pb-16 px-4 sm:px-6 rounded-2xl border border-stone-200/80 shadow-sm mt-4">
        <ScrollReveal type="fade-up" duration={0.5}>
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ethiopia's Social Commerce & Affiliate Hub</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 leading-[1.15]">
              Discover Authentic Ethiopian Craft, Leather & Coffee
            </h1>

            <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Shop directly from verified local artisans, or partner as a content creator to earn up to{" "}
              <span className="font-semibold text-emerald-700">
                <AnimatedCounter value={25} suffix="% commission" />
              </span>{" "}
              with 30-day cookie attribution.
            </p>

            {/* Search Bar */}
            <div className="pt-2 max-w-2xl mx-auto">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 absolute left-4 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search highland leather, Yirgacheffe roasts, traditional crafts..."
                  className="w-full bg-white border border-stone-300 rounded-full py-3.5 pl-12 pr-28 text-sm text-stone-900 placeholder-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 px-3 py-1 text-xs font-medium text-stone-500 hover:text-stone-900 bg-stone-100 rounded-full"
                  >
                    Clear
                  </button>
                ) : (
                  <div className="absolute right-3 hidden sm:flex items-center gap-1 text-xs font-medium text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
                    <span>Press enter</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats / Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Arifpay & Telebirr Escrow</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Verified Ethiopian Artisans</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>30-Day Creator Attribution</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 2. CATEGORY EXPLORATION CHIPS */}
      <section className="px-4 sm:px-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-semibold tracking-wider text-stone-900 uppercase">
              Explore Categories
            </h2>
          </div>
          {selectedCategory !== "All" && (
            <button
              onClick={() => setSelectedCategory("All")}
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Reset to All
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-[#2E7D32] text-white shadow-sm ring-2 ring-[#2E7D32]/20"
                    : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. ACTIVE BOOST CAMPAIGNS (PROMOTIONAL COMMISSIONS) */}
      {campaigns.length > 0 && (
        <section className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Affiliate Multiplier</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                Active Boost Campaigns
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Higher commission payouts offered by Ethiopian brands for a limited time.
              </p>
            </div>
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#2E7D32] hover:text-green-800 transition-colors"
            >
              <span>View All Campaigns</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.slice(0, 2).map((camp) => (
              <StaggerItem key={camp._id}>
                <AnimatedCard
                  lift
                  scaleHover
                  className="bg-white rounded-xl border border-stone-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between h-full"
                >
                  {camp.bannerImage && (
                    <div className="h-44 w-full relative overflow-hidden bg-stone-100">
                      <img
                        src={camp.bannerImage}
                        alt={camp.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-amber-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{camp.boostedCommissionRate}% Boosted Rate</span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                        <span className="font-semibold text-stone-900">
                          {camp.sellerId?.name || "Verified Brand"}
                        </span>
                        <div className="flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDaysRemaining(camp.endDate)}</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-stone-900 mb-2">{camp.title}</h3>
                      <p className="text-sm text-stone-600 line-clamp-2 mb-4">
                        {camp.description || "Earn boosted commission on select products during this active promotional campaign."}
                      </p>

                      {camp.products && camp.products.length > 0 && (
                        <div className="mb-4 pt-3 border-t border-stone-100">
                          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                            Eligible Products ({camp.products.length})
                          </span>
                          <div className="flex items-center gap-2 overflow-hidden">
                            {camp.products.slice(0, 3).map((prod) => (
                              <Link
                                key={prod._id}
                                to={`/product/${prod._id}`}
                                className="text-xs bg-stone-50 hover:bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-md text-stone-700 truncate max-w-[150px]"
                              >
                                {prod.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                      <div className="text-xs">
                        <span className="text-stone-400 block">Commission Split</span>
                        <span className="font-bold text-emerald-800 text-sm">
                          {camp.boostedCommissionRate}% of product price
                        </span>
                      </div>
                      <Link
                        to="/campaigns"
                        className="bg-[#2E7D32] hover:bg-green-800 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>Promote Campaign</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      {/* 4. TOP ARTISAN / SELLER STORES */}
      {shops.length > 0 && (
        <section className="px-4 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                <Store className="w-4 h-4 text-[#2E7D32]" />
                <span>Verified Merchants</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                Top Artisan & Creator Stores
              </h2>
            </div>
            <Link
              to="/directory"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#2E7D32] hover:text-green-800 transition-colors"
            >
              <span>Explore All Shops</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <StaggerItem key={shop._id}>
                <Link
                  to={`/shop/${shop.shopSlug}`}
                  className="block h-full"
                >
                  <AnimatedCard
                    lift
                    scaleHover
                    className="group bg-white rounded-xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full"
                  >
                    <div>
                      <div className="flex items-center gap-3.5 mb-3.5">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0">
                          {shop.logo || shop.ownerId?.profilePic ? (
                            <img
                              src={shop.logo || shop.ownerId?.profilePic}
                              alt={shop.shopSlug}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <Store className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-stone-900 group-hover:text-[#2E7D32] transition-colors truncate">
                              {shop.ownerId?.name || shop.shopSlug}
                            </h3>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                              {shop.ownerRole}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 truncate">@{shop.shopSlug}</p>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 mb-4 leading-relaxed">
                        {shop.description || "Authentic handcrafted goods and creations from Addis Ababa."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                        {shop.defaultCommissionRate}% Affiliate Rate
                      </span>
                      <span className="text-stone-500 group-hover:text-stone-900 font-medium inline-flex items-center gap-1">
                        Visit Shop
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </AnimatedCard>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      {/* 5. TRENDING PRODUCTS */}
      <section className="px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
              <Tag className="w-4 h-4 text-[#2E7D32]" />
              <span>Catalog Discovery</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {selectedCategory === "All" ? "Trending Products" : `${selectedCategory}`}
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} available for direct purchase & creator promotion
            </p>
          </div>

          {user && (user.role === "brand" || user.role === "creator") && (
            <Link
              to="/products/new"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors self-start sm:self-auto"
            >
              <span>+ List New Product</span>
            </Link>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-stone-200 p-4 animate-pulse space-y-3"
              >
                <div className="w-full h-52 bg-stone-200 rounded-lg" />
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-3 bg-stone-200 rounded w-1/2" />
                <div className="flex justify-between pt-2">
                  <div className="h-5 bg-stone-200 rounded w-1/3" />
                  <div className="h-5 bg-stone-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900">Failed to Load Feed</h3>
            <p className="text-sm text-red-700 max-w-md mx-auto">{error}</p>
            <button
              onClick={loadFeedData}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-12 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-lg font-bold text-stone-900">No Products Found</h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              {searchQuery
                ? `No products matched your search "${searchQuery}". Try searching for another term or reset your category filter.`
                : "No products currently listed in this category."}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              )}
              {selectedCategory !== "All" && (
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="px-4 py-2 text-xs font-semibold bg-[#2E7D32] hover:bg-green-800 text-white rounded-lg transition-colors"
                >
                  View All Products
                </button>
              )}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !error && filteredProducts.length > 0 && (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => {
              const activeCamp = getProductActiveCampaign(prod._id, prod.sellerId?._id);
              const isCreator = user?.role === "creator";
              const isCopied = copiedProductId === prod._id;

              return (
                <StaggerItem key={prod._id}>
                  <AnimatedCard
                    lift
                    scaleHover
                    className="group bg-white rounded-xl border border-stone-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between h-full"
                  >
                    <Link to={`/product/${prod._id}`} className="block">
                      {/* Image Area */}
                      <div className="relative w-full h-56 bg-stone-100 overflow-hidden">
                        {prod.images && prod.images.length > 0 ? (
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <ShoppingBag className="w-10 h-10" />
                          </div>
                        )}

                        {/* Boost Badge if campaign is active */}
                        {activeCamp && (
                          <div className="absolute top-2.5 left-2.5 bg-amber-500 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            <span>{activeCamp.boostedCommissionRate}% Boost</span>
                          </div>
                        )}

                        {/* Stock indicator */}
                        <div className="absolute bottom-2.5 right-2.5">
                          {prod.stock > 5 ? (
                            <span className="bg-white/90 backdrop-blur-xs text-stone-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                              In Stock
                            </span>
                          ) : prod.stock > 0 ? (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              Only {prod.stock} left
                            </span>
                          ) : (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              Sold Out
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-stone-500">
                          <span className="truncate max-w-[140px] font-medium">
                            {prod.sellerId?.name || "Local Seller"}
                          </span>
                          <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px] font-medium">
                            {prod.category}
                          </span>
                        </div>

                        <h3 className="font-bold text-stone-900 group-hover:text-[#2E7D32] transition-colors text-sm line-clamp-2 leading-snug">
                          {prod.name}
                        </h3>

                        <div className="pt-2 flex items-baseline justify-between">
                          <div>
                            <span className="text-xs text-stone-400 block font-normal">Price</span>
                            <span className="text-lg font-extrabold text-stone-900 tracking-tight">
                              ETB {prod.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Actions Footer */}
                    <div className="p-4 pt-0 border-t border-stone-100 mt-2 flex items-center gap-2">
                      <AnimatedButton
                        onClick={() => {
                          addToCart({
                            productId: prod._id,
                            name: prod.name,
                            price: prod.price,
                            image: prod.images?.[0],
                            sellerId: prod.sellerId?._id,
                            stock: prod.stock,
                          });
                        }}
                        disabled={prod.stock <= 0}
                        className="flex-1 bg-[#2E7D32] hover:bg-green-800 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{prod.stock > 0 ? "Add to Bag" : "Sold Out"}</span>
                      </AnimatedButton>

                      {/* Creator Affiliate Share Action */}
                      {isCreator && (
                        <AnimatedButton
                          variant="secondary"
                          onClick={(e) => handleCopyAffiliateLink(prod._id, e)}
                          title="Copy Affiliate Link (30-day attribution)"
                          className={`p-2 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer ${
                            isCopied
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </AnimatedButton>
                      )}
                    </div>
                  </AnimatedCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </section>
    </div>
  );
}

