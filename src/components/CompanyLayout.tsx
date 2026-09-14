import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Package,
  PlusCircle,
  Flame,
  Users,
  ShoppingBasket,
  TrendingUp,
  Wallet,
  Sliders,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function CompanyLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out of Company Portal");
    navigate("/login");
  };

  const navItems = [
    {
      group: "Operations",
      items: [
        {
          name: "Dashboard",
          to: "/company/dashboard",
          icon: LayoutDashboard,
          match: (path: string) => path === "/company" || path === "/company/dashboard",
        },
        {
          name: "Brand Profile",
          to: "/company/settings",
          icon: Store,
          match: (path: string) => path === "/company/settings" || path === "/company/brand",
        },
      ],
    },
    {
      group: "Catalog & Growth",
      items: [
        {
          name: "Products Catalog",
          to: "/company/products",
          icon: Package,
          match: (path: string) => path === "/company/products",
        },
        {
          name: "Add New Product",
          to: "/company/products/new",
          icon: PlusCircle,
          match: (path: string) => path === "/company/products/new",
        },
        {
          name: "Campaigns",
          to: "/company/campaigns",
          icon: Flame,
          match: (path: string) => path.startsWith("/company/campaigns"),
        },
        {
          name: "Creator Partnerships",
          to: "/company/creators",
          icon: Users,
          match: (path: string) => path === "/company/creators",
        },
      ],
    },
    {
      group: "Fulfillment & Finance",
      items: [
        {
          name: "Customer Orders",
          to: "/company/orders",
          icon: ShoppingBasket,
          match: (path: string) => path === "/company/orders",
        },
        {
          name: "Sales & Analytics",
          to: "/company/analytics",
          icon: TrendingUp,
          match: (path: string) => path === "/company/analytics",
        },
        {
          name: "Earnings & Withdrawals",
          to: "/company/payouts",
          icon: Wallet,
          match: (path: string) => path === "/company/payouts" || path === "/company/earnings",
        },
      ],
    },
    {
      group: "Settings",
      items: [
        {
          name: "Company Settings",
          to: "/company/settings",
          icon: Sliders,
          match: (path: string) => path === "/company/settings",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col font-sans text-stone-900">
      {/* Company Portal Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200/80 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Hamburger + Logo + Portal Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/company/dashboard" className="flex items-center gap-2.5">
              <span className="font-extrabold text-2xl tracking-tighter text-stone-900">
                Adey<span className="text-[#2E7D32]">.</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-blue-800 border border-blue-200/80">
                <Building2 className="w-3 h-3 text-blue-700" />
                Company Portal
              </span>
            </Link>
          </div>

          {/* Right: Public Storefront link + Brand Profile pill + Sign Out */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-stone-500" />
              <span>Public Storefront</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </Link>

            {/* Company Profile Pill */}
            <div className="flex items-center gap-2.5 py-1 px-2.5 sm:px-3 bg-stone-100/80 border border-stone-200/60 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-stone-900 text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || "B"
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[130px]">
                  {user?.name || "Company"}
                </p>
                <p className="text-[10px] text-blue-700 font-semibold">Verified Brand</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-xl transition-colors min-h-[36px]"
              title="Sign Out of Company Portal"
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
          {/* Company ID Card */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/60 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white font-bold text-base flex items-center justify-center shrink-0">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || "B"
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-stone-900 truncate">{user?.name}</h4>
                <p className="text-xs text-stone-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 text-[11px]">
              <span className="text-stone-500">Business Status:</span>
              <span className="font-bold text-blue-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-700" />
                Verified Seller
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
                            isActive ? "text-blue-400" : "text-stone-400"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Escrow Settlement Badge */}
          <div className="bg-stone-100/70 border border-stone-200 rounded-2xl p-3 text-[11px] text-stone-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-900">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>5% Fixed Platform Fee</span>
            </div>
            <p className="text-[10px] text-stone-500 leading-snug">
              Earnings released directly upon buyer delivery confirmation.
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
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                    Company Portal
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

              {/* Mobile Company Summary */}
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-stone-900 text-white font-bold flex items-center justify-center">
                  {user?.name?.charAt(0).toUpperCase() || "B"}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 truncate">{user?.name}</h4>
                  <p className="text-[10px] text-stone-500 truncate">{user?.email}</p>
                </div>
              </div>

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
                                isActive ? "text-blue-400" : "text-stone-400"
                              }`}
                            />
                            <span>{item.name}</span>
                          </div>
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
