/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
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
            <Route element={<Layout />}>
              <Route path="/" element={<Feed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/user/:id" element={<PublicProfile />} />
              
              {/* Public Shop, Product & Cart Routes */}
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
              
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/analytics" element={<CreatorAnalytics />} />
                <Route path="/profile" element={<ProfileEdit />} />

                <Route path="/shop-settings" element={<ShopSettings />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/new" element={<ProductCreate />} />
                <Route path="/products/:id/edit" element={<ProductEdit />} />
                <Route path="/campaigns/new" element={<CampaignCreate />} />
                <Route path="/orders" element={<SellerOrders />} />
                <Route path="/seller/orders" element={<SellerOrders />} />
                <Route path="/payouts" element={<Payouts />} />
                <Route path="/transactions" element={<Payouts />} />
              </Route>

              {/* 404 Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
