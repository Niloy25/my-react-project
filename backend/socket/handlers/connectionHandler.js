const logger = require("../../config/logger");
const User = require("../../models/User");

/**
 * connectionHandler
 * Called immediately when a socket connects (after JWT auth passes).
 * Adds the user to the onlineUsers map and broadcasts their online status.
 *
 * @param {Server} io
 * @param {Socket} socket
 * @param {Map}    onlineUsers  Map<userId, Set<socketId>>
 */

const connectionHandler = async (io, socket, onlineUsers) => {
  const userId = socket.user._id.toString();
  const userName = socket.user.name;

  // Add this socket to the user's set
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // Only announce online on FIRST connection
  // (not when user opens a second tab — they were already online)
  if (onlineUsers.get(userId).size === 1) {
    const dbUser = await User.findById(userId).select("isPremium");
    const isPremium = dbUser ? dbUser.isPremium : false;

    io.emit("user:online", {
      userId,
      name: userName,
      avatar: socket.user.profilePicture || "",
      isPremium,
    });
    logger.info(`User came online: ${userName} (${userId})`);
  }

  // Send current online users list with details to the newly connected socket
  const onlineList = [];
  for (const [id, socketIds] of onlineUsers.entries()) {
    const firstSocketId = Array.from(socketIds)[0];
    const userSocket = io.sockets.sockets.get(firstSocketId);
    if (userSocket && userSocket.user) {
      const dbUser = await User.findById(userSocket.user._id).select("isPremium");
      onlineList.push({
        userId: id,
        name: userSocket.user.name,
        avatar: userSocket.user.profilePicture || "",
        isPremium: dbUser ? dbUser.isPremium : false,
      });
    } else {
      onlineList.push({
        userId: id,
        name: "User",
        avatar: "",
        isPremium: false,
      });
    }
  }

  socket.emit("online:users", {
    users: onlineList,
    count: onlineUsers.size,
  });

  logger.info(
    `Online count: ${onlineUsers.size} | ${userName} has ${onlineUsers.get(userId).size} tab(s)`,
  );
};

module.exports = connectionHandler;

