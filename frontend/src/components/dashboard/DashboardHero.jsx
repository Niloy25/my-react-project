import React from "react";
import SingleImageUpload from "../upload/SingleImageUpload";

export const DashboardHero = ({ user, onAvatarChange }) => {
  return (
    <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 sm:p-10 text-white shadow-2xl mb-10 overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute -top-10 -right-10 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
        {/* Profile Picture Uploader */}
        <SingleImageUpload
          value={user?.profilePicture}
          onChange={onAvatarChange}
          className="flex-shrink-0 hover:scale-105 transition-transform duration-300"
        />

        <div className="text-center sm:text-left flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
            {user?.isPremium && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/20 animate-pulse border border-amber-300/30">
                👑 VIP Member
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm sm:text-base font-semibold tracking-wide">
            {user?.email}
          </p>
          <div className="pt-1">
            <span className="text-[9px] uppercase font-bold tracking-widest bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.05] text-gray-400">
              Registered in {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;
