import React from "react";
import {
  MessageSquare,
  Globe,
  Code2,
  Sparkles,
  Bot,
  Wifi,
  WifiOff,
} from "lucide-react";

export const AVAILABLE_ROOMS = ["general", "development", "random", "ai-companion"];

export const ROOM_ICONS = {
  general: Globe,
  development: Code2,
  random: Sparkles,
  "ai-companion": Bot,
};

const ChatSidebar = ({ activeRoom, setActiveRoom, isConnected }) => {
  return (
    <div className="w-1/4 bg-white/[0.01] backdrop-blur-xl border-r border-white/[0.06] p-5 flex flex-col justify-between">
      <div>
        <h3 className="font-extrabold text-gray-400 px-2 mb-5 text-[11px] uppercase tracking-widest flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-500" /> Channels
        </h3>
        <div className="space-y-2">
          {AVAILABLE_ROOMS.map((room) => {
            const isActive = activeRoom === room;
            const IconComponent = ROOM_ICONS[room] || Globe;
            return (
              <button
                key={room}
                onClick={() => setActiveRoom(room)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 transform active:scale-95 ${isActive
                  ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]"
                  : "text-gray-400 hover:bg-white/[0.04] hover:text-white hover:shadow-sm border border-transparent hover:border-white/[0.05]"
                  }`}
              >
                <IconComponent
                  className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`}
                />
                <span className="truncate">{room}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connection Status Badge */}
      <div className="bg-white/[0.02] backdrop-blur-xl p-3.5 rounded-2xl border border-white/[0.05] shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-green-400" : "bg-red-400"}`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            ></span>
          </span>
          <span className="text-[11px] font-bold text-gray-300">
            {isConnected ? "Sockets Secure" : "Disconnected"}
          </span>
        </div>
        {isConnected ? (
          <Wifi className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-red-500" />
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
