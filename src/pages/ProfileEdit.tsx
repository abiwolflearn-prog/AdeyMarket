import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { Loader2, Save } from "lucide-react";
import { AvatarUpload } from "../components/AvatarUpload";

export default function ProfileEdit() {
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Base user fields
  const [name, setName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  
  // Role specific fields
  const [niche, setNiche] = useState("");
  const [followerCount, setFollowerCount] = useState<number | "">("");
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    tiktok: "",
    youtube: "",
    twitter: "",
  });
  
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [website, setWebsite] = useState("");

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
      setProfilePic(data.profilePic || "");
      
      if (data.role === "creator" && data.profile) {
        setNiche(data.profile.niche || "");
        setFollowerCount(data.profile.followerCount || "");
        setSocialLinks({
          instagram: data.profile.socialLinks?.instagram || "",
          tiktok: data.profile.socialLinks?.tiktok || "",
          youtube: data.profile.socialLinks?.youtube || "",
          twitter: data.profile.socialLinks?.twitter || "",
        });
      } else if (data.role === "brand" && data.profile) {
        setCompanyName(data.profile.companyName || "");
        setTaxId(data.profile.taxId || "");
        setWebsite(data.profile.website || "");
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
      
      const payload: any = { name };
      
      if (user?.role === "creator") {
        payload.niche = niche;
        payload.followerCount = followerCount === "" ? 0 : Number(followerCount);
        payload.socialLinks = socialLinks;
      } else if (user?.role === "brand") {
        payload.companyName = companyName;
        payload.taxId = taxId;
        payload.website = website;
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-900">Edit Profile</h1>
          <p className="text-sm text-stone-500 mt-1">Update your personal and professional details.</p>
        </div>

        {/* Avatar Upload */}
        <div className="mb-10 pb-10 border-b border-stone-100">
          <AvatarUpload
            currentAvatar={profilePic}
            onUploadSuccess={(newAvatarUrl) => setProfilePic(newAvatarUrl)}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
              />
            </div>

            {user?.role === "creator" && (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">Niche / Category</label>
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g. Beauty, Tech, Lifestyle"
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">Total Followers</label>
                    <input
                      type="number"
                      min="0"
                      value={followerCount}
                      onChange={(e) => setFollowerCount(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <h3 className="font-medium text-stone-900 mb-4">Social Links</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries(socialLinks).map(([platform, url]) => (
                      <div key={platform} className="space-y-1">
                        <label className="text-sm font-medium text-stone-700 capitalize">{platform}</label>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setSocialLinks(prev => ({ ...prev, [platform]: e.target.value }))}
                          placeholder={`https://${platform}.com/...`}
                          className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {user?.role === "brand" && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
                  />
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">Tax ID</label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-stone-700">Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
                    />
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
