const logger = require("../../config/logger");

/**
 * chatHandler
 * Manages room-based real-time chat.
 *
 * Client -> Server events:
 *   room:join      { room }           join a named room
 *   room:leave     { room }           leave a named room
 *   message:send   { room, message }  send a message
 *
 * Server -> Client events:
 *   room:joined        confirmation sent to the joining user
 *   room:user:joined   broadcast to room that someone joined
 *   message:receive    new message broadcast to everyone in the room
 *   error:message      sent back to sender if something is wrong
 *
 * @param {Server} io
 * @param {Socket} socket
 */
const chatHandler = (io, socket) => {
  // ── Join Room ───────────────────────────────────────────
  socket.on("room:join", ({ room }) => {
    if (!room || typeof room !== "string") return;

    const roomName = room.trim().toLowerCase().replace(/\s+/g, "-");

    socket.join(roomName);

    // Confirm to the joining user
    socket.emit("room:joined", {
      room: roomName,
      message: `You joined #${roomName}`,
    });

    // Tell everyone else in the room
    socket.to(roomName).emit("room:user:joined", {
      userId: socket.user._id,
      name: socket.user.name,
      room: roomName,
    });

    logger.info(`${socket.user.name} joined room: ${roomName}`);
  });

  // ── Leave Room ──────────────────────────────────────────
  socket.on("room:leave", ({ room }) => {
    if (!room) return;
    socket.leave(room);
    logger.info(`${socket.user.name} left room: ${room}`);
  });

  // ── Send Message ────────────────────────────────────────
  socket.on("message:send", ({ room, message }) => {
    if (!room || !message) return;
    if (typeof message !== "string") return;

    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 1000) return;

    // Make sure sender is in the room before broadcasting
    if (!socket.rooms.has(room)) {
      socket.emit("error:message", {
        message: `You are not in room #${room}. Join it first.`,
      });
      return;
    }

    const payload = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      room,
      message: trimmed,
      sender: {
        userId: socket.user._id,
        name: socket.user.name,
        avatar: socket.user.profilePicture || "",
      },
      timestamp: new Date().toISOString(),
    };

    // Send to ALL users in the room including sender
    io.to(room).emit("message:receive", payload);

    logger.info(`[#${room}] ${socket.user.name}: ${trimmed.slice(0, 50)}`);
  });
};

module.exports = chatHandler;
