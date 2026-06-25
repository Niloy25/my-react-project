import React, { createContext, useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { getAccessToken } from "../utils/axios";
import { selectIsAuthenticated, selectUser } from "../store/authSlice";
import toast from "react-hot-toast";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectUser);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Only connect if the user is authenticated
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    // Connect to Socket.IO server (using the Vite proxy)
    const socket = io({
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    // ── Socket Events ─────────────────────────────────────────

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      setIsConnected(false);
      console.error("Socket connection error:", error.message);
    });

    // Received initial online users list
    socket.on("online:users", ({ users }) => {
      // Filter out current user from the online list so they don't see themselves
      const filtered = users.filter((u) => u.userId !== currentUser?._id);
      setOnlineUsers(filtered);
    });

    // A user came online
    socket.on("user:online", (user) => {
      if (user.userId === currentUser?._id) return;

      setOnlineUsers((prev) => {
        // Avoid duplicate entries
        if (prev.some((u) => u.userId === user.userId)) return prev;
        return [...prev, user];
      });

      // Show real-time toast
      toast.success(`${user.name} is now online`, {
        icon: "🟢",
        id: `online_${user.userId}`,
      });
    });

    // A user went offline
    socket.on("user:offline", ({ userId, name }) => {
      if (userId === currentUser?._id) return;

      setOnlineUsers((prev) => prev.filter((u) => u.userId !== userId));

      // Show real-time toast
      toast.error(`${name} went offline`, {
        icon: "⚫",
        id: `offline_${userId}`,
      });
    });

    // Cleanup on unmount or when auth state changes
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [isAuthenticated, currentUser?._id]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        onlineUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
