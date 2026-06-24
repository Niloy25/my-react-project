const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../config/logger");
const connectionHandler = require("./handlers/connectionHandler");
const chatHandler = require("./handlers/chatHandler");
const notificationHandler = require("./handlers/notificationHandler");

// Track online users: userId -> Set of socketIds
// Using Set so one user can have multiple tabs open
const onlineUsers = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectionTimeout: 10000,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── JWT Auth Middleware ───────────────────────────────────────────────────
  // Runs BEFORE every socket connection — rejects bad tokens immediately
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required. No token provided."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select(
        "-password -refreshTokens",
      );

      if (!user || !user.isActive) {
        return next(new Error("User not found or account deactivated."));
      }

      // Attach user to socket — available in all event handlers
      socket.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return next(new Error("Token expired. Please refresh and reconnect."));
      }
      return next(new Error("Invalid token."));
    }
  });

  // ── On Connection ─────────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.user.name} [${socket.id}]`);

    // Register all event handlers
    connectionHandler(io, socket, onlineUsers);
    chatHandler(io, socket);
    notificationHandler(io, socket, onlineUsers);

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.user.name} — ${reason}`);

      const userId = socket.user._id.toString();
      const userSockets = onlineUsers.get(userId);

      if (userSockets) {
        userSockets.delete(socket.id);

        // Only broadcast offline if ALL tabs/devices are closed
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          io.emit("user:offline", {
            userId,
            name: socket.user.name,
          });

          logger.info(`User went offline: ${socket.user.name}`);
        }
      }
    });

    socket.on("error", (error) => {
      logger.error(`Socket error [${socket.user.name}]: ${error.message}`);
    });
  });

  logger.info("Socket.IO server initialised");
  return io;
};

module.exports = { initSocket, onlineUsers };
