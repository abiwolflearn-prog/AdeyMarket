import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { Loader2, ExternalLink, Instagram, Youtube, Twitter, CheckCircle2, User as UserIcon, Users, Briefcase, Store, ArrowRight } from "lucide-react";

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        // Note: Our GET /api/profile/:userId route returns the merged profile
        const { data } = await api.get(`/profile/${id}`);
        setProfile(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Profile not found");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchProfile();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
          <UserIcon className="w-8 h-8 text-stone-400" />
        </div>
        <h2 className="text-xl font-semibold text-stone-900">Profile Not Found</h2>
        <p className="text-stone-500 mt-2">{error || "The requested profile does not exist."}</p>
        <Link to="/" className="mt-6 text-stone-900 font-medium underline underline-offset-4">
          Return Home
        </Link>
      </div>
    );
  }

  const isCreator = profile.role === "creator";
  const isBrand = profile.role === "brand";
  const roleData = profile.profile || {};
  const shop = profile.shop;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        {/* Banner */}
        <div className="h-48 bg-stone-200 w-full relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-stone-300 to-stone-200 mix-blend-multiply opacity-50" />
        </div>

        {/* Profile Content */}
        <div className="px-8 pb-8">
          {/* Header & Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-8 relative z-10">
            <div className="flex items-end gap-6">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-stone-100 overflow-hidden shrink-0 shadow-sm">
                {profile.profilePic ? (
                  <img src={profile.profilePic} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-stone-400" />
                  </div>
                )}
              </div>
              <div className="pb-2">
                <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2">
                  {profile.name}
                  {isBrand && roleData.isApproved && (
                    <CheckCircle2 className="w-6 h-6 text-blue-500" />
                  )}
                </h1>
                <p className="text-stone-500 font-medium capitalize mt-1 flex items-center gap-1.5">
                  {isCreator ? <UserIcon className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                  {profile.role}
                  {isCreator && roleData.niche && ` • ${roleData.niche}`}
                </p>
              </div>
            </div>

            {shop?.shopSlug && (
              <div className="sm:pb-2">
                <Link
                  to={`/shop/${shop.shopSlug}`}
                  className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                  <Store className="w-4 h-4" />
                  Visit Storefront
                </Link>
              </div>
            )}
          </div>


          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column: Stats & Info */}
            <div className="md:col-span-1 space-y-6">
              {/* Creator Specific Info */}
              {isCreator && (
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 space-y-4">
                  <div>
                    <p className="text-sm text-stone-500 font-medium">Total Followers</p>
                    <p className="text-2xl font-bold text-stone-900 flex items-center gap-2 mt-1">
                      <Users className="w-5 h-5 text-stone-400" />
                      {roleData.followerCount ? roleData.followerCount.toLocaleString() : "0"}
                    </p>
                  </div>
                  
                  {roleData.socialLinks && Object.values(roleData.socialLinks).some(Boolean) && (
                    <div className="pt-4 border-t border-stone-200">
                      <p className="text-sm text-stone-500 font-medium mb-3">Social Links</p>
                      <div className="space-y-3">
                        {roleData.socialLinks.instagram && (
                          <a href={roleData.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-stone-700 hover:text-stone-900 transition-colors">
                            <Instagram className="w-4 h-4" /> Instagram
                          </a>
                        )}
                        {roleData.socialLinks.tiktok && (
                          <a href={roleData.socialLinks.tiktok} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-stone-700 hover:text-stone-900 transition-colors">
                            {/* Using ExternalLink as fallback for TikTok since Lucide might not have it */}
                            <ExternalLink className="w-4 h-4" /> TikTok
                          </a>
                        )}
                        {roleData.socialLinks.youtube && (
                          <a href={roleData.socialLinks.youtube} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-stone-700 hover:text-stone-900 transition-colors">
                            <Youtube className="w-4 h-4" /> YouTube
                          </a>
                        )}
                        {roleData.socialLinks.twitter && (
                          <a href={roleData.socialLinks.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-stone-700 hover:text-stone-900 transition-colors">
                            <Twitter className="w-4 h-4" /> Twitter
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Brand Specific Info */}
              {isBrand && (
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 space-y-4">
                  {roleData.companyName && (
                    <div>
                      <p className="text-sm text-stone-500 font-medium">Company Name</p>
                      <p className="text-stone-900 font-medium mt-1">{roleData.companyName}</p>
                    </div>
                  )}
                  {roleData.website && (
                    <div className="pt-4 border-t border-stone-200">
                      <p className="text-sm text-stone-500 font-medium mb-2">Website</p>
                      <a href={roleData.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors">
                        <ExternalLink className="w-4 h-4" /> Visit Website
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Bio or Main Content (Placeholder for future phases like 'Recent Posts' or 'Active Campaigns') */}
            <div className="md:col-span-2">
              <div className="prose prose-stone max-w-none">
                <h3 className="text-lg font-semibold text-stone-900">About</h3>
                <p className="text-stone-600 leading-relaxed mt-2">
                  {/* Using a fallback bio since we haven't formally added a bio field yet to the base user model, but it's standard for profiles */}
                  {profile.bio || `This is the public profile for ${profile.name}. More details, campaigns, and content will be displayed here as they interact with the platform.`}
                </p>
              </div>

              {/* Storefront Feature Banner if available */}
              {shop?.shopSlug ? (
                <div className="mt-8 p-6 bg-stone-50 border border-stone-100 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl border border-stone-200 flex items-center justify-center shrink-0">
                      <Store className="w-6 h-6 text-stone-900" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900">Official Storefront</h4>
                      <p className="text-xs text-stone-500 mt-0.5">Explore catalog, direct products & affiliate deals</p>
                    </div>
                  </div>
                  <Link
                    to={`/shop/${shop.shopSlug}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 px-4 py-2.5 rounded-xl transition-colors"
                  >
                    View Products
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="mt-8 p-8 border-2 border-dashed border-stone-200 rounded-3xl text-center flex flex-col items-center justify-center text-stone-500">
                  <Briefcase className="w-8 h-8 mb-3 text-stone-400" />
                  <p className="font-medium text-stone-700">Activity History</p>
                  <p className="text-sm mt-1">
                    {isCreator ? "Recent posts and collaborations will appear here." : "Active campaigns will appear here."}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
