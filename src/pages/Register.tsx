import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ShoppingBag, Sparkles, Building2, Eye, EyeOff, Building, MapPin, Phone, Hash, Globe, Tag, AtSign, Send } from "lucide-react";
import { useAuth, Role } from "../context/AuthContext";
import { USER_ROLE_OPTIONS } from "../utils/roleUtils";
import { CREATOR_NICHES } from "./ProfileEdit";

export const BUSINESS_CATEGORIES = [
  "Fashion & Apparel",
  "Leather Goods & Shoes",
  "Coffee & Agro-Products",
  "Traditional Crafts & Art",
  "Beauty, Cosmetics & Wellness",
  "Jewelry & Accessories",
  "Tech & Electronics",
  "Home & Living",
  "Food & Beverage",
  "Other",
];

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("consumer");

  // Creator specific fields
  const [creatorUsername, setCreatorUsername] = useState("");
  const [creatorPhone, setCreatorPhone] = useState("");
  const [creatorCity, setCreatorCity] = useState("");
  const [creatorNiche, setCreatorNiche] = useState("");
  const [creatorBio, setCreatorBio] = useState("");
  const [creatorTiktok, setCreatorTiktok] = useState("");
  const [creatorInstagram, setCreatorInstagram] = useState("");
  const [creatorTelegram, setCreatorTelegram] = useState("");

  // Company specific fields
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [taxId, setTaxId] = useState("");
  const [website, setWebsite] = useState("");

  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (role === "brand") {
        await register({
          name,
          email,
          password,
          role,
          companyName: companyName.trim() || name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim(),
          businessCategory: businessCategory.trim(),
          taxId: taxId.trim(),
          website: website.trim(),
        });
      } else if (role === "creator") {
        await register({
          name,
          email,
          password,
          role,
          username: creatorUsername.trim().toLowerCase().replace(/^@/, ""),
          displayName: name.trim(),
          phone: creatorPhone.trim(),
          city: creatorCity.trim(),
          niche: creatorNiche.trim(),
          bio: creatorBio.trim(),
          tiktok: creatorTiktok.trim(),
          instagram: creatorInstagram.trim(),
          telegram: creatorTelegram.trim(),
        });
      } else {
        await register({ name, email, password, role });
      }
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(message);
    }
  };

  const getRoleIcon = (roleId: Role) => {
    switch (roleId) {
      case "creator":
        return Sparkles;
      case "brand":
        return Building2;
      case "consumer":
      default:
        return ShoppingBag;
    }
  };

  const isCompany = role === "brand";
  const isCreator = role === "creator";

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-12">
      <div className={`w-full ${isCompany || isCreator ? "max-w-xl" : "max-w-md"} p-8 space-y-6 bg-white rounded-3xl shadow-sm border border-stone-100 transition-all duration-300`}>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            {isCompany ? "Register Your Company" : isCreator ? "Join as a Creator" : "Create an account"}
          </h1>
          <p className="text-sm text-stone-500 mt-2">
            {isCompany
              ? "Join EthioInfluence to launch campaigns, manage your storefront, and partner with top creators."
              : isCreator
              ? "Monetize your influence, partner with local companies, and build your digital storefront."
              : "Join EthioInfluence to explore campaigns, products, and creator deals."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">I am joining as a...</label>
            <div className="grid grid-cols-3 gap-3 mt-1">
              {USER_ROLE_OPTIONS.map((option) => {
                const IconComponent = getRoleIcon(option.id);
                const isSelected = role === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRole(option.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 text-sm font-medium rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-stone-900 border-stone-900 text-white shadow-md shadow-stone-900/10"
                        : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${isSelected ? "text-white" : "text-stone-400"}`} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Credentials / Details */}
          <div className="space-y-4 pt-2">
            {isCompany ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="companyName">
                      Company / Business Name <span className="text-stone-400 text-xs">*</span>
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="companyName"
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                        placeholder="Addis Artisan Goods"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="name">
                      Representative Name <span className="text-stone-400 text-xs">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      placeholder="Abebe Kebede"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="email">
                      Business Email <span className="text-stone-400 text-xs">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      placeholder="contact@addisartisan.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="phone">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                        placeholder="+251 91 123 4567"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700" htmlFor="password">
                    Password <span className="text-stone-400 text-xs">*</span>
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
                      placeholder="•••••••• (min. 6 characters)"
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

                <div className="grid sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="businessCategory">
                      Business Category
                    </label>
                    <div className="relative">
                      <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      <select
                        id="businessCategory"
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm bg-white transition-colors"
                      >
                        <option value="">Select a category</option>
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="taxId">
                      TIN / Registration No.
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="taxId"
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                        placeholder="e.g. 0012345678"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="city">
                      City / Region
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                        placeholder="Addis Ababa"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="address">
                      Physical Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      placeholder="Bole, House #204"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700" htmlFor="website">
                    Website / Link
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      placeholder="https://addisartisan.com"
                    />
                  </div>
                </div>
              </>
            ) : isCreator ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="name">
                      Display / Full Name <span className="text-stone-400 text-xs">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      placeholder="e.g. Abel Bimrew"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="creatorUsername">
                      Username / Handle
                    </label>
                    <div className="relative">
                      <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="creatorUsername"
                        type="text"
                        value={creatorUsername}
                        onChange={(e) => setCreatorUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                        placeholder="abel_creates"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="email">
                      Email Address <span className="text-stone-400 text-xs">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      placeholder="abel@example.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="creatorPhone">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="creatorPhone"
                        type="tel"
                        value={creatorPhone}
                        onChange={(e) => setCreatorPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                        placeholder="+251 91 123 4567"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700" htmlFor="password">
                    Password <span className="text-stone-400 text-xs">*</span>
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
                      placeholder="•••••••• (min. 6 characters)"
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

                <div className="grid sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="creatorNiche">
                      Content Niche / Category
                    </label>
                    <div className="relative">
                      <Sparkles className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      <select
                        id="creatorNiche"
                        value={creatorNiche}
                        onChange={(e) => setCreatorNiche(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm bg-white transition-colors"
                      >
                        <option value="">Select your content niche</option>
                        {CREATOR_NICHES.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700" htmlFor="creatorCity">
                      City / Location
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="creatorCity"
                        type="text"
                        value={creatorCity}
                        onChange={(e) => setCreatorCity(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                        placeholder="Addis Ababa"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Social Handles */}
                <div className="grid sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-600">TikTok Handle</label>
                    <input
                      type="text"
                      value={creatorTiktok}
                      onChange={(e) => setCreatorTiktok(e.target.value)}
                      placeholder="@username"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-600">Instagram Handle</label>
                    <input
                      type="text"
                      value={creatorInstagram}
                      onChange={(e) => setCreatorInstagram(e.target.value)}
                      placeholder="@username"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-600">Telegram</label>
                    <div className="relative">
                      <Send className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-500" />
                      <input
                        type="text"
                        value={creatorTelegram}
                        onChange={(e) => setCreatorTelegram(e.target.value)}
                        placeholder="@channel"
                        className="w-full pl-7 pr-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-8"
          >
            {isLoading ? "Creating account..." : isCompany ? "Register Company" : isCreator ? "Join as Creator" : "Create account"}
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
