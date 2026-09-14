import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  Compass,
  Tag,
  ShoppingBag,
  Heart,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Search,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { totalCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out of Customer Portal");
    navigate("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    {
      group: "Shopping & Orders",
      items: [
        {
          name: "My Orders & Shipments",
          to: "/customer/orders",
          icon: Package,
          match: (path: string) => path === "/customer" || path === "/customer/orders" || path === "/customer/dashboard",
        },
        {
          name: "Discover Products",
          to: "/customer/discover",
          icon: Compass,
          match: (path: string) => path === "/customer/discover" || path === "/customer/products",
        },
        {
          name: "Creator Promo Codes",
          to: "/customer/promos",
          icon: Tag,
          match: (path: string) => path === "/customer/promos",
        },
        {
          name: "Shopping Bag",
          to: "/customer/cart",
          icon: ShoppingBag,
          badge: totalCount > 0 ? totalCount : null,
          match: (path: string) => path === "/customer/cart" || path === "/bag" || path === "/cart",
        },
        {
          name: "Saved Wishlist",
          to: "/customer/wishlist",
          icon: Heart,
          match: (path: string) => path === "/customer/wishlist",
        },
      ],
    },
    {
      group: "Account & Preferences",
      items: [
        {
          name: "Delivery Address & Profile",
          to: "/customer/profile",
          icon: User,
          match: (path: string) => path === "/customer/profile",
        },
        {
          name: "Account Settings",
          to: "/customer/settings",
          icon: Settings,
          match: (path: string) => path === "/customer/settings",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col font-sans text-stone-900">
      {/* Customer Portal Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200/80 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger + Adey Logo + Customer Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
              aria-label="Toggle customer menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/customer" className="flex items-center gap-2.5">
              <span className="font-extrabold text-2xl tracking-tighter text-stone-900">
                Adey<span className="text-[#2E7D32]">.</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-[#2E7D32] border border-emerald-200/80">
                <ShoppingBag className="w-3 h-3 text-[#2E7D32]" />
                Customer Portal
              </span>
            </Link>
          </div>

          {/* Center: Search Marketplace Products */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Search products across Ethiopia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-100/80 border border-stone-200/80 rounded-xl text-xs placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] transition-all"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            </form>
          </div>

          {/* Right: Shopping Bag + Customer Profile + Sign Out */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Bag Icon with count badge */}
            <Link
              to="/customer/cart"
              className="relative p-2 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
              title="View Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#2E7D32] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </Link>

            {/* Customer Profile Pill */}
            <div className="flex items-center gap-2.5 py-1 px-2.5 sm:px-3 bg-stone-100/80 border border-stone-200/60 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-[#2E7D32] text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || "C"
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[120px]">
                  {user?.name || "Customer"}
                </p>
                <p className="text-[10px] text-stone-500 font-medium">Shopper</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-xl transition-colors min-h-[36px]"
              title="Sign Out of Customer Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content Area */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-stone-200/80 bg-white shrink-0 p-4 space-y-6 min-h-[calc(100vh-4rem)]">
          {/* Customer Summary Card */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/60 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white font-bold text-base flex items-center justify-center shrink-0">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-stone-900 truncate">{user?.name}</h4>
                <p className="text-xs text-stone-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 text-[11px]">
              <span className="text-stone-500">Protection:</span>
              <span className="font-bold text-[#2E7D32] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                Arifpay Escrow
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-5">
            {navItems.map((group) => (
              <div key={group.group} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                  {group.group}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.match(location.pathname);
                  return (
                    <Link
                      key={item.name}
                      to={item.to}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-stone-900 text-white shadow-xs font-bold"
                          : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-emerald-400" : "text-stone-400"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge ? (
                        <span className="bg-[#2E7D32] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      ) : isActive ? (
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Buyer Escrow Assurance Badge */}
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3 text-[11px] text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>100% Buyer Protection</span>
            </div>
            <p className="text-[10px] text-emerald-700 leading-snug">
              Funds are held securely in Arifpay escrow until you confirm delivery of your package.
            </p>
          </div>
        </aside>

        {/* Mobile Slide-over Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div
              ref={drawerRef}
              className="relative ml-0 flex flex-col w-4/5 max-w-xs bg-white h-full shadow-2xl p-5 space-y-6 z-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tighter text-stone-900">
                    Adey<span className="text-[#2E7D32]">.</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-[#2E7D32] border border-emerald-200">
                    Customer Portal
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </form>

              {/* Navigation in Mobile */}
              <nav className="space-y-4 flex-1">
                {navItems.map((group) => (
                  <div key={group.group} className="space-y-1">
                    <p className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                      {group.group}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.match(location.pathname);
                      return (
                        <Link
                          key={item.name}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-stone-900 text-white font-bold"
                              : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`w-4 h-4 ${
                                isActive ? "text-emerald-400" : "text-stone-400"
                              }`}
                            />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="bg-[#2E7D32] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="pt-4 border-t border-stone-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-xl text-xs transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Outlet Area */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
