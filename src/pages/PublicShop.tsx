import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { Loader2, Store, Package, Search, X } from "lucide-react";
import toast from "react-hot-toast";

export default function PublicShop() {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (slug) {
      fetchShopData();
    }
  }, [slug]);

  const fetchShopData = async () => {
    try {
      setIsLoading(true);
      // Fetch shop details
      const shopRes = await api.get(`/shop/${slug}`);
      setShop(shopRes.data);

      // Fetch shop products
      const productsRes = await api.get(`/shop/${slug}/products`);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error("Shop not found");
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamically filter loaded products based on searchQuery
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const name = (product.name || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      const category = (product.category || "").toLowerCase();
      return name.includes(query) || description.includes(query) || category.includes(query);
    });
  }, [products, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Store className="w-16 h-16 text-stone-200 mb-4" />
        <h2 className="text-2xl font-bold text-stone-900">Shop Not Found</h2>
        <p className="text-stone-500 mt-2">This storefront doesn't exist or has been removed.</p>
        <Link to="/" className="mt-6 text-stone-900 font-medium hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      {/* Store Banner & Profile Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 bg-stone-100 rounded-full border-4 border-white shadow-lg overflow-hidden">
              {shop.logo ? (
                <img src={shop.logo} alt={shop.shopSlug} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-12 h-12 text-stone-300" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-semibold uppercase tracking-wider mb-3">
                {shop.ownerRole}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-3">{shop.ownerId?.name || shop.shopSlug}</h1>
              <p className="text-stone-600 max-w-2xl leading-relaxed mb-6">
                {shop.description || "Welcome to my storefront!"}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <button className="bg-stone-900 text-white px-6 py-2.5 rounded-full font-medium hover:bg-stone-800 transition-colors">
                  Follow Shop
                </button>
                <button className="bg-white text-stone-900 border border-stone-200 px-6 py-2.5 rounded-full font-medium hover:bg-stone-50 transition-colors">
                  Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Products</h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {products.length > 0 
                ? `Showing ${filteredProducts.length} of ${products.length} product${products.length === 1 ? "" : "s"}`
                : "No products currently available"}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <label htmlFor="shop-product-search" className="sr-only">Search shop products</label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input 
              id="shop-product-search"
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products in this shop..." 
              className="w-full pl-10 pr-9 py-2 border border-stone-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm shadow-2xs"
            />
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded-full focus:outline-none"
                aria-label="Clear product search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-900">No products available</h3>
            <p className="text-stone-500 mt-1">This shop hasn't listed any products yet.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center">
            <Search className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-900">No products found</h3>
            <p className="text-stone-500 mt-1 max-w-sm mx-auto">
              No products matched &ldquo;{searchQuery}&rdquo;. Try another keyword or category.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-medium rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear Search Filter</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {filteredProducts.map((product) => (
              <Link key={product._id} to={`/product/${product._id}`} className="group flex flex-col">
                <div className="aspect-[4/5] bg-stone-100 rounded-2xl overflow-hidden relative mb-4">
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-stone-300" />
                    </div>
                  )}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-stone-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">{product.category}</p>
                  <h3 className="text-base font-medium text-stone-900 leading-tight mb-2 group-hover:underline decoration-stone-300 underline-offset-4">
                    {product.name}
                  </h3>
                  <div className="mt-auto">
                    <p className="font-semibold text-stone-900">ETB {product.price.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
