import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../services/api";

export interface AvatarUploadProps {
  currentAvatar?: string;
  onUploadSuccess: (url: string) => void;
  endpoint?: string;
  fieldName?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  shape?: "circle" | "rounded";
  className?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onUploadSuccess,
  endpoint = "/profile/avatar",
  fieldName = "avatar",
  title = "Profile Picture",
  subtitle = "JPG, GIF or PNG. 5MB max.",
  buttonText = "Change picture",
  maxSizeMB = 5,
  disabled = false,
  shape = "circle",
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append(fieldName, file);

      const { data } = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl = data.profilePic || data.url || data.logo || (typeof data === "string" ? data : "");
      onUploadSuccess(uploadedUrl);
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload avatar");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isCircle = shape === "circle";
  const containerRadius = isCircle ? "rounded-full" : "rounded-2xl";

  return (
    <div
      id="avatar-upload-container"
      className={`flex flex-col sm:flex-row items-center gap-6 ${className}`}
    >
      <div className="relative group">
        <div
          className={`w-24 h-24 ${containerRadius} overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center`}
        >
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              <Camera className="w-8 h-8" />
            </div>
          )}
        </div>
        <button
          type="button"
          id="avatar-upload-overlay-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          aria-label={buttonText}
          className={`absolute inset-0 flex items-center justify-center bg-black/40 ${containerRadius} opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </button>
        <input
          type="file"
          id="avatar-upload-file-input"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      <div>
        <h3 className="font-medium text-stone-900">{title}</h3>
        <p className="text-sm text-stone-500 mt-1">{subtitle}</p>
        <button
          type="button"
          id="avatar-upload-change-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="mt-3 text-sm font-medium text-stone-900 bg-white border border-stone-200 px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : buttonText}
        </button>
      </div>
    </div>
  );
};

export default AvatarUpload;
