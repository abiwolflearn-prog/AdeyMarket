import React, { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  Loader2,
  Package,
  Link as LinkIcon,
  Share2,
  Check,
  ShoppingBag,
  ShieldCheck,
  FileText,
  AlertCircle,
  ArrowRight,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";

export default function PublicProduct() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [affiliateEligibility, setAffiliateEligibility] = useState<any>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductData();
    }
  }, [id, user]);

  useEffect(() => {
    // Track referral if ref or code parameter exists
    const ref = searchParams.get("ref");
    const code = searchParams.get("code");
    if ((ref || code) && id) {
      api.post("/referral/track", { ref, code, productId: id }).catch(console.error);
    }
  }, [searchParams, id]);

  const fetchProductData = async () => {
    try {
      setIsLoading(true);
      const { data: prodData } = await api.get(`/products/${id}`);
      setProduct(prodData);

      // Check for any active campaign boosting this product
      try {
        const { data: campaigns } = await api.get("/campaigns?status=active");
        const matchingCampaign = campaigns.find((c: any) =>
          c.products?.some((p: any) => (p._id || p) === id) || (c.sellerId?._id === prodData.sellerId?._id && (!c.products || c.products.length === 0))
        );
        if (matchingCampaign) {
          setActiveCampaign(matchingCampaign);
        }
      } catch (err) {
        console.error("Failed to check product campaigns", err);
      }

      // Find the shop for this seller to get the slug
      const { data: shops } = await api.get(`/shop/directory/all`);
      const sellerShop = shops.find((s: any) => s.ownerId._id === prodData.sellerId._id);
      if (sellerShop) {
        setShop(sellerShop);
      }

      // Check affiliate eligibility if logged in as creator
      if (user && (user.role === "creator" || user.role === "brand") && user._id !== prodData.sellerId._id) {
        try {
          const { data: eligData } = await api.get(`/referral/check-eligibility/${id}`);
          setAffiliateEligibility(eligData);
        } catch (eligErr) {
          console.error("Failed to check affiliate eligibility", eligErr);
        }
      }
    } catch (error) {
      toast.error("Product not found");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!user || user.role === "consumer") {
      toast.error("You must be a Creator or Brand to generate affiliate links");
      return;
    }

    if (!affiliateEligibility?.isEligible) {
      if (affiliateEligibility?.status === "pending_creator_acceptance") {
        toast.error("Please accept the partnership agreement on the Campaigns page to unlock your link");
        navigate("/campaigns");
        return;
      }
      if (affiliateEligibility?.status === "pending_company_acceptance" || affiliateEligibility?.status === "pending_application") {
        toast.error("Your application is still under review by the brand");
        return;
      }
      toast.error("An active Partnership Agreement with the seller is required to generate affiliate links");
      navigate("/campaigns");
      return;
    }

    try {
      setIsGeneratingLink(true);
      const res = await api.post("/referral/generate-link", {
        productId: product._id,
        campaignId: affiliateEligibility?.agreement?.campaignId?._id || activeCampaign?._id,
        agreementId: affiliateEligibility?.agreement?._id,
      });

      const affiliateUrl = res.data.link?.url || `${window.location.origin}/product/${product._id}?ref=${user._id}&code=${affiliateEligibility.affiliateCode}`;
      
      navigator.clipboard.writeText(affiliateUrl);
      setCopied(true);
      toast.success("Official partner tracking link copied!");
      
      setTimeout(() => setCopied(false), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate affiliate tracking link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Package className="w-16 h-16 text-stone-200 mb-4" />
        <h2 className="text-2xl font-bold text-stone-900">Product Not Found</h2>
        <p className="text-stone-500 mt-2">This product doesn't exist or was removed.</p>
        <Link to="/" className="mt-6 text-stone-900 font-medium hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
      <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
        
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-stone-100 rounded-3xl overflow-hidden relative">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-stone-300" />
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-stone-900' : 'border-transparent hover:opacity-80'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
          {/* Seller Info */}
          {shop && (
            <Link to={`/shop/${shop.shopSlug}`} className="inline-flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden border border-stone-200">
                {shop.logo ? (
                  <img src={shop.logo} alt={shop.shopSlug} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-stone-200" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900 leading-none">{product.sellerId.name}</p>
                <p className="text-xs text-stone-500 mt-1">Visit Storefront</p>
              </div>
            </Link>
          )}

          {/* Active Campaign Banner if applicable */}
          {activeCampaign && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold w-fit">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span>{activeCampaign.boostedCommissionRate}% Boosted Commission Campaign Active</span>
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 leading-tight mb-4">
            {product.name}
          </h1>
          
          <div className="text-2xl font-semibold text-stone-900 mb-8">
            ETB {product.price.toLocaleString()}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-10">
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                disabled={product.stock <= 0}
                onClick={() => {
                  addToCart({
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0],
                    stock: product.stock,
                    sellerId: product.sellerId?._id,
                  }, 1);
                }}
                className="flex-1 bg-white border-2 border-stone-900 text-stone-900 py-3.5 rounded-full font-semibold text-base hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" /> Add to Bag
              </button>

              <button 
                disabled={product.stock <= 0}
                onClick={() => {
                  addToCart({
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0],
                    stock: product.stock,
                    sellerId: product.sellerId?._id,
                  }, 1);
                  navigate("/checkout");
                }}
                className="flex-1 bg-stone-900 text-white py-3.5 rounded-full font-semibold text-base hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock > 0 ? "Buy Now" : "Out of Stock"}
              </button>
            </div>
            
            {/* Affiliate Link Generation (For Creators/Brands only) */}
            {user && (user.role === "creator" || user.role === "brand") && user._id !== product.sellerId._id && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-900 flex items-center gap-2 text-sm">
                    <Share2 className="w-4 h-4 text-stone-700" /> Affiliate Partnership
                  </h3>
                  {affiliateEligibility?.isEligible ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" /> Agreement Active
                    </span>
                  ) : affiliateEligibility?.status === "pending_creator_acceptance" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                      <FileText className="w-3.5 h-3.5" /> Agreement Offered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 bg-stone-200/70 px-2.5 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> Agreement Required
                    </span>
                  )}
                </div>

                {affiliateEligibility?.isEligible ? (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Active Commission Rate:</span>
                        <span className="font-extrabold text-purple-700">
                          {affiliateEligibility.agreement.commissionRate}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Tracking Affiliate Code:</span>
                        <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-bold text-purple-900">
                          {affiliateEligibility.affiliateCode}
                        </code>
                      </div>
                    </div>
                    <button 
                      onClick={handleCopyLink}
                      disabled={isGeneratingLink}
                      className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                    >
                      {copied ? (
                        <><Check className="w-4 h-4 text-emerald-400" /> Tracking Link Copied!</>
                      ) : (
                        <><LinkIcon className="w-4 h-4" /> Copy Official Tracking Link</>
                      )}
                    </button>
                  </div>
                ) : affiliateEligibility?.status === "pending_creator_acceptance" ? (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-950">
                      <p className="font-semibold mb-1">Brand approved your application!</p>
                      <p className="text-purple-800 text-[11px] leading-relaxed">
                        Sign the official Company ↔ Creator partnership agreement to unlock your unique tracking link and credentials.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/campaigns")}
                      className="w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white py-2.5 rounded-xl font-medium text-xs transition-colors shadow-xs"
                    >
                      <FileText className="w-4 h-4" /> Review & Sign Agreement
                    </button>
                  </div>
                ) : affiliateEligibility?.status === "pending_application" || affiliateEligibility?.status === "pending_company_acceptance" ? (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950">
                      <p className="font-semibold mb-1">Application In Review</p>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        Your campaign application is awaiting brand review and agreement setup. Tracking links are locked until activated.
                      </p>
                    </div>
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-400 py-2.5 rounded-xl font-medium text-xs cursor-not-allowed border border-stone-200"
                    >
                      <Lock className="w-3.5 h-3.5" /> Tracking Link Locked
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {activeCampaign ? (
                        <span>
                          <strong className="text-purple-700 font-bold">{activeCampaign.boostedCommissionRate}% Boosted Commission</strong> is available under campaign <strong>"{activeCampaign.title}"</strong>. An active partnership agreement is required to generate tracking credentials.
                        </span>
                      ) : (
                        <span>
                          Affiliate links are issued exclusively under an active Company ↔ Creator partnership agreement. Apply to a campaign with this brand to partner.
                        </span>
                      )}
                    </p>
                    <button
                      onClick={() => navigate("/campaigns")}
                      className="w-full flex items-center justify-center gap-2 bg-white border border-stone-300 text-stone-800 py-2.5 rounded-xl font-medium text-xs hover:bg-stone-100 transition-colors"
                    >
                      <span>Browse & Apply in Campaigns</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="prose prose-stone max-w-none">
            <h3 className="text-lg font-bold text-stone-900 mb-3">Description</h3>
            <p className="text-stone-600 whitespace-pre-wrap leading-relaxed">
              {product.description}
            </p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-stone-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-stone-500 block mb-1">Category</span>
                <span className="font-medium text-stone-900">{product.category}</span>
              </div>
              <div>
                <span className="text-stone-500 block mb-1">Stock Status</span>
                <span className="font-medium text-stone-900">
                  {product.stock > 0 ? `${product.stock} available` : 'Sold out'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
