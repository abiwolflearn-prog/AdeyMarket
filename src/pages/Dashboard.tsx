import React from "react";
import { useAuth } from "../context/AuthContext";
import CreatorDashboard from "./CreatorDashboard";
import BrandDashboard from "./BrandDashboard";
import BuyerDashboard from "./BuyerDashboard";
import AdminDashboard from "./AdminDashboard";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  if (user.role === "creator") {
    return <CreatorDashboard />;
  }

  if (user.role === "brand") {
    return <BrandDashboard />;
  }

  // Buyer (consumer) portal view
  return <BuyerDashboard />;
}

