/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import PublicLayout from "./components/PublicLayout";
import CreatorLayout from "./components/CreatorLayout";
import CompanyLayout from "./components/CompanyLayout";
import CustomerLayout from "./components/CustomerLayout";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import BrandDashboard from "./pages/BrandDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProfileEdit from "./pages/ProfileEdit";
import ShopSettings from "./pages/ShopSettings";
import PublicProfile from "./pages/PublicProfile";
import Campaigns from "./pages/Campaigns";
import Posts from "./pages/Posts";
import ProductList from "./pages/ProductList";
import ProductCreate from "./pages/ProductCreate";
import ProductEdit from "./pages/ProductEdit";
import PublicShop from "./pages/PublicShop";
import PublicProduct from "./pages/PublicProduct";
import BrandDirectory from "./pages/BrandDirectory";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import SellerOrders from "./pages/SellerOrders";
import Payouts from "./pages/Payouts";
import ArifpaySimulation from "./pages/ArifpaySimulation";
import CampaignCreate from "./pages/CampaignCreate";
import CreatorAnalytics from "./pages/CreatorAnalytics";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* ========================================================================= */}
            {/* 1. PUBLIC ADEY WEBSITE (Public Header + Public Footer)                     */}
            {/* ========================================================================= */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Feed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/user/:id" element={<PublicProfile />} />

              {/* Public Marketplace, Products, Campaigns, Posts & Checkout */}
              <Route path="/directory" element={<BrandDirectory />} />
              <Route path="/shop/:slug" element={<PublicShop />} />
              <Route path="/product/:id" element={<PublicProduct />} />
              <Route path="/products/:id" element={<PublicProduct />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/posts" element={<Posts />} />
              <Route path="/bag" element={<Cart />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/arifpay-sim" element={<ArifpaySimulation />} />
              <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />

              {/* Smart Redirect Hubs */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/analytics" element={<Dashboard />} />
              <Route path="/profile" element={<ProfileEdit />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/shop-settings" element={<ShopSettings />} />
              <Route path="/orders" element={<Dashboard />} />
              <Route path="/seller/orders" element={<Dashboard />} />
              <Route path="/payouts" element={<Dashboard />} />
              <Route path="/transactions" element={<Dashboard />} />

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* ========================================================================= */}
            {/* 2. CREATOR PORTAL (Dedicated Creator Layout & Sidebar — NO Public Header/Footer) */}
            {/* ========================================================================= */}
            <Route element={<ProtectedRoute allowedRoles={["creator"]} />}>
              <Route element={<CreatorLayout />}>
                <Route path="/creator" element={<CreatorDashboard />} />
                <Route path="/creator/dashboard" element={<CreatorDashboard />} />
                <Route path="/creator/campaigns" element={<Campaigns />} />
                <Route path="/creator/partnerships" element={<CreatorDashboard />} />
                <Route path="/creator/products" element={<Feed />} />
                <Route path="/creator/promotions" element={<CreatorDashboard />} />
                <Route path="/creator/payouts" element={<Payouts />} />
                <Route path="/creator/analytics" element={<CreatorAnalytics />} />
                <Route path="/creator/profile" element={<ProfileEdit />} />
                <Route path="/creator/settings" element={<ProfileEdit />} />
              </Route>
            </Route>

            {/* ========================================================================= */}
            {/* 3. COMPANY / BRAND PORTAL (Dedicated Company Layout & Sidebar — NO Public Header/Footer) */}
            {/* ========================================================================= */}
            <Route element={<ProtectedRoute allowedRoles={["brand"]} />}>
              <Route element={<CompanyLayout />}>
                <Route path="/company" element={<BrandDashboard />} />
                <Route path="/company/dashboard" element={<BrandDashboard />} />
                <Route path="/company/brand" element={<ShopSettings />} />
                <Route path="/company/settings" element={<ShopSettings />} />
                <Route path="/company/products" element={<ProductList />} />
                <Route path="/company/products/new" element={<ProductCreate />} />
                <Route path="/company/products/:id/edit" element={<ProductEdit />} />
                <Route path="/company/campaigns" element={<BrandDashboard />} />
                <Route path="/company/campaigns/new" element={<CampaignCreate />} />
                <Route path="/company/creators" element={<BrandDashboard />} />
                <Route path="/company/orders" element={<SellerOrders />} />
                <Route path="/company/analytics" element={<BrandDashboard />} />
                <Route path="/company/payouts" element={<Payouts />} />
                <Route path="/company/earnings" element={<Payouts />} />
                <Route path="/company/profile" element={<ProfileEdit />} />
              </Route>
            </Route>

            {/* ========================================================================= */}
            {/* 4. CUSTOMER PORTAL (Dedicated Customer Layout & Sidebar — NO Public Header/Footer) */}
            {/* ========================================================================= */}
            <Route element={<ProtectedRoute allowedRoles={["consumer"]} />}>
              <Route element={<CustomerLayout />}>
                <Route path="/customer" element={<BuyerDashboard />} />
                <Route path="/customer/dashboard" element={<BuyerDashboard />} />
                <Route path="/customer/orders" element={<BuyerDashboard />} />
                <Route path="/customer/discover" element={<BuyerDashboard />} />
                <Route path="/customer/promos" element={<BuyerDashboard />} />
                <Route path="/customer/cart" element={<Cart />} />
                <Route path="/customer/wishlist" element={<BuyerDashboard />} />
                <Route path="/customer/profile" element={<ProfileEdit />} />
                <Route path="/customer/settings" element={<ProfileEdit />} />
                <Route path="/shop" element={<BuyerDashboard />} />
              </Route>
            </Route>

            {/* ========================================================================= */}
            {/* 5. ADMIN PORTAL (Dedicated Admin Layout & Sidebar — NO Public Header/Footer) */}
            {/* ========================================================================= */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminDashboard />} />
                <Route path="/admin/companies" element={<AdminDashboard />} />
                <Route path="/admin/creators" element={<AdminDashboard />} />
                <Route path="/admin/campaigns" element={<AdminDashboard />} />
                <Route path="/admin/agreements" element={<AdminDashboard />} />
                <Route path="/admin/orders" element={<AdminDashboard />} />
                <Route path="/admin/transactions" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
