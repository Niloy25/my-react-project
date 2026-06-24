const logger = require("../../config/logger");

/**
 * notificationHandler
 * Handles real-time notifications for a connected socket.
 *
 * Client -> Server events:
 *   notification:read   { notificationId }   mark notification as read
 *
 * Server -> Client events:
 *   notification:new    pushed from server to specific user
 *
 * @param {Server} io
 * @param {Socket} socket
 * @param {Map}    onlineUsers
 */
const notificationHandler = (io, socket, onlineUsers) => {
  socket.on("notification:read", ({ notificationId }) => {
    if (!notificationId) return;
    // In production: update DB record here
    logger.info(`Notification ${notificationId} read by ${socket.user.name}`);
  });
};

/**
 * sendNotificationToUser
 * Push a real-time notification to a specific user from ANY controller.
 *
 * Usage from any controller:
 *   const { sendNotificationToUser } = require('../socket/handlers/notificationHandler');
 *   sendNotificationToUser(io, onlineUsers, userId, {
 *     type: 'info',
 *     title: 'Welcome!',
 *     message: 'Your account is ready.',
 *   });
 *
 * @param {Server} io
 * @param {Map}    onlineUsers
 * @param {string} targetUserId
 * @param {Object} notification   { type, title, message }
 */
const sendNotificationToUser = (
  io,
  onlineUsers,
  targetUserId,
  notification,
) => {
  const userIdStr = targetUserId.toString();
  const userSockets = onlineUsers.get(userIdStr);

  const payload = {
    id: `notif_${Date.now()}`,
    ...notification,
    timestamp: new Date().toISOString(),
    read: false,
  };

  if (userSockets && userSockets.size > 0) {
    // User is online — send to all their open tabs
    userSockets.forEach((socketId) => {
      io.to(socketId).emit("notification:new", payload);
    });
    logger.info(`Notification pushed to ${userIdStr}: ${notification.title}`);
  } else {
    // User is offline — in production, save to DB here
    logger.info(
      `User ${userIdStr} offline. Notification queued: ${notification.title}`,
    );
  }

  return payload;
};

module.exports = notificationHandler;
module.exports.sendNotificationToUser = sendNotificationToUser;
