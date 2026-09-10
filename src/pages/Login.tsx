import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Eye, 
  EyeOff, 
  Sparkles, 
  Building2, 
  ShoppingBag, 
  User as UserIcon, 
  KeyRound, 
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot / Reset Password state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { login, resetPassword, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await login({ email: email.trim(), password });
      toast.success("Logged in successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Invalid email or password. Check your credentials or use the quick demo accounts below.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await resetPassword({ email: resetEmail.trim(), newPassword });
      setResetSuccess(true);
      toast.success("Password reset successfully! Logged in.");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to reset password. Please verify your email.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    try {
      await login({ email: demoEmail, password: demoPass });
      toast.success(`Logged in as ${demoEmail}!`);
      navigate("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || "Demo login failed.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-8">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-3xl shadow-sm border border-stone-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            {isResetMode ? "Reset Password" : "Welcome back"}
          </h1>
          <p className="text-sm text-stone-500 mt-2">
            {isResetMode
              ? "Set a new password for your account to regain access."
              : "Enter your details to access your account or use quick demo login."}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
              <p className="mt-1 text-red-600">
                You can reset your password below or tap any demo account for instant access.
              </p>
            </div>
          </div>
        )}

        {resetSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
            Password updated successfully. Redirecting to dashboard...
          </div>
        )}

        {!isResetMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-stone-700" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setResetEmail(email);
                    setErrorMessage(null);
                  }}
                  className="text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700" htmlFor="resetEmail">
                Your Registered Email
              </label>
              <input
                id="resetEmail"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700" htmlFor="newPassword">
                New Password (minimum 6 characters)
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors text-sm"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setErrorMessage(null);
                }}
                className="flex-1 py-2.5 px-4 border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Back to Sign in
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Resetting..." : "Save & Sign in"}
              </button>
            </div>
          </form>
        )}

        {/* 1-Click Quick Demo Accounts */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-stone-400" />
              1-Click Demo Accounts
            </span>
            <span className="text-[11px] text-stone-400">Password: Password123!</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("creator@ethioinfluence.com", "Password123!")}
              className="flex items-center gap-2 p-2.5 text-left border border-stone-200 rounded-xl hover:border-stone-900 hover:bg-stone-50 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-800 group-hover:text-stone-950 truncate">Creator</p>
                <p className="text-[10px] text-stone-400 truncate">Selamawit</p>
              </div>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("brand@ethioinfluence.com", "Password123!")}
              className="flex items-center gap-2 p-2.5 text-left border border-stone-200 rounded-xl hover:border-stone-900 hover:bg-stone-50 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-800 group-hover:text-stone-950 truncate">Brand Seller</p>
                <p className="text-[10px] text-stone-400 truncate">Addis Heritage</p>
              </div>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("abelbimrew868@gmail.com", "Password123!")}
              className="flex items-center gap-2 p-2.5 text-left border border-stone-200 rounded-xl hover:border-stone-900 hover:bg-stone-50 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-800 group-hover:text-stone-950 truncate">Abel Bimrew</p>
                <p className="text-[10px] text-stone-400 truncate">Creator Profile</p>
              </div>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("buyer@ethioinfluence.com", "Password123!")}
              className="flex items-center gap-2 p-2.5 text-left border border-stone-200 rounded-xl hover:border-stone-900 hover:bg-stone-50 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-800 group-hover:text-stone-950 truncate">Consumer</p>
                <p className="text-[10px] text-stone-400 truncate">Dawit Abebe</p>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center text-sm pt-2">
          <span className="text-stone-500">Don't have an account? </span>
          <Link to="/register" className="font-medium text-stone-900 underline underline-offset-4 hover:text-stone-700 transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
