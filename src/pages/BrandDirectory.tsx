import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Loader2, Store, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";

export default function BrandDirectory() {
  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "brand" | "creator">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/shop/directory/all`);
      setShops(data);
    } catch (error) {
      toast.error("Failed to load directory");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredShops = shops.filter((shop) => {
    const matchesTab = activeTab === "all" || shop.ownerRole === activeTab;
    const matchesSearch = 
      shop.shopSlug.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (shop.ownerId?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">Discover Sellers</h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Explore amazing brands and creators on EthioInfluence. Shop their collections or partner with them to earn commissions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          
          {/* Tabs */}
          <div className="flex p-1 bg-stone-200/50 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "all" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
            >
              All Shops
            </button>
            <button
              onClick={() => setActiveTab("brand")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "brand" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
            >
              Brands
            </button>
            <button
              onClick={() => setActiveTab("creator")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "creator" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
            >
              Creators
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shops..." 
              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm shadow-sm transition-shadow"
            />
          </div>
        </div>

        {/* Loading / Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-100">
            <Store className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-900">No shops found</h3>
            <p className="text-stone-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop) => (
              <Link key={shop._id} to={`/shop/${shop.shopSlug}`} className="group bg-white rounded-3xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-all block">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-stone-100 overflow-hidden border border-stone-100 shrink-0">
                    {shop.logo ? (
                      <img src={shop.logo} alt={shop.shopSlug} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store className="w-8 h-8 text-stone-300" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="inline-flex items-center px-2 py-0.5 rounded border border-stone-200 text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                      {shop.ownerRole}
                    </div>
                    <h3 className="font-bold text-stone-900 text-lg group-hover:text-stone-600 transition-colors line-clamp-1">
                      {shop.ownerId?.name || shop.shopSlug}
                    </h3>
                    <p className="text-stone-500 text-sm mt-1 line-clamp-2">
                      {shop.description || "Welcome to my shop!"}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-stone-500">Comm. rate: </span>
                    <span className="font-semibold text-stone-900">{shop.defaultCommissionRate || 0}%</span>
                  </div>
                  <span className="text-sm font-medium text-stone-900 group-hover:underline">Visit Store &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
