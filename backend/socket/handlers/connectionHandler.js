const logger = require("../../config/logger");

/**
 * connectionHandler
 * Called immediately when a socket connects (after JWT auth passes).
 * Adds the user to the onlineUsers map and broadcasts their online status.
 *
 * @param {Server} io
 * @param {Socket} socket
 * @param {Map}    onlineUsers  Map<userId, Set<socketId>>
 */

const connectionHandler = (io, socket, onlineUsers) => {
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
    io.emit("user:online", {
      userId,
      name: userName,
      avatar: socket.user.profilePicture || "",
    });
    logger.info(`User came online: ${userName} (${userId})`);
  }

  // Send current online users list to the newly connected socket
  const onlineList = Array.from(onlineUsers.keys()).map((id) => ({
    userId: id,
    socketCount: onlineUsers.get(id).size,
  }));

  socket.emit("online:users", {
    users: onlineList,
    count: onlineUsers.size,
  });

  logger.info(
    `Online count: ${onlineUsers.size} | ${userName} has ${onlineUsers.get(userId).size} tab(s)`,
  );
};

module.exports = connectionHandler;
