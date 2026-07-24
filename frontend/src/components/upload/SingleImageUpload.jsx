import React, { useState, useRef } from "react";
import { Camera, X, Upload, User } from "lucide-react";
import api from "../../utils/axios";
import toast from "react-hot-toast";

const SingleImageUpload = ({
  value, // Current relative image URL (e.g. /uploads/image.png)
  onChange, // Callback when upload succeeds: (url) => void
  uploadUrl = "/uploads/single-image", // Matches proxy /api/uploads/single-image
  className = "",
}) => {
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be smaller than 5MB.");
      return;
    }

    // Set local preview instantly
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await api.post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      if (response.data?.success) {
        toast.success("Image uploaded successfully.");
        onChange(response.data.filePath);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || "Upload failed. Please try again.";
      toast.error(errMsg);
      setPreview(null); // Clear preview on error
    } finally {
      setIsUploading(false);
    }
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Resolve the image source URL
  const currentImage = preview || value || null;
  const isDefaultGoogleAvatar = currentImage && currentImage.includes("default-user");

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div
        onClick={triggerSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-32 h-32 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all duration-300
          ${isDragOver ? "border-primary-500 bg-primary-500/10 scale-105" : "border-white/20 hover:border-primary-500 bg-white/10"}
          ${isUploading ? "pointer-events-none opacity-80" : ""}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onSelectFile}
          accept="image/*"
          className="hidden"
        />

        {currentImage && !isDefaultGoogleAvatar ? (
          <>
            <img
              src={currentImage}
              alt="Uploaded Preview"
              className="w-full h-full object-cover rounded-full"
            />
            {/* Dark overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 rounded-full">
              <Camera className="w-6 h-6 text-white animate-pulse" />
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-sky-400 to-cyan-400 flex flex-col items-center justify-center text-white relative rounded-full">
            <User className="w-12 h-12 text-white/90" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 rounded-full">
              <Camera className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white rounded-full">
            <span className="text-xs font-bold mb-1">{progress}%</span>
            <div className="w-16 bg-white/20 h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary-500 h-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Remove Button */}
        {value && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-0 right-0 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 text-center">
        Drag & drop or click to upload. Max 5MB.
      </p>
    </div>
  );
};

export default SingleImageUpload;
