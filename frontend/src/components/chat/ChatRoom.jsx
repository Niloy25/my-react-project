import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import useSocket from "../../hooks/useSocket";
import { selectUser } from "../../store/authSlice";
import {
  MessageSquare,
  Send,
  Info,
  Globe,
  Code2,
  Sparkles,
  Check,
  Wifi,
  WifiOff,
} from "lucide-react";
import toast from "react-hot-toast";

const AVAILABLE_ROOMS = ["general", "development", "random"];

const ROOM_ICONS = {
  general: Globe,
  development: Code2,
  random: Sparkles,
};

export const ChatRoom = () => {
  const { socket, isConnected } = useSocket();
  const currentUser = useSelector(selectUser);

  const [activeRoom, setActiveRoom] = useState("general");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // ── Auto-Scroll ─────────────────────────────────────────
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ── Handle Room Joining & Event Listeners ─────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    const roomName = activeRoom;

    // 1. Join the active room
    socket.emit("room:join", { room: roomName });

    // 2. Set initial system message for the new room
    const welcomeMsg = {
      id: `sys_welcome_${Date.now()}`,
      type: "system",
      message: `Welcome to #${roomName}! This is the beginning of the channel.`,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);

    // 3. Register listeners
    const handleMessageReceive = (msg) => {
      if (msg.room === roomName) {
        setMessages((prev) => [...prev, { ...msg, type: "chat" }]);
      }
    };

    const handleRoomJoined = (data) => {
      console.log("Joined confirmation:", data.message);
    };

    const handleRoomHistory = (data) => {
      if (data.room === roomName) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const historyWithChatType = data.messages
            .map((msg) => ({ ...msg, type: "chat" }))
            .filter((msg) => !existingIds.has(msg.id));

          const systemMessages = prev.filter((m) => m.type === "system");
          const realTimeMessages = prev.filter((m) => m.type === "chat");

          return [
            ...systemMessages,
            ...historyWithChatType,
            ...realTimeMessages,
          ];
        });
      }
    };

    const handleUserJoined = (data) => {
      if (data.room === roomName && data.userId !== currentUser?._id) {
        setMessages((prev) => [
          ...prev,
          {
            id: `sys_join_${Date.now()}_${data.userId}`,
            type: "system",
            message: `${data.name} joined #${roomName}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    const handleErrorMessage = (data) => {
      toast.error(data.message);
    };

    socket.on("message:receive", handleMessageReceive);
    socket.on("room:joined", handleRoomJoined);
    socket.on("room:history", handleRoomHistory);
    socket.on("room:user:joined", handleUserJoined);
    socket.on("error:message", handleErrorMessage);

    // ── Cleanup: Leave the room and turn off listeners ─────
    return () => {
      socket.emit("room:leave", { room: roomName });
      socket.off("message:receive", handleMessageReceive);
      socket.off("room:joined", handleRoomJoined);
      socket.off("room:history", handleRoomHistory);
      socket.off("room:user:joined", handleUserJoined);
      socket.off("error:message", handleErrorMessage);
    };
  }, [socket, isConnected, activeRoom, currentUser?._id]);

  // ── Send Message ─────────────────────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!socket || !isConnected) {
      toast.error("Not connected to the socket server");
      return;
    }

    const trimmed = messageText.trim();
    if (!trimmed) return;

    if (trimmed.length > 1000) {
      toast.error("Message exceeds maximum length of 1000 characters");
      return;
    }

    // Emit send event
    socket.emit("message:send", {
      room: activeRoom,
      message: trimmed,
    });

    setMessageText("");
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100/80 h-[560px] flex overflow-hidden backdrop-blur-md relative">
      {/* CSS Micro-animations and effects */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .message-bubble-anim {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Rooms Sidebar */}
      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-slate-100/90 border-r border-gray-100 p-5 flex flex-col justify-between">
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
                  className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 transform active:scale-95 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-200/40 scale-[1.02]"
                      : "text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-gray-100/80"
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
        <div className="bg-white/85 backdrop-blur-md p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-green-400" : "bg-red-400"}`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              ></span>
            </span>
            <span className="text-[11px] font-bold text-gray-600">
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

      {/* Chat Conversation Panel */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm flex items-center justify-center">
              {React.createElement(ROOM_ICONS[activeRoom] || Globe, {
                className: "w-5 h-5 text-indigo-600",
              })}
            </div>
            <div>
              <h3 className="font-extrabold text-gray-800 capitalize leading-none mb-1 text-lg">
                {activeRoom}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">
                Active Channel
              </p>
            </div>
          </div>
          <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3.5 py-2 rounded-xl border border-indigo-100/30 flex items-center gap-1.5 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
            </span>
            <span>Real-time Stream</span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-gray-50/10 to-gray-50/50 scrollbar-hidden">
          {messages.map((msg) => {
            if (msg.type === "system") {
              return (
                <div
                  key={msg.id}
                  className="flex justify-center my-2 message-bubble-anim"
                >
                  <span className="px-4 py-1.5 bg-indigo-50/70 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100/30 shadow-sm backdrop-blur-sm">
                    {msg.message}
                  </span>
                </div>
              );
            }

            const isMe = msg.sender?.userId === currentUser?._id;
            const time = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-3 max-w-[85%] ${
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mb-1">
                  {msg.sender?.avatar ? (
                    <img
                      src={msg.sender.avatar}
                      alt={msg.sender.name}
                      className="w-9 h-9 rounded-xl object-cover border border-gray-150 shadow-sm"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-indigo-100">
                      {msg.sender?.name
                        ? msg.sender.name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                  )}
                </div>

                {/* Message Bubble Container */}
                <div className="flex flex-col">
                  {!isMe && (
                    <span className="text-[11px] font-extrabold text-gray-500 ml-1.5 mb-1.5 block">
                      {msg.sender?.name}
                    </span>
                  )}
                  <div
                    className={`px-4 py-1 rounded-3xl text-sm leading-relaxed shadow-sm transition-all duration-300 relative group border ${
                      isMe
                        ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-br-none border-indigo-500/10 shadow-indigo-250/20 shadow-md"
                        : "bg-white text-gray-800 rounded-tl-none border-gray-100 shadow-sm hover:shadow-md"
                    } message-bubble-anim`}
                  >
                    <p className="break-words whitespace-pre-wrap font-medium text-xs">
                      {msg.message}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          isMe ? "text-indigo-200/80" : "text-gray-400"
                        }`}
                      >
                        {time}
                      </span>
                      {isMe && <Check className="w-3 h-3 text-indigo-200/80" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="p-5 border-t border-gray-100 bg-white/95 backdrop-blur-md flex items-center gap-3"
        >
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={!isConnected}
              placeholder={
                isConnected
                  ? `Message #${activeRoom}...`
                  : "Connecting to secure channel..."
              }
              className="w-full bg-gray-50 border border-gray-150 rounded-2xl pl-5 pr-16 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 disabled:opacity-50 placeholder-gray-400"
            />
            {messageText.trim().length > 0 && (
              <span className="absolute right-4 text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100/50 animate-fade-in">
                {messageText.length}/1000
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!isConnected || !messageText.trim()}
            className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white rounded-2xl disabled:opacity-40 transition-all duration-300 shadow-lg shadow-indigo-100 hover:shadow-xl hover:shadow-indigo-250/30 hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            <Send className="w-5 h-5 transform hover:rotate-12 transition-transform duration-300" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
