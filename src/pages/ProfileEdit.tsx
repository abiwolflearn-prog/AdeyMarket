import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { 
  Loader2, 
  Save, 
  Building2, 
  MapPin, 
  Phone, 
  Hash, 
  Globe, 
  Tag, 
  AtSign, 
  Sparkles, 
  Users, 
  FileText, 
  Wallet, 
  Smartphone, 
  CreditCard,
  Instagram,
  Youtube,
  Twitter,
  Send,
  ExternalLink
} from "lucide-react";
import { AvatarUpload } from "../components/AvatarUpload";
import { BUSINESS_CATEGORIES } from "./Register";

export const CREATOR_NICHES = [
  "Fashion & Style",
  "Tech & Gadgets",
  "Beauty & Skincare",
  "Lifestyle & Vlogging",
  "Comedy & Entertainment",
  "Food & Dining",
  "Travel & Tourism",
  "Fitness & Wellness",
  "Business & Finance",
  "Traditional Culture & Art",
  "Music & Dance",
  "Education & Tech Skills",
  "Gaming",
  "Other",
];

export const ETHIOPIAN_BANKS = [
  "Commercial Bank of Ethiopia (CBE)",
  "Awash International Bank",
  "Bank of Abyssinia",
  "Dashen Bank",
  "Cooperative Bank of Oromia",
  "Hibret Bank",
  "Nib International Bank",
  "Wegagen Bank",
  "Zemen Bank",
  "Oromia International Bank",
  "Amhara Bank",
];

