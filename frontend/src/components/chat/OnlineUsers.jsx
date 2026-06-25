import useSocket from "../../hooks/useSocket";
import { Users } from "lucide-react";

export const OnlineUsers = () => {
  const { onlineUsers, isConnected } = useSocket();

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100/80 h-[560px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-800 text-base leading-none mb-1">Online Peers</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
              {isConnected ? "Live Stream" : "Offline"}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-extrabold rounded-full animate-pulse">
          {onlineUsers.length} Active
        </span>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No other users online</p>
            <p className="text-xs mt-1">Share the link with others to chat!</p>
          </div>
        ) : (
          onlineUsers.map((peer) => {
            const initial = peer.name ? peer.name.charAt(0).toUpperCase() : "?";
            return (
              <div
                key={peer.userId}
                className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 transition-all duration-200 group border border-transparent hover:border-gray-100"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {peer.avatar ? (
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="w-10 h-10 rounded-xl object-cover border border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {initial}
                    </div>
                  )}
                  {/* Pulse active indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                </div>

                {/* User details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                    {peer.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    Active on dashboard
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;
