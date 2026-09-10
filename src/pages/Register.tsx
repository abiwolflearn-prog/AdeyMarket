import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Sparkles, Building2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("consumer");
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ name, email, password, role });
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(message);
    }
  };

  const roleOptions = [
    { id: "consumer", label: "Consumer", icon: User },
    { id: "creator", label: "Creator", icon: Sparkles },
    { id: "brand", label: "Brand", icon: Building2 },
  ];

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-3xl shadow-sm border border-stone-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Create an account</h1>
          <p className="text-sm text-stone-500 mt-2">Join us to start exploring campaigns and creators.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-700" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-700" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
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

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-stone-700">I am a...</label>
            <div className="grid grid-cols-3 gap-3 mt-1">
              {roleOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRole(option.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 text-sm font-medium rounded-2xl border transition-all ${
                    role === option.id
                      ? "bg-stone-900 border-stone-900 text-white shadow-md shadow-stone-900/10"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
                  }`}
                >
                  <option.icon className={`w-5 h-5 ${role === option.id ? "text-white" : "text-stone-400"}`} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-8"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="text-center text-sm pt-2">
          <span className="text-stone-500">Already have an account? </span>
          <Link to="/login" className="font-medium text-stone-900 underline underline-offset-4 hover:text-stone-700 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