export default function ProfileEdit() {
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Base user fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePic, setProfilePic] = useState("");
  
  // Creator specific fields
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [creatorCity, setCreatorCity] = useState("");
  const [niche, setNiche] = useState("");
  const [followerCount, setFollowerCount] = useState<number | "">("");
  const [creatorSocialLinks, setCreatorSocialLinks] = useState({
    tiktok: "",
    instagram: "",
    youtube: "",
    telegram: "",
    twitter: "",
  });
  const [creatorPayoutInfo, setCreatorPayoutInfo] = useState({
    preferredMethod: "telebirr" as "telebirr" | "bank_transfer" | "",
    phoneNumber: "",
    bankName: "Commercial Bank of Ethiopia (CBE)",
    accountNumber: "",
    accountHolderName: "",
  });
  
  // Company / Brand specific fields
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [taxId, setTaxId] = useState("");
  const [website, setWebsite] = useState("");
  const [companySocialLinks, setCompanySocialLinks] = useState({
    linkedin: "",
    instagram: "",
    twitter: "",
    facebook: "",
    telegram: "",
  });

  useEffect(() => {
    if (user?._id) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/profile/${user?._id}`);
      
      setName(data.name || "");
      setPhone(data.phone || data.profile?.phone || "");
      setProfilePic(data.profilePic || "");
      
      if (data.role === "creator" && data.profile) {
        setUsername(data.profile.username || "");
        setBio(data.profile.bio || "");
        setCreatorCity(data.profile.city || "");
        setNiche(data.profile.niche || "");
        setFollowerCount(data.profile.followerCount || "");
        setCreatorSocialLinks({
          tiktok: data.profile.socialLinks?.tiktok || "",
          instagram: data.profile.socialLinks?.instagram || "",
          youtube: data.profile.socialLinks?.youtube || "",
          telegram: data.profile.socialLinks?.telegram || "",
          twitter: data.profile.socialLinks?.twitter || "",
        });
        if (data.profile.payoutInfo) {
          setCreatorPayoutInfo({
            preferredMethod: data.profile.payoutInfo.preferredMethod || "telebirr",
            phoneNumber: data.profile.payoutInfo.phoneNumber || data.phone || "",
            bankName: data.profile.payoutInfo.bankName || "Commercial Bank of Ethiopia (CBE)",
            accountNumber: data.profile.payoutInfo.accountNumber || "",
            accountHolderName: data.profile.payoutInfo.accountHolderName || data.name || "",
          });
        }
      } else if (data.role === "brand" && data.profile) {
        setCompanyName(data.profile.companyName || "");
        setCity(data.profile.city || "");
        setAddress(data.profile.address || "");
        setBusinessCategory(data.profile.businessCategory || "");
        setTaxId(data.profile.taxId || "");
        setWebsite(data.profile.website || "");
        setCompanySocialLinks({
          linkedin: data.profile.socialLinks?.linkedin || "",
          instagram: data.profile.socialLinks?.instagram || "",
          twitter: data.profile.socialLinks?.twitter || "",
          facebook: data.profile.socialLinks?.facebook || "",
          telegram: data.profile.socialLinks?.telegram || "",
        });
      }
    } catch (error: any) {
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const payload: any = { 
        name, 
        phone,
      };
      
      if (user?.role === "creator") {
        payload.username = username.trim().toLowerCase().replace(/^@/, "");
        payload.displayName = name.trim();
        payload.bio = bio.trim();
        payload.city = creatorCity.trim();
        payload.niche = niche.trim();
        payload.followerCount = followerCount === "" ? 0 : Number(followerCount);
        payload.socialLinks = creatorSocialLinks;
        payload.payoutInfo = creatorPayoutInfo;
      } else if (user?.role === "brand") {
        payload.companyName = companyName;
        payload.phone = phone;
        payload.city = city;
        payload.address = address;
        payload.businessCategory = businessCategory;
        payload.taxId = taxId;
        payload.website = website;
        payload.socialLinks = companySocialLinks;
      }

      await api.put("/profile", payload);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !name) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  const isCompany = user?.role === "brand";
  const isCreator = user?.role === "creator";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-900">
            {isCompany ? "Company Profile & Details" : isCreator ? "Creator Profile & Settings" : "Edit Profile"}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {isCompany
              ? "Manage your company information, contact details, business credentials, and online presence."
              : isCreator
              ? "Customize your public creator identity, social platforms, content niche, and preferred payout channels."
              : "Update your personal and account details."}
          </p>
        </div>

        {/* Avatar / Logo Upload */}
        <div className="mb-10 pb-10 border-b border-stone-100">
          <AvatarUpload
            currentAvatar={profilePic}
            onUploadSuccess={(newAvatarUrl) => setProfilePic(newAvatarUrl)}
            title={isCompany ? "Company Logo" : isCreator ? "Creator Profile Photo" : "Profile Picture"}
            subtitle={isCompany ? "High-res square or rounded company logo (5MB max)" : "High quality portrait or avatar. 5MB max."}
            buttonText={isCompany ? "Change Company Logo" : "Change photo"}
            shape={isCompany ? "rounded" : "circle"}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6">
            {/* Identity & Basic Info */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">
                  {isCompany ? "Representative / Contact Name" : "Display Name"} <span className="text-stone-400 text-xs">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isCompany ? "e.g. Abebe Kebede" : "e.g. Abel Bimrew"}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors text-sm"
                />
              </div>

              {isCreator ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700">
                    Username / Handle
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="abel_creates"
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+251 91 123 4567"
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Creator Specific Section */}
            {isCreator && (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+251 91 123 4567"
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">City / Location</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={creatorCity}
                        onChange={(e) => setCreatorCity(e.target.value)}
                        placeholder="e.g. Addis Ababa"
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">Content Niche / Category</label>
                    <div className="relative">
                      <Sparkles className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      <select
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm bg-white transition-colors"
                      >
                        <option value="">Select your main niche</option>
                        {CREATOR_NICHES.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">Total Followers (All Platforms)</label>
                    <div className="relative">
                      <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="number"
                        min="0"
                        value={followerCount}
                        onChange={(e) => setFollowerCount(e.target.value ? Number(e.target.value) : "")}
                        placeholder="e.g. 25000"
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700">Bio / About You</label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell brands and followers about yourself, content style, and creative vision..."
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors text-sm"
                    />
                  </div>
                </div>

                {/* Social Platforms */}
                <div className="pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-stone-500" />
                    <h3 className="font-semibold text-stone-900">Social Channels & Portfolios</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400" /> TikTok
                      </label>
                      <input
                        type="text"
                        value={creatorSocialLinks.tiktok}
                        onChange={(e) => setCreatorSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                        placeholder="https://tiktok.com/@username or @handle"
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram
                      </label>
                      <input
                        type="text"
                        value={creatorSocialLinks.instagram}
                        onChange={(e) => setCreatorSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="https://instagram.com/username or @handle"
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube
                      </label>
                      <input
                        type="text"
                        value={creatorSocialLinks.youtube}
                        onChange={(e) => setCreatorSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
                        placeholder="https://youtube.com/@channel"
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-sky-500" /> Telegram Channel / Contact
                      </label>
                      <input
                        type="text"
                        value={creatorSocialLinks.telegram}
                        onChange={(e) => setCreatorSocialLinks(prev => ({ ...prev, telegram: e.target.value }))}
                        placeholder="https://t.me/channel or @username"
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                        <Twitter className="w-3.5 h-3.5 text-stone-700" /> X (Twitter)
                      </label>
                      <input
                        type="text"
                        value={creatorSocialLinks.twitter}
                        onChange={(e) => setCreatorSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                        placeholder="https://x.com/username or @handle"
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferred Payout Method */}
                <div className="pt-4 border-t border-stone-100 bg-stone-50/70 p-6 rounded-2xl border">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-stone-700" />
                    <h3 className="font-semibold text-stone-900">Default Payout Settings</h3>
                  </div>
                  <p className="text-xs text-stone-500 mb-4">
                    Preset your preferred Ethiopian payout destination for fast withdrawals.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setCreatorPayoutInfo(p => ({ ...p, preferredMethod: "telebirr" }))}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition-all ${
                        creatorPayoutInfo.preferredMethod === "telebirr"
                          ? "border-stone-900 bg-white shadow-xs text-stone-900"
                          : "border-stone-200 text-stone-600 bg-stone-50 hover:bg-white"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      Telebirr
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatorPayoutInfo(p => ({ ...p, preferredMethod: "bank_transfer" }))}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition-all ${
                        creatorPayoutInfo.preferredMethod === "bank_transfer"
                          ? "border-stone-900 bg-white shadow-xs text-stone-900"
                          : "border-stone-200 text-stone-600 bg-stone-50 hover:bg-white"
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-purple-600" />
                      Bank Transfer
                    </button>
                  </div>

                  {creatorPayoutInfo.preferredMethod === "telebirr" ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-stone-600">Telebirr Phone</label>
                        <input
                          type="tel"
                          value={creatorPayoutInfo.phoneNumber}
                          onChange={(e) => setCreatorPayoutInfo(p => ({ ...p, phoneNumber: e.target.value }))}
                          placeholder="+251 91 123 4567"
                          className="w-full px-3.5 py-2 border border-stone-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-stone-600">Account Holder Full Name</label>
                        <input
                          type="text"
                          value={creatorPayoutInfo.accountHolderName}
                          onChange={(e) => setCreatorPayoutInfo(p => ({ ...p, accountHolderName: e.target.value }))}
                          placeholder="Name as registered on Telebirr"
                          className="w-full px-3.5 py-2 border border-stone-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-stone-600">Bank Name</label>
                        <select
                          value={creatorPayoutInfo.bankName}
                          onChange={(e) => setCreatorPayoutInfo(p => ({ ...p, bankName: e.target.value }))}
                          className="w-full px-3.5 py-2 border border-stone-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                        >
                          {ETHIOPIAN_BANKS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-stone-600">Bank Account Number</label>
                          <input
                            type="text"
                            value={creatorPayoutInfo.accountNumber}
                            onChange={(e) => setCreatorPayoutInfo(p => ({ ...p, accountNumber: e.target.value }))}
                            placeholder="e.g. 1000123456789"
                            className="w-full px-3.5 py-2 border border-stone-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-stone-600">Account Holder Name</label>
                          <input
                            type="text"
                            value={creatorPayoutInfo.accountHolderName}
                            onChange={(e) => setCreatorPayoutInfo(p => ({ ...p, accountHolderName: e.target.value }))}
                            placeholder="Name as registered with the bank"
                            className="w-full px-3.5 py-2 border border-stone-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Company / Brand Specific Section */}
            {isCompany && (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">Company / Business Name</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Addis Artisan Leather"
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">Business Category</label>
                    <div className="relative">
                      <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      <select
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
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">City / Region</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Addis Ababa"
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">Physical Address / Street</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Bole Medhanialem, Building 3, Suite 402"
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                    />
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">TIN / Business Registration No.</label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="e.g. 0012345678"
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">Company Website</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://addisartisan.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <h3 className="font-medium text-stone-900 mb-4">Company Social & Channel Links</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries(companySocialLinks).map(([platform, url]) => (
                      <div key={platform} className="space-y-1">
                        <label className="text-sm font-medium text-stone-700 capitalize">{platform}</label>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setCompanySocialLinks(prev => ({ ...prev, [platform]: e.target.value }))}
                          placeholder={`https://${platform}.com/...`}
                          className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 py-2.5 px-6 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
