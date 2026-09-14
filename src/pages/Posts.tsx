import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import {
  Sparkles,
  ShoppingBag,
  Share2,
  Flame,
  Check,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Tag,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  Store,
  UserCheck,
  Clock,
  Image as ImageIcon,
} from "lucide-react";

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

export interface CreatorPost {
  _id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar?: string;
  caption: string;
  mediaUrl: string;
  createdAt: string;
  taggedProductId: string;
  category?: string;
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

const LOCAL_STORAGE_POSTS_KEY = "ethioinfluence_creator_posts";

export default function Posts() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Data States
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Discovery / Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

  // Create Post Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch live posts, products, and active campaigns concurrently
      const [postsRes, productsRes, campaignsRes] = await Promise.allSettled([
        api.get("/posts"),
        api.get("/products"),
        api.get("/campaigns", { params: { status: "active" } }),
      ]);

      if (postsRes.status === "fulfilled" && Array.isArray(postsRes.value.data)) {
        const fetchedPosts: CreatorPost[] = postsRes.value.data.map((p: any) => ({
          _id: p._id,
          creatorId: typeof p.creatorId === "object" ? p.creatorId._id : p.creatorId,
          creatorName: p.creatorName || p.creatorId?.name || "Creator",
          creatorUsername: p.creatorUsername || p.creatorId?.name?.toLowerCase().replace(/\s+/g, "_") || "creator",
          creatorAvatar: p.creatorAvatar || p.creatorId?.profilePic || undefined,
          caption: p.caption,
          mediaUrl: p.mediaUrl,
          createdAt: p.createdAt,
          taggedProductId: typeof p.taggedProductId === "object" ? p.taggedProductId._id : p.taggedProductId,
          category: p.category || p.taggedProductId?.category || "Fashion & Leather",
        }));
        setPosts(fetchedPosts);
      } else {
        console.warn("API posts fetch returned empty or failed, checking localStorage fallback");
        const savedPostsRaw = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
        if (savedPostsRaw) {
          try {
            const parsed = JSON.parse(savedPostsRaw);
            if (Array.isArray(parsed)) {
              setPosts(parsed);
            }
          } catch (e) {
            console.error("Error parsing saved posts:", e);
          }
        }
      }

      let loadedProducts: ProductItem[] = [];
      if (productsRes.status === "fulfilled") {
        loadedProducts = Array.isArray(productsRes.value.data) ? productsRes.value.data : [];
        setProducts(loadedProducts);
      } else {
        console.error("Failed to load products:", productsRes.reason);
      }

      if (campaignsRes.status === "fulfilled") {
        const activeList = (Array.isArray(campaignsRes.value.data) ? campaignsRes.value.data : []).filter(
          (c: CampaignItem) => c.status === "active"
        );
        setCampaigns(activeList);
      } else {
        console.error("Failed to load campaigns:", campaignsRes.reason);
      }

