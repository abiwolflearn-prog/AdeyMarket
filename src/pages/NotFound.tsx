import { Link } from "react-router-dom";
import { ArrowLeft, Home, Store, Compass, Search, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Visual Badge / Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-stone-100 text-stone-800 shadow-xs border border-stone-200">
          <span className="text-3xl font-black tracking-tight text-[#2E7D32]">404</span>
        </div>

        {/* Heading & Context */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Page Not Found
          </h1>
          <p className="text-base text-gray-600 max-w-md mx-auto leading-relaxed">
            The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            id="not-found-home-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2E7D32] hover:bg-green-800 text-white font-medium text-sm px-6 py-3 rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E7D32]"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home Feed</span>
          </Link>

          <Link
            to="/directory"
            id="not-found-directory-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-medium text-sm px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            <Store className="w-4 h-4 text-blue-600" />
            <span>Explore Brands & Stores</span>
          </Link>
        </div>

        {/* Helpful Shortcut Chips */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Popular Destinations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/posts"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Creator Looks</span>
            </Link>
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-orange-600" />
              <span>Active Campaigns</span>
            </Link>
            <Link
              to="/bag"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black transition-colors"
            >
              <span>Shopping Bag</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
