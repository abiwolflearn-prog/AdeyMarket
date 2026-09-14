import React from "react";
import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth, Role } from "../context/AuthContext";
import { getRoleHomeRoute, getRoleDisplayName } from "../utils/roleUtils";
import { ShieldAlert, ArrowRight } from "lucide-react";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  denyMode?: "redirect" | "screen";
}

export default function ProtectedRoute({ allowedRoles, denyMode = "redirect" }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const designatedHome = getRoleHomeRoute(user.role);

    // If denyMode is explicitly set to screen, show the 403 denied screen
    if (denyMode === "screen") {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-sm text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                403 Access Denied
              </span>
              <h1 className="text-xl font-bold text-stone-900">
                Unauthorized Portal
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed">
                Your account is logged in as a <span className="font-semibold text-stone-900">{getRoleDisplayName(user.role)}</span> and does not have access to this portal.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to={designatedHome}
                replace
                className="inline-flex items-center justify-center gap-2 w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 px-5 rounded-xl transition-colors text-sm"
              >
                <span>Return to {getRoleDisplayName(user.role)} Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Default: automatically redirect unauthorized attempts to the user's designated portal
    return <Navigate to={designatedHome} replace />;
  }

  return <Outlet />;
}