      if (productsRes.status === "rejected" && campaignsRes.status === "rejected") {
        setError("Failed to connect to the marketplace. Please check your connection.");
      }
    } catch (err: any) {
      console.error("Unexpected error loading posts data:", err);
      setError("An unexpected error occurred while loading creator posts.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Find product details by ID
  const getProductById = (productId: string): ProductItem | undefined => {
    return products.find((p) => p._id === productId);
  };

  // Helper: Check if product has an active boosted campaign
  const getActiveCampaign = (productId: string, sellerId?: string) => {
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

  // Helper: Format post relative time
  const formatPostTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return "Just now";
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays === 1) return "Yesterday";
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  // Creator Affiliate Link Action (30-day attribution)
  const handleCopyAffiliateLink = (
    productId: string,
    creatorUsername: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();

    // If current logged-in user is a creator, use their ID/handle, otherwise use the posting creator's handle
    const refParam = user?.role === "creator"
      ? (user._id || user.name.toLowerCase().replace(/\s+/g, ""))
      : creatorUsername || "creator";

    const link = `${window.location.origin}/product/${productId}?ref=${refParam}`;
    navigator.clipboard.writeText(link);
    setCopiedProductId(productId);
    toast.success("Affiliate link copied! 30-day attribution active.");
    setTimeout(() => setCopiedProductId(null), 3000);
  };

  // Create & Publish a Shoppable Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to publish a creator look.");
      navigate("/login");
      return;
    }

    if (!selectedProductId) {
      toast.error("Please select a product to tag.");
      return;
    }

    if (!newCaption.trim()) {
      toast.error("Please add a caption for your look.");
      return;
    }

    const taggedProduct = getProductById(selectedProductId);
    const media = newMediaUrl.trim() || taggedProduct?.images?.[0] || "https://images.unsplash.com/photo-1548036328-c9fa89d128fa";

    setIsSubmittingPost(true);

    try {
      const res = await api.post("/posts", {
        caption: newCaption.trim(),
        mediaUrl: media,
        taggedProductId: selectedProductId,
        category: taggedProduct?.category || "Fashion & Leather",
      });

      const createdData = res.data;
      const newPost: CreatorPost = {
        _id: createdData._id,
        creatorId: typeof createdData.creatorId === "object" ? createdData.creatorId._id : (user._id || "creator"),
        creatorName: createdData.creatorName || user.name,
        creatorUsername: createdData.creatorUsername || user.name.toLowerCase().replace(/\s+/g, ""),
        creatorAvatar: createdData.creatorAvatar || (user as any).profilePic || undefined,
        caption: createdData.caption,
        mediaUrl: createdData.mediaUrl,
        createdAt: createdData.createdAt || new Date().toISOString(),
        taggedProductId: typeof createdData.taggedProductId === "object" ? createdData.taggedProductId._id : selectedProductId,
        category: createdData.category || taggedProduct?.category || "Fashion & Leather",
      };

      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));

      toast.success("Shoppable post published successfully!");
      setIsCreateModalOpen(false);
      setNewCaption("");
      setNewMediaUrl("");
      setSelectedProductId("");
    } catch (err: any) {
      console.error("Error creating post via API:", err);
      toast.error(err.response?.data?.message || "Failed to publish post.");
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Filter posts by search query and category
  const filteredPosts = posts.filter((post) => {
    const taggedProd = getProductById(post.taggedProductId);
    
    // Category match
    if (selectedCategory !== "All") {
      if (post.category !== selectedCategory && taggedProd?.category !== selectedCategory) {
        return false;
      }
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCaption = post.caption.toLowerCase().includes(q);
      const matchCreator = post.creatorName.toLowerCase().includes(q);
      const matchProduct = taggedProd?.name.toLowerCase().includes(q) || false;
      const matchCategory = (taggedProd?.category || post.category || "").toLowerCase().includes(q);
      return matchCaption || matchCreator || matchProduct || matchCategory;
    }

    return true;
  });

  return (
    <div className="w-full pb-20 space-y-12">
      {/* 1. HEADER SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-100/70 via-stone-50 to-white pt-10 pb-12 px-4 sm:px-6 rounded-2xl border border-stone-200/80 shadow-sm mt-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Shoppable Social Commerce</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.15]">
            Creator Looks & Shoppable Posts
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Discover how Ethiopian creators style authentic leather, traditional cottons, and specialty roasts. Shop tagged products directly or earn up to{" "}
            <span className="font-semibold text-emerald-700">25% affiliate commission</span>.
          </p>

          {/* Action Bar & Search */}
          <div className="pt-2 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creator looks, products, styling tips..."
                className="w-full bg-white border border-stone-300 rounded-full py-3 pl-12 pr-24 text-sm text-stone-900 placeholder-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 px-3 py-1 text-xs font-medium text-stone-500 hover:text-stone-900 bg-stone-100 rounded-full"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => {
                if (!user) {
                  toast.error("Please log in to share a look.");
                  navigate("/login");
                  return;
                }
                setIsCreateModalOpen(true);
              }}
              className="w-full sm:w-auto whitespace-nowrap bg-[#2E7D32] hover:bg-green-800 text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Share Your Look</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY DISCOVERY PILLS */}
      <section className="px-4 sm:px-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-semibold tracking-wider text-stone-900 uppercase">
              Filter by Niche
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

      {/* 3. POSTS GALLERY FEED */}
      <section className="px-4 sm:px-0">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-stone-200 rounded w-1/3" />
                    <div className="h-3 bg-stone-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="w-full h-72 bg-stone-200 rounded-xl" />
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-20 bg-stone-100 rounded-xl border border-stone-200" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900">Failed to Load Creator Posts</h3>
            <p className="text-sm text-red-700 max-w-md mx-auto">{error}</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State (Production Quality Empty State per Step 11) */}
        {!isLoading && !error && filteredPosts.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-6 max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
              <Sparkles className="w-8 h-8 text-[#2E7D32]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-stone-900">
                {searchQuery || selectedCategory !== "All"
                  ? "No Creator Posts Matched Your Filter"
                  : "No creator posts yet"}
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed max-w-md mx-auto">
                {searchQuery || selectedCategory !== "All"
                  ? `No looks found for "${searchQuery || selectedCategory}". Try searching for another keyword or reset the filter.`
                  : "Creators can share product content here and connect with customers."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {searchQuery || selectedCategory !== "All" ? (
                <>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    className="px-5 py-2.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full transition-colors"
                  >
                    Reset All Filters
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (!user) {
                        toast.error("Please log in to share a look.");
                        navigate("/login");
                        return;
                      }
                      setIsCreateModalOpen(true);
                    }}
                    className="px-6 py-2.5 text-xs font-semibold bg-[#2E7D32] hover:bg-green-800 text-white rounded-full transition-colors inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Post the First Look</span>
                  </button>

                  <Link
                    to="/"
                    className="px-6 py-2.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Browse Marketplace Products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Posts Feed Grid */}
        {!isLoading && !error && filteredPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => {
              const taggedProduct = getProductById(post.taggedProductId);
              const activeCamp = taggedProduct
                ? getActiveCampaign(taggedProduct._id, taggedProduct.sellerId?._id)
                : undefined;
              const isCopied = taggedProduct && copiedProductId === taggedProduct._id;

              return (
                <article
                  key={post._id}
                  className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  {/* Post Header: Creator Info */}
                  <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                    <Link
                      to={`/user/${post.creatorId}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0">
                        {post.creatorAvatar ? (
                          <img
                            src={post.creatorAvatar}
                            alt={post.creatorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-stone-500 bg-stone-100 text-xs">
                            {post.creatorName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-stone-900 group-hover:text-[#2E7D32] transition-colors truncate">
                            {post.creatorName}
                          </span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                            <UserCheck className="w-2.5 h-2.5" />
                            <span>Creator</span>
                          </span>
                        </div>
                        <span className="text-xs text-stone-400 block truncate">
                          @{post.creatorUsername}
                        </span>
                      </div>
                    </Link>

                    <div className="text-right">
                      <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{formatPostTime(post.createdAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Post Media */}
                  <div className="relative w-full h-80 bg-stone-100 overflow-hidden group">
                    <img
                      src={post.mediaUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Tagged Item Pill Indicator */}
                    <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white font-semibold text-[11px] px-3 py-1 rounded-full shadow flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-emerald-400" />
                      <span>Shoppable Look</span>
                    </div>

                    {/* Campaign Boost Badge if active */}
                    {activeCamp && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white font-extrabold text-[11px] px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{activeCamp.boostedCommissionRate}% Boost</span>
                      </div>
                    )}
                  </div>

                  {/* Post Caption */}
                  <div className="p-4 pb-2">
                    <p className="text-sm text-stone-800 leading-relaxed font-normal">
                      <span className="font-bold mr-1.5 text-stone-900">
                        {post.creatorName}
                      </span>
                      {post.caption}
                    </p>
                  </div>

                  {/* Tagged Product Box */}
                  {taggedProduct ? (
                    <div className="p-4 pt-2">
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/product/${taggedProduct._id}`}
                            className="w-14 h-14 rounded-lg overflow-hidden border border-stone-200 bg-white flex-shrink-0"
                          >
                            <img
                              src={taggedProduct.images?.[0]}
                              alt={taggedProduct.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-[11px] text-stone-500 mb-0.5">
                              <span className="truncate max-w-[130px] font-medium">
                                {taggedProduct.sellerId?.name || "Artisan Brand"}
                              </span>
                              <span className="text-[10px] bg-white border border-stone-200 text-stone-600 px-1.5 py-0.5 rounded">
                                {taggedProduct.category}
                              </span>
                            </div>

                            <Link
                              to={`/product/${taggedProduct._id}`}
                              className="font-bold text-stone-900 hover:text-[#2E7D32] transition-colors text-xs line-clamp-1 block"
                            >
                              {taggedProduct.name}
                            </Link>

                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-sm font-extrabold text-stone-900">
                                ETB {taggedProduct.price.toLocaleString()}
                              </span>
                              {activeCamp ? (
                                <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {activeCamp.boostedCommissionRate}% Creator Commission
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  Verified Product
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Product Action Buttons */}
                        <div className="pt-2 border-t border-stone-200/60 flex items-center gap-2">
                          <button
                            onClick={() => {
                              addToCart({
                                productId: taggedProduct._id,
                                name: taggedProduct.name,
                                price: taggedProduct.price,
                                image: taggedProduct.images?.[0],
                                sellerId: taggedProduct.sellerId?._id,
                                stock: taggedProduct.stock,
                              });
                            }}
                            disabled={taggedProduct.stock <= 0}
                            className="flex-1 bg-[#2E7D32] hover:bg-green-800 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{taggedProduct.stock > 0 ? "Add to Bag" : "Sold Out"}</span>
                          </button>

                          <button
                            onClick={(e) =>
                              handleCopyAffiliateLink(
                                taggedProduct._id,
                                post.creatorUsername,
                                e
                              )
                            }
                            title="Copy Affiliate Link (30-day attribution)"
                            className={`p-2 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center ${
                              isCopied
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                : "bg-white border-stone-300 text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>

                          <Link
                            to={`/product/${taggedProduct._id}`}
                            className="p-2 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold transition-colors"
                            title="View Product Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 pt-2">
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-500 text-center">
                        Tagged product is currently unavailable.
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. "SHARE YOUR LOOK" CREATOR MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Share a Shoppable Look</h3>
                <p className="text-xs text-stone-500">
                  Tag an authentic Ethiopian product to earn affiliate commission on orders.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Tag Product Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  1. Select Product to Tag *
                </label>
                {products.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No products available to tag.</p>
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full bg-white border border-stone-300 rounded-xl py-2.5 px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  >
                    <option value="">-- Choose an authentic product --</option>
                    {products.map((prod) => (
                      <option key={prod._id} value={prod._id}>
                        {prod.name} (ETB {prod.price.toLocaleString()}) – {prod.sellerId?.name || "Seller"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Photo / Media URL */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  2. Look Image URL (Optional)
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="url"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... (leave blank to use product photo)"
                    className="w-full bg-white border border-stone-300 rounded-xl py-2.5 pl-9 pr-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  If left empty, the tagged product's primary photo will be featured.
                </p>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  3. Caption & Styling Review *
                </label>
                <textarea
                  rows={3}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Tell your followers how you style or use this piece..."
                  required
                  className="w-full bg-white border border-stone-300 rounded-xl p-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              {/* Preview Box if product selected */}
              {selectedProductId && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center gap-3">
                  {getProductById(selectedProductId)?.images?.[0] && (
                    <img
                      src={getProductById(selectedProductId)?.images?.[0]}
                      alt="Selected"
                      className="w-12 h-12 object-cover rounded-lg border border-stone-200 bg-white"
                    />
                  )}
                  <div className="text-xs">
                    <span className="font-bold text-stone-900 block">
                      {getProductById(selectedProductId)?.name}
                    </span>
                    <span className="text-emerald-800 font-semibold">
                      ETB {getProductById(selectedProductId)?.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost || !selectedProductId}
                  className="px-5 py-2 text-xs font-semibold bg-[#2E7D32] hover:bg-green-800 disabled:bg-stone-200 text-white rounded-lg transition-colors shadow-sm"
                >
                  {isSubmittingPost ? "Publishing..." : "Publish Look"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
