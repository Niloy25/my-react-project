import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/axios";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Crown } from "lucide-react";

// Modular extracted sections
import DashboardHero from "../components/dashboard/DashboardHero";
import StatsGrid from "../components/dashboard/StatsGrid";
import PremiumUpgrade from "../components/dashboard/PremiumUpgrade";

// Socket chat playground imports
import ChatRoom from "../components/chat/ChatRoom";
import OnlineUsers from "../components/chat/OnlineUsers";

const DashboardPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");

  // React Query mutation for avatar updates
  const avatarMutation = useMutation({
    mutationKey: ["updateAvatar"],
    mutationFn: async (newPath) => {
      const response = await api.put("/users/me", { profilePicture: newPath });
      return response.data;
    },
    onSuccess: (data, newPath) => {
      updateUser({ profilePicture: newPath });
      toast.success("Profile picture updated successfully.");
    },
    onError: (error) => {
      const errMsg = error.response?.data?.message || "Failed to update profile picture in database.";
      toast.error(errMsg);
    },
  });

  const handleAvatarChange = (newPath) => {
    avatarMutation.mutate(newPath);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070a13] via-[#0e1329] to-[#05060b] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome Section Banner */}
        <DashboardHero user={user} onAvatarChange={handleAvatarChange} />

        {/* User Role and Tier Statistics */}
        <StatsGrid user={user} />

        {/* Dynamic Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="relative flex p-1 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.05] shadow-inner w-full max-w-md">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 text-sm font-bold tracking-wide transition-all duration-300 relative z-10 ${
                activeTab === "chat"
                  ? "text-sky-400 bg-sky-500/10 border border-sky-500/30 shadow-lg shadow-sky-500/5 scale-[1.02]"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat Arena
            </button>
            <button
              onClick={() => setActiveTab("premium")}
              className={`flex-1 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 text-sm font-bold tracking-wide transition-all duration-300 relative z-10 ${
                activeTab === "premium"
                  ? "text-amber-450 bg-amber-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/5 scale-[1.02]"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Crown className="w-4 h-4" />
              VIP Membership
            </button>
          </div>
        </div>

        {/* Tab Contents: Always mount to prevent WebSocket disconnect, toggle visibility via class */}
        
        {/* Tab 1: Chat Arena */}
        <div className={`transition-all duration-350 ${activeTab === "chat" ? "opacity-100 scale-100 block" : "opacity-0 scale-95 hidden"}`}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10 items-start">
            <div className="lg:col-span-3">
              <ChatRoom />
            </div>
            <div className="lg:col-span-1">
              <OnlineUsers />
            </div>
          </div>
        </div>

        {/* Tab 2: VIP Upgrade Gateway */}
        <div className={`transition-all duration-350 ${activeTab === "premium" ? "opacity-100 scale-100 block" : "opacity-0 scale-95 hidden"}`}>
          <PremiumUpgrade user={user} updateUser={updateUser} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
