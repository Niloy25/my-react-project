import React from "react";
import { Shield, Calendar, Award, Crown, UserCheck } from "lucide-react";

export const StatsGrid = ({ user }) => {
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {/* Role Card */}
      <div className="group relative bg-white/[0.02] backdrop-blur-xl rounded-3xl p-6 shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 border border-white/[0.05] overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-300 pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">System Role</p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm ${
                  user?.role === "admin"
                    ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
            user?.role === "admin" ? "bg-violet-500/10 text-violet-450" : "bg-emerald-500/10 text-emerald-450"
          }`}>
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Join Date Card */}
      <div className="group relative bg-white/[0.02] backdrop-blur-xl rounded-3xl p-6 shadow-2xl hover:shadow-teal-500/5 hover:-translate-y-1 transition-all duration-300 border border-white/[0.05] overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-300 pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Member Since</p>
            <p className="text-lg font-black text-slate-200 tracking-tight">{joinDate}</p>
          </div>
          <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Account Tier Card */}
      <div className="group relative bg-white/[0.02] backdrop-blur-xl rounded-3xl p-6 shadow-2xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 border border-white/[0.05] overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-300 pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Tier</p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm ${
                  user?.isPremium
                    ? "bg-amber-500/10 text-amber-450 border border-amber-500/20"
                    : "bg-white/5 text-slate-350 border border-white/10"
                }`}
              >
                {user?.isPremium ? <Crown className="w-3.5 h-3.5 text-amber-500 animate-bounce" /> : <Award className="w-3.5 h-3.5" />}
                {user?.isPremium ? "PREMIUM VIP" : "FREE TIER"}
              </span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
            user?.isPremium ? "bg-amber-500/10 text-amber-450" : "bg-white/5 text-slate-400"
          }`}>
            {user?.isPremium ? <Crown className="w-6 h-6 text-amber-500" /> : <Award className="w-6 h-6" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;
