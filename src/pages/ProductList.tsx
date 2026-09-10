import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Loader2, Plus, Package, ExternalLink, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface IProduct {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
}

export default function ProductList() {
  const { user } = useAuth();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      if (!user) return;
      const { data } = await api.get(`/products?sellerId=${user._id}`);
      setProducts(data);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      toast.success("Product deleted");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-stone-700" /> My Products
          </h1>
          <p className="text-sm text-stone-500 mt-1">Manage your catalog and inventory.</p>
        </div>
        <Link
          to="/products/new"
          className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-100 rounded-3xl shadow-sm">
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-stone-900">No products yet</h3>
          <p className="text-stone-500 mt-1 max-w-sm mx-auto mb-6">
            Get started by adding your first product to your storefront.
          </p>
          <Link
            to="/products/new"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl font-medium"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
              {/* Product Image */}
              <div className="aspect-square bg-stone-100 relative overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-10 h-10 text-stone-300" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full shadow-sm backdrop-blur-md ${product.stock > 0 ? 'bg-white/90 text-stone-900' : 'bg-red-50/90 text-red-600 border border-red-100'}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex-1">
                  <p className="text-xs font-medium text-stone-500 mb-1">{product.category}</p>
                  <h3 className="font-semibold text-stone-900 text-lg leading-tight mb-2 line-clamp-2">{product.name}</h3>
                  <p className="font-bold text-stone-900">ETB {product.price.toLocaleString()}</p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-100">
                  <Link
                    to={`/products/${product._id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium rounded-xl transition-colors text-sm"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </Link>
                  <button
                    onClick={() => deleteProduct(product._id)}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
