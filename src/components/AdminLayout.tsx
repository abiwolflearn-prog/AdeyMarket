import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Building2,
  Sparkles,
  Package,
  CreditCard,
  Sliders,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Activity,
  FileText,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminLayout() {
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
    toast.success("Signed out of Admin Portal");
    navigate("/login");
  };

  const navItems = [
    {
      group: "Oversight",
      items: [
        {
          name: "Admin Dashboard",
          to: "/admin/dashboard",
          icon: ShieldCheck,
          match: (path: string) => path === "/admin" || path === "/admin/dashboard",
        },
      ],
    },
    {
      group: "Ecosystem Management",
      items: [
        {
          name: "Companies & Brands",
          to: "/admin/dashboard?tab=companies",
          icon: Building2,
          match: (path: string, search: string) => path.startsWith("/admin") && search.includes("tab=companies"),
        },
        {
          name: "Creator Accounts",
          to: "/admin/dashboard?tab=creators",
          icon: Sparkles,
          match: (path: string, search: string) => path.startsWith("/admin") && search.includes("tab=creators"),
        },
        {
          name: "Active Campaigns",
          to: "/admin/dashboard?tab=campaigns",
          icon: Flame,
          match: (path: string, search: string) => path.startsWith("/admin") && search.includes("tab=campaigns"),
        },
        {
          name: "Partnership Agreements",
          to: "/admin/dashboard?tab=agreements",
          icon: FileText,
          match: (path: string, search: string) => path.startsWith("/admin") && search.includes("tab=agreements"),
        },
      ],
    },
    {
      group: "Commerce & Escrow",
      items: [
        {
          name: "Orders & Delivery",
          to: "/admin/dashboard?tab=orders",
          icon: Package,
          match: (path: string, search: string) => path.startsWith("/admin") && search.includes("tab=orders"),
        },
        {
          name: "Financial Transactions",
          to: "/admin/dashboard?tab=transactions",
          icon: CreditCard,
          match: (path: string, search: string) => path.startsWith("/admin") && search.includes("tab=transactions"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100/70 flex flex-col font-sans text-stone-900">
      {/* Admin Portal Topbar */}
      <header className="sticky top-0 z-40 bg-stone-900 text-white border-b border-stone-800 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger + Adey Logo + Admin Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-300 hover:bg-stone-800 transition-colors"
              aria-label="Toggle admin menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <span className="font-extrabold text-2xl tracking-tighter text-white">
                Adey<span className="text-[#2E7D32]">.</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-stone-800 text-amber-300 border border-amber-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Admin Portal
              </span>
            </Link>
          </div>

          {/* Center: System Status */}
          <div className="hidden md:flex items-center gap-2 text-xs text-stone-300 bg-stone-800/80 px-3.5 py-1.5 rounded-full border border-stone-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Platform Status: <strong className="text-white">Active & Healthy</strong></span>
            <span className="text-stone-500">|</span>
            <span>Arifpay Gateway: <strong className="text-emerald-400">Online</strong></span>
          </div>

          {/* Right: Admin user pill + Sign Out */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5 py-1 px-3 bg-stone-800 border border-stone-700 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center">
                A
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                  {user?.name || "System Admin"}
                </p>
                <p className="text-[10px] text-amber-400 font-semibold">Super Admin</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-300 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 rounded-xl transition-colors min-h-[36px]"
              title="Sign Out of Admin Portal"
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
        <aside className="hidden lg:flex flex-col w-64 border-r border-stone-200 bg-white shrink-0 p-4 space-y-6 min-h-[calc(100vh-4rem)]">
          {/* Admin Identity Card */}
          <div className="bg-stone-900 text-white rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 font-black text-base flex items-center justify-center shrink-0">
                A
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold truncate text-white">{user?.name || "Platform Admin"}</h4>
                <p className="text-xs text-stone-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-[11px]">
              <span className="text-stone-400">Security Clearance:</span>
              <span className="font-bold text-amber-400">Root / Admin</span>
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
                  const isActive = item.match(location.pathname, location.search);
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
                            isActive ? "text-amber-400" : "text-stone-400"
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

          {/* Platform Integrity Badge */}
          <div className="bg-stone-100 border border-stone-200 rounded-2xl p-3 text-[11px] text-stone-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-900">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Audit Trail Enabled</span>
            </div>
            <p className="text-[10px] text-stone-500 leading-snug">
              Every payout, commission split, and escrow release is cryptographically signed.
            </p>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div
              ref={drawerRef}
              className="relative ml-0 flex flex-col w-4/5 max-w-xs bg-stone-900 text-white h-full shadow-2xl p-5 space-y-6 z-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tighter text-white">
                    Adey<span className="text-[#2E7D32]">.</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-800 text-amber-300 border border-amber-400/30">
                    Admin
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Admin Summary */}
              <div className="bg-stone-800 rounded-xl p-3 border border-stone-700 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-400 text-stone-950 font-black flex items-center justify-center">
                  A
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{user?.name || "Admin"}</h4>
                  <p className="text-[10px] text-stone-400 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Nav links in Mobile */}
              <nav className="space-y-4 flex-1">
                {navItems.map((group) => (
                  <div key={group.group} className="space-y-1">
                    <p className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                      {group.group}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.match(location.pathname, location.search);
                      return (
                        <Link
                          key={item.name}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-stone-800 text-amber-300 font-bold border border-amber-400/30"
                              : "text-stone-300 hover:text-white hover:bg-stone-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`w-4 h-4 ${
                                isActive ? "text-amber-400" : "text-stone-400"
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

              <div className="pt-4 border-t border-stone-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-950/80 text-red-300 hover:bg-red-900 font-bold rounded-xl text-xs transition-colors"
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
