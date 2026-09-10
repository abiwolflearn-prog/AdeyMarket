import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck } from "lucide-react";

export default function Cart() {
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, totalCount } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-stone-400" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900 mb-3">Your Bag is Empty</h1>
        <p className="text-stone-500 max-w-md mx-auto mb-8">
          Looks like you haven't added anything to your bag yet. Explore top products from Ethiopian creators and brands.
        </p>
        <Link
          to="/directory"
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-8 py-3.5 rounded-full font-medium transition-colors"
        >
          Explore Storefronts <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-8 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Your Shopping Bag</h1>
          <p className="text-stone-500 mt-1">
            {totalCount} {totalCount === 1 ? "item" : "items"} selected
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-stone-500 hover:text-red-600 transition-colors self-start sm:self-auto"
        >
          Clear Bag
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Left: Cart Items */}
        <div className="lg:col-span-8 space-y-6">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm flex flex-col sm:flex-row gap-6 items-center sm:items-start"
            >
              {/* Product Image */}
              <div className="w-28 h-28 shrink-0 bg-stone-100 rounded-2xl overflow-hidden border border-stone-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-stone-300" />
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="flex-1 text-center sm:text-left">
                <Link
                  to={`/product/${item.productId}`}
                  className="font-semibold text-lg text-stone-900 hover:underline line-clamp-1"
                >
                  {item.name}
                </Link>
                <p className="text-stone-900 font-bold mt-1 text-base">
                  ETB {item.price.toLocaleString()}
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                  <div className="flex items-center border border-stone-200 rounded-full bg-stone-50/50 p-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white text-stone-600 transition-colors"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-medium text-sm text-stone-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white text-stone-600 transition-colors"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Item Subtotal */}
              <div className="text-right sm:self-center font-bold text-lg text-stone-900">
                ETB {(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}

          {/* Value Props */}
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-center gap-3">
              <Truck className="w-5 h-5 text-stone-700" />
              <div className="text-xs text-stone-600">
                <span className="font-semibold text-stone-900 block">Fast Local Delivery</span>
                Delivered direct to your doorstep across Addis Ababa.
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-stone-700" />
              <div className="text-xs text-stone-600">
                <span className="font-semibold text-stone-900 block">Verified Creators & Brands</span>
                Guaranteed genuine and authentic merchandise.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm sticky top-28">
            <h2 className="text-xl font-bold text-stone-900 mb-6">Order Summary</h2>

            <div className="space-y-4 text-sm pb-6 border-b border-stone-100">
              <div className="flex justify-between text-stone-600">
                <span>Items subtotal</span>
                <span className="font-medium text-stone-900">ETB {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Estimated Delivery</span>
                <span className="text-green-700 font-medium">Free (Addis Ababa)</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline py-6 border-b border-stone-100">
              <span className="text-base font-bold text-stone-900">Total</span>
              <div className="text-right">
                <span className="text-2xl font-black text-stone-900">
                  ETB {subtotal.toLocaleString()}
                </span>
                <span className="block text-xs text-stone-400 mt-0.5">Includes VAT where applicable</span>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <button
                onClick={() => navigate("/checkout")}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/directory"
                className="block text-center text-sm font-medium text-stone-600 hover:text-stone-900 hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
