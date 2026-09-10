import React from "react";
import { useAuth } from "../context/AuthContext";
import CreatorDashboard from "./CreatorDashboard";
import BrandDashboard from "./BrandDashboard";
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

  if (user.role === "creator") {
    return <CreatorDashboard />;
  }

  if (user.role === "brand") {
    return <BrandDashboard />;
  }

  // Fallback for consumer role (if they somehow get here, though they shouldn't have a dashboard in MVP)
  return (
    <div className="flex justify-center items-center h-[50vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Welcome, {user.name}!</h2>
        <p className="text-stone-500">You are logged in as a Consumer. Start browsing shops to discover products!</p>
      </div>
    </div>
  );
}
