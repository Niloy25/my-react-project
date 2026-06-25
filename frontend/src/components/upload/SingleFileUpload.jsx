import React, { useState, useRef } from "react";
import { Upload, X, File, FileText, FileArchive, CheckCircle, Loader2 } from "lucide-react";
import api from "../../utils/axios";
import toast from "react-hot-toast";

// Helper to render dynamic file icons based on extensions
const getFileIcon = (filename) => {
  if (!filename) return <File className="w-8 h-8 text-gray-500" />;
  const ext = filename.split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return <FileText className="w-8 h-8 text-red-500" />;
  if (["doc", "docx"].includes(ext)) return <FileText className="w-8 h-8 text-blue-500" />;
  if (["xls", "xlsx"].includes(ext)) return <FileText className="w-8 h-8 text-green-500" />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return <FileArchive className="w-8 h-8 text-amber-500" />;
  return <File className="w-8 h-8 text-gray-500" />;
};

const SingleFileUpload = ({
  value, // Current relative file URL (e.g. /uploads/document.pdf)
  onChange, // Callback when upload completes or resets: (url) => void
  uploadUrl = "/uploads/single-file",
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Size check: 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be smaller than 10MB.");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

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
        toast.success("File uploaded successfully.");
        onChange(response.data.filePath);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || "Upload failed. Please try again.";
      toast.error(errMsg);
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
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filename = value ? value.split("/").pop() : "";
  // Strip unique Multer prefix: e.g. "file-1718281-document.pdf" -> "document.pdf"
  const cleanFilename = filename.replace(/^file-\d+-/, "");

  return (
    <div className={`w-full text-left ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onSelectFile}
        className="hidden"
      />

      {value ? (
        /* Uploaded File Details Card */
        <div className="flex items-center justify-between p-4 bg-white border border-gray-250 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
              {getFileIcon(filename)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-800 truncate" title={cleanFilename}>
                {cleanFilename}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-green-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Uploaded</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-2 hover:bg-gray-150 text-gray-400 hover:text-red-500 rounded-xl transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : isUploading ? (
        /* Uploading State */
        <div className="border border-gray-200 rounded-2xl p-6 bg-white flex flex-col items-center shadow-sm">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
          <p className="text-sm font-semibold text-gray-700">Uploading file... {progress}%</p>
          <div className="w-full max-w-xs bg-gray-100 h-1 rounded-full overflow-hidden mt-3">
            <div
              className="bg-primary-500 h-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        /* Drag and Drop Zone */
        <div
          onClick={triggerSelect}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-250
            ${isDragOver ? "border-primary-500 bg-primary-50 scale-[1.01]" : "border-gray-300 hover:border-primary-500 bg-white"}
          `}
        >
          <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Upload document</p>
          <p className="text-xs text-gray-400 mt-1">
            Drag & drop or click to upload. Max 10MB.
          </p>
        </div>
      )}
    </div>
  );
};

export default SingleFileUpload;
