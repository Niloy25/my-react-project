import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { LogOut, Calendar, User, Shield, Award, Sparkles } from "lucide-react";
import SingleImageUpload from "../components/upload/SingleImageUpload";
import MultipleImageUpload from "../components/upload/MultipleImageUpload";
import SingleFileUpload from "../components/upload/SingleFileUpload";
import MultipleFileUpload from "../components/upload/MultipleFileUpload";
import api from "../utils/axios";
import toast from "react-hot-toast";
import ChatRoom from "../components/chat/ChatRoom";
import OnlineUsers from "../components/chat/OnlineUsers";

const DashboardPage = () => {
  const { user, logout, updateUser } = useAuth();

  // State hooks to power the file upload playground
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedFile, setUploadedFile] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Handles updating the profile avatar and syncing with DB and Redux
  const handleAvatarChange = async (newPath) => {
    try {
      // 1. Update backend user profile
      const response = await api.put("/users/me", { profilePicture: newPath });

      if (response.data?.success) {
        // 2. Sync local Redux state
        updateUser({ profilePicture: newPath });
        toast.success("Profile picture updated successfully.");
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to update profile picture in database.";
      toast.error(errMsg);
    }
  };

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-10 text-white shadow-xl mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />

          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
            {/* Live Profile Picture Uploader */}
            <SingleImageUpload
              value={user?.profilePicture}
              onChange={handleAvatarChange}
              className="flex-shrink-0"
            />

            <div className="text-center sm:text-left">
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome back, {user?.name?.split(" ")[0]}!
              </h1>
              <p className="text-indigo-100 mt-2 text-lg">{user?.email}</p>
              <p className="text-xs uppercase tracking-widest mt-4 text-indigo-200 font-semibold">
                MEMBER SINCE {new Date(user?.createdAt).getFullYear()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Role</p>
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${user?.role === "admin"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-emerald-100 text-emerald-700"
                      }`}
                  >
                    <Shield className="w-4 h-4" />
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>
              <Award className="w-10 h-10 text-gray-300" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Member Since
                </p>
                <p className="text-lg font-semibold text-gray-800 mt-2">
                  {joinDate}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Account Status
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-lg font-semibold text-green-600">
                    Active
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Socket Playground */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10 items-start">
          <div className="lg:col-span-3">
            <ChatRoom />
          </div>
          <div className="lg:col-span-1">
            <OnlineUsers />
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Profile Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: "Full Name", value: user?.name, icon: User },
              { label: "Email Address", value: user?.email },
              {
                label: "Verification Status",
                value: user?.isVerified ? "Verified ✓" : "Not Verified",
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                {Icon && <Icon className="w-5 h-5 text-gray-400 mt-1" />}
                <div>
                  <p className="text-sm text-gray-500 font-medium">{label}</p>
                  <p className="text-gray-900 font-semibold mt-1 break-all">
                    {value || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
