import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import api from "../../utils/axios";
import toast from "react-hot-toast";

const MultipleImageUpload = ({
  value = [], // Array of image relative URLs
  onChange, // Callback: (urls) => void
  uploadUrl = "/uploads/multi-image",
  maxFiles = 5,
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (filesList) => {
    const files = Array.from(filesList);
    if (files.length === 0) return;

    // Check limit
    if (value.length + files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} images in total.`);
      return;
    }

    // Validate type & size
    for (let file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 5MB size limit.`);
        return;
      }
    }

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await api.post(uploadUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      if (response.data?.success) {
        toast.success("Images uploaded successfully.");
        const newUrls = [...value, ...response.data.filePaths];
        onChange(newUrls);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || "Upload failed. Please try again.";
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const onSelectFiles = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
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
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (indexToRemove) => {
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className={`w-full text-left ${className}`}>
      {/* Grid of uploaded images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {value.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-2xl border border-gray-200 overflow-hidden group shadow-sm bg-gray-50 transition-all duration-200 hover:shadow-md"
            >
              <img
                src={url}
                alt={`Uploaded Preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay with delete button */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="w-9 h-9 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-150"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {value.length < maxFiles && (
        <div
          onClick={triggerSelect}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-250
            ${isDragOver ? "border-primary-500 bg-primary-50 scale-[1.01]" : "border-gray-300 hover:border-primary-500 bg-white"}
            ${isUploading ? "pointer-events-none opacity-80" : ""}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onSelectFiles}
            accept="image/*"
            multiple
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Uploading {progress}%</p>
                <div className="w-48 bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-primary-500 h-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center text-gray-500">
              <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Upload multiple images ({value.length}/{maxFiles})
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Drag and drop or click to browse. Max 5MB per image.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultipleImageUpload;
