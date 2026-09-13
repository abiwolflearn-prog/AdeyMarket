import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ArrowRight, 
  Wallet, 
  Menu, 
  X, 
  Home, 
  Sparkles, 
  Flame, 
  Store, 
  LayoutDashboard, 
  Package, 
  ShoppingBasket, 
  LogOut, 
  LogIn, 
  UserPlus, 
  ChevronRight,
  ShieldCheck,
  BarChart3
} from "lucide-react";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getRoleDisplayName, getPortalTitle } from "../utils/roleUtils";

export default function Layout() {
  const { totalCount } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open & handle ESC key
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMobileMenuOpen(false);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen]);

  const handleDesktopSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(mobileSearchQuery.trim())}`);
      setMobileMenuOpen(false);
      setMobileSearchQuery("");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate("/");
    } catch (err) {
      console.warn("Logout error:", err);
    }
  };

  const isLinkActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#212121] font-sans">
      {/* 1. Header Structure (Strict Cozy® Clone) */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4 md:gap-8">
          
          {/* Logo */}
          <Link 
            to="/" 
            id="brand-logo"
            className="text-2xl sm:text-3xl font-bold tracking-tight shrink-0 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] rounded"
          >
            EthioInfluence<sup className="text-xs sm:text-sm font-normal">®</sup>
          </Link>

          {/* Desktop Search Bar */}
          <form 
            onSubmit={handleDesktopSearch} 
            className="hidden lg:flex items-center flex-1 max-w-md relative"
          >
            <label htmlFor="desktop-search" className="sr-only">Search products, creators, and brands</label>
            <Search className="w-5 h-5 absolute left-4 text-gray-400 pointer-events-none" />
            <input 
              id="desktop-search"
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for creators, products..." 
              className="w-full bg-gray-100 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] transition-shadow"
            />
          </form>

          {/* Desktop Category Nav Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
            <Link 
              to="/" 
              className={`transition-colors ${isLinkActive("/") ? "text-[#2E7D32] font-semibold" : "hover:text-[#2E7D32]"}`}
            >
              Feed
            </Link>
            <Link 
              to="/posts" 
              className={`transition-colors ${isLinkActive("/posts") ? "text-[#2E7D32] font-semibold" : "hover:text-[#2E7D32]"}`}
            >
              Creator Posts
            </Link>
            <Link 
              to="/campaigns" 
              className={`transition-colors ${isLinkActive("/campaigns") ? "text-[#2E7D32] font-semibold" : "hover:text-[#2E7D32]"}`}
            >
              Campaigns
            </Link>
            <Link 
              to="/directory" 
              className={`transition-colors ${isLinkActive("/directory") ? "text-[#2E7D32] font-semibold" : "hover:text-[#2E7D32]"}`}
            >
              Brands
            </Link>
            {user && user.role === "creator" && (
              <Link 
                to="/dashboard/analytics" 
                className={`transition-colors flex items-center gap-1.5 ${isLinkActive("/dashboard/analytics") ? "text-[#2E7D32] font-semibold" : "hover:text-[#2E7D32]"}`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                <span>Analytics</span>
              </Link>
            )}
            {user && (user.role === "creator" || user.role === "brand") && (
              <Link 
                to="/payouts" 
                className={`transition-colors flex items-center gap-1.5 ${isLinkActive("/payouts") ? "text-[#2E7D32] font-semibold" : "hover:text-[#2E7D32]"}`}
              >
                <Wallet className="w-4 h-4 text-emerald-700" />
                <span>Wallet</span>
              </Link>
            )}

          </nav>

          {/* User Actions & Mobile Trigger */}
          <div className="flex items-center gap-3 sm:gap-6 text-sm font-medium">
            <Link 
              to={user ? "/dashboard" : "/login"} 
              id="nav-account-link"
              className="hidden sm:flex items-center gap-2 hover:text-[#2E7D32] transition-colors"
            >
              <User className="w-5 h-5 text-gray-700" />
              <span>{user ? user.name.split(" ")[0] : "Sign In"},</span>
            </Link>
            
            <Link 
              to="/wishlist" 
              id="nav-wishlist-link"
              className="hidden sm:flex items-center gap-2 hover:text-[#2E7D32] transition-colors"
            >
              <Heart className="w-5 h-5 text-gray-700" />
              <span>Wishlist,</span>
            </Link>
            
            <Link 
              to="/bag" 
              id="nav-bag-link"
              className="flex items-center gap-2 hover:text-[#2E7D32] transition-colors relative min-h-[44px] px-1"
              aria-label={`Shopping Bag, ${totalCount} items`}
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-gray-700" />
                {totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-stone-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalCount > 9 ? "9+" : totalCount}
                  </span>
                )}
              </div>
              <span className="hidden xs:inline">Bag</span>
            </Link>

            {/* Mobile Navigation Trigger Button */}
            <button
              id="mobile-nav-toggle-btn"
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-gray-700 hover:text-black hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              aria-label="Open mobile navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div 
          id="mobile-nav-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-navigation-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Drawer"
        className={`fixed inset-y-0 right-0 z-50 w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <Link 
            to="/" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            EthioInfluence<sup className="text-xs font-normal">®</sup>
          </Link>
          <button
            ref={closeButtonRef}
            id="mobile-nav-close-btn"
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Mobile Search Input */}
          <form onSubmit={handleMobileSearch} className="relative">
            <label htmlFor="mobile-search-input" className="sr-only">Search products, creators, brands</label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="mobile-search-input"
              type="text"
              value={mobileSearchQuery}
              onChange={(e) => setMobileSearchQuery(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full bg-gray-100 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            />
          </form>

          {/* Main Exploration Links */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Discover</p>
            <nav aria-label="Mobile Main Navigation" className="space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isLinkActive("/") ? "bg-green-50 text-[#2E7D32] font-semibold" : "text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Home className="w-4 h-4" />
                  <span>Feed</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/posts"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isLinkActive("/posts") ? "bg-green-50 text-[#2E7D32] font-semibold" : "text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Creator Posts</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/campaigns"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isLinkActive("/campaigns") ? "bg-green-50 text-[#2E7D32] font-semibold" : "text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <span>Active Campaigns</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/directory"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isLinkActive("/directory") ? "bg-green-50 text-[#2E7D32] font-semibold" : "text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span>Brands & Stores</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </nav>
          </div>

          {/* Quick Commerce & Cart */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">My Shopping</p>
            <nav aria-label="Mobile Shopping Navigation" className="space-y-1">
              <Link
                to="/bag"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32] transition-colors"
              >
                <span className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-gray-700" />
                  <span>Shopping Bag</span>
                </span>
                {totalCount > 0 ? (
                  <span className="bg-stone-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalCount}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </Link>

              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32] transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-gray-700" />
                  <span>Saved Wishlist</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </nav>
          </div>

          {/* Role-Specific Portal Options (When Logged In) */}
          {user && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {getPortalTitle(user.role)}
              </p>
              <nav aria-label="Role Navigation" className="space-y-1">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/dashboard" ? "bg-green-50 text-[#2E7D32] font-semibold" : "text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4 text-[#2E7D32]" />
                    <span>Dashboard</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                {user.role === "consumer" && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isLinkActive("/dashboard") ? "bg-green-50 text-[#2E7D32] font-semibold" : "text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <ShoppingBasket className="w-4 h-4 text-[#2E7D32]" />
                      <span>My Orders & Shipments</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                )}

                {user.role === "creator" && (
                  <Link
                    to="/dashboard/analytics"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isLinkActive("/dashboard/analytics") ? "bg-green-50 text-[#2E7D32] font-semibold" : "text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-emerald-700" />
                      <span>Creator Analytics</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                )}


                {(user.role === "creator" || user.role === "brand") && (
                  <Link
                    to="/payouts"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isLinkActive("/payouts") ? "bg-green-50 text-[#2E7D32] font-semibold" : "text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Wallet className="w-4 h-4 text-emerald-700" />
                      <span>Wallet & Payouts</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                )}

                {user.role === "brand" && (
                  <>
                    <Link
                      to="/products"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32] transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span>Product Inventory</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    <Link
                      to="/seller/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2E7D32] transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <ShoppingBasket className="w-4 h-4 text-indigo-600" />
                        <span>Store Orders</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>

        {/* Drawer Footer (Auth & User Status) */}
        <div className="p-5 border-t border-gray-200 bg-gray-50">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-base shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-[#2E7D32]">
                      {getRoleDisplayName(user.role)}
                    </span>
                    <span className="text-xs text-gray-500 truncate">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 border border-red-200 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-[#2E7D32] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create an Account</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto">
        <Outlet />
      </main>

      {/* Footer Structure */}
      <footer className="bg-white border-t border-gray-200 mt-16 pt-16 pb-8">
        <div className="max-w-[1440px] mx-auto px-6">
          
          {/* Top Footer: Brand & Newsletter */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter">
              EthioInfluence<sup className="text-4xl md:text-6xl font-normal">®</sup>
            </h2>
            
            <div className="w-full max-w-md">
              <p className="text-sm mb-4 font-medium">Sign up for our newsletter</p>
              <div className="flex items-center border-b border-gray-300 pb-2">
                <input 
                  type="email" 
                  placeholder="Your email here" 
                  className="w-full bg-transparent focus:outline-none text-sm"
                />
                <button className="text-gray-400 hover:text-[#212121] transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Middle Footer: Links & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16 text-sm">
            <div className="lg:col-span-2 text-gray-600 space-y-2">
              <p className="font-semibold text-gray-900">EthioInfluence Commerce & Affiliate Ecosystem</p>
              <p>Addis Ababa, Ethiopia</p>
              <p className="text-xs text-gray-500">
                Empowering Ethiopian creators and local artisan brands through performance-driven social commerce and integrated Arifpay settlements.
              </p>
              
              <div className="flex items-center gap-4 pt-4">
                {/* Payment & Security Badges */}
                <div className="h-6 w-10 bg-blue-800 rounded flex items-center justify-center text-white text-[10px] font-bold shadow-xs">VISA</div>
                <div className="h-6 w-10 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                  <div className="flex -space-x-1">
                    <div className="w-3 h-3 rounded-full bg-red-500 opacity-80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80"></div>
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
                  <span>Arifpay Gateway</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-gray-900">Explore</h4>
              <ul className="space-y-3 text-gray-600">
                <li><Link to="/" className="hover:text-[#2E7D32] transition-colors">Marketplace Feed</Link></li>
                <li><Link to="/posts" className="hover:text-[#2E7D32] transition-colors">Creator Posts</Link></li>
                <li><Link to="/campaigns" className="hover:text-[#2E7D32] transition-colors">Active Campaigns</Link></li>
                <li><Link to="/directory" className="hover:text-[#2E7D32] transition-colors">Brands & Stores</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-gray-900">Account</h4>
              <ul className="space-y-3 text-gray-600">
                <li><Link to={user ? "/dashboard" : "/login"} className="hover:text-[#2E7D32] transition-colors">My Portal</Link></li>
                <li><Link to="/bag" className="hover:text-[#2E7D32] transition-colors">Shopping Bag</Link></li>
                <li><Link to="/wishlist" className="hover:text-[#2E7D32] transition-colors">Saved Wishlist</Link></li>
                {user && (user.role === "creator" || user.role === "brand") && (
                  <li><Link to="/payouts" className="hover:text-[#2E7D32] transition-colors">Wallet & Payouts</Link></li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-gray-900">Community</h4>
              <ul className="space-y-3 text-gray-600">
                <li><Link to="/directory" className="hover:text-[#2E7D32] transition-colors">Artisan Directory</Link></li>
                <li><Link to="/campaigns" className="hover:text-[#2E7D32] transition-colors">Brand Collabs</Link></li>
                <li><Link to="/register" className="hover:text-[#2E7D32] transition-colors">Join as Creator</Link></li>
                <li><Link to="/register" className="hover:text-[#2E7D32] transition-colors">Sell on Marketplace</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-gray-200 text-xs text-gray-500">
            <p>Addis Ababa, Ethiopia</p>
            <p>Local Time - 07:00 AM</p>
            <div className="flex gap-6">
              <Link to="/terms" className="hover:text-[#212121]">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-[#212121]">Privacy Policy</Link>
            </div>
            <p>© 2026 EthioInfluence</p>
          </div>

        </div>
      </footer>
    </div>
  );
}
