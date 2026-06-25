import React, { useState, useRef } from "react";
import { Upload, X, File, FileText, FileArchive, CheckCircle, Loader2 } from "lucide-react";
import api from "../../utils/axios";
import toast from "react-hot-toast";

// Helper to render extension-specific file icons
const getFileIcon = (filename) => {
  if (!filename) return <File className="w-5 h-5 text-gray-550" />;
  const ext = filename.split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return <FileText className="w-5 h-5 text-red-500" />;
  if (["doc", "docx"].includes(ext)) return <FileText className="w-5 h-5 text-blue-500" />;
  if (["xls", "xlsx"].includes(ext)) return <FileText className="w-5 h-5 text-green-500" />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return <FileArchive className="w-5 h-5 text-amber-550" />;
  return <File className="w-5 h-5 text-gray-500" />;
};

const MultipleFileUpload = ({
  value = [], // Array of file relative URLs
  onChange, // Callback when the file list changes: (urls) => void
  uploadUrl = "/uploads/multi-file",
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

    // Boundary check
    if (value.length + files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files in total.`);
      return;
    }

    // Size check (10MB limit per file)
    for (let file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 10MB size limit.`);
        return;
      }
    }

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
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
        toast.success("Files uploaded successfully.");
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

  const removeFile = (indexToRemove) => {
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className={`w-full text-left ${className}`}>
      {/* Uploaded Files Stack */}
      {value.length > 0 && (
        <div className="space-y-2 mb-4">
          {value.map((url, idx) => {
            const filename = url.split("/").pop();
            const cleanFilename = filename.replace(/^file-\d+-/, "");

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getFileIcon(filename)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-gray-800 truncate" title={cleanFilename}>
                      {cleanFilename}
                    </p>
                    <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Uploaded
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-red-500 rounded-lg transition-colors duration-150"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dropzone */}
      {value.length < maxFiles && (
        <div
          onClick={triggerSelect}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-250
            ${isDragOver ? "border-primary-500 bg-primary-50 scale-[1.01]" : "border-gray-300 hover:border-primary-500 bg-white"}
            ${isUploading ? "pointer-events-none opacity-80" : ""}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onSelectFiles}
            multiple
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-1" />
              <p className="text-sm font-semibold text-gray-700">Uploading files... {progress}%</p>
              <div className="w-36 bg-gray-100 h-1 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-primary-500 h-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center text-gray-500">
              <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Upload multiple files ({value.length}/{maxFiles})
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Drag & drop or click to browse. Max 10MB per file.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultipleFileUpload;
