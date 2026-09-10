import React, { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Loader2, Package, Link as LinkIcon, Share2, Check, ShoppingBag } from "lucide-react";
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

  useEffect(() => {
    if (id) {
      fetchProductData();
    }
  }, [id]);

  useEffect(() => {
    // Track referral if ref parameter exists
    const ref = searchParams.get("ref");
    if (ref && id) {
      api.post("/referral/track", { ref, productId: id }).catch(console.error);
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
    } catch (error) {
      toast.error("Product not found");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!user || user.role === "consumer") {
      toast.error("You must be a Creator or Brand to generate affiliate links");
      return;
    }

    const baseUrl = window.location.origin;
    const affiliateUrl = `${baseUrl}/product/${product._id}?ref=${user._id}`;
    
    navigator.clipboard.writeText(affiliateUrl);
    setCopied(true);
    toast.success("Affiliate link copied to clipboard!");
    
    setTimeout(() => setCopied(false), 3000);
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
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 mt-6">
                <h3 className="font-semibold text-stone-900 mb-1 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Earn Commission
                </h3>
                <p className="text-sm text-stone-600 mb-4">
                  {activeCampaign ? (
                    <span>
                      <strong className="text-purple-700 font-bold">{activeCampaign.boostedCommissionRate}% Boosted Commission</strong> is active for this campaign! (Normally {shop?.defaultCommissionRate || 0}%)
                    </span>
                  ) : (
                    <span>
                      Share this product and earn a {shop?.defaultCommissionRate || 0}% commission on every sale.
                    </span>
                  )}
                </p>
                <button 
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-stone-300 text-stone-900 py-3 rounded-xl font-medium hover:bg-stone-50 transition-colors"
                >
                  {copied ? (
                    <><Check className="w-4 h-4 text-green-600" /> Link Copied!</>
                  ) : (
                    <><LinkIcon className="w-4 h-4" /> Get Affiliate Link</>
                  )}
                </button>
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
