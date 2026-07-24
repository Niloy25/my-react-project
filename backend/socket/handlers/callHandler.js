const logger = require("../../config/logger");
const User = require("../../models/User");

// In-memory registry of active calls: roomName -> Map<socketId, userDetails>
const activeCalls = new Map();

const callHandler = (io, socket) => {
  // Join a video call inside a room channel
  socket.on("call:join", async ({ room }) => {
    if (!room || typeof room !== "string") return;
    const roomName = room.trim().toLowerCase().replace(/\s+/g, "-");

    try {
      // Query database to ensure user is premium
      const dbUser = await User.findById(socket.user._id).select("isPremium");
      const isPremium = dbUser ? dbUser.isPremium : false;

      if (!isPremium) {
        socket.emit("call:error", {
          message: "Multi-video calls are premium only.",
        });
        return;
      }

      if (!activeCalls.has(roomName)) {
        activeCalls.set(roomName, new Map());
      }

      const roomCall = activeCalls.get(roomName);

      // Save participant info
      roomCall.set(socket.id, {
        userId: socket.user._id.toString(),
        name: socket.user.name,
        avatar: socket.user.profilePicture || "",
        isPremium: true,
      });

      // Fetch all participants currently in the room's call
      const participants = Array.from(roomCall.entries()).map(([sid, info]) => ({
        socketId: sid,
        ...info,
      }));

      // Acknowledge the user joining and send the list of other participants
      socket.emit("call:joined", {
        room: roomName,
        participants,
      });

      // Broadcast user joined to other call participants in the socket room
      socket.to(roomName).emit("call:user-joined", {
        socketId: socket.id,
        userId: socket.user._id.toString(),
        name: socket.user.name,
        avatar: socket.user.profilePicture || "",
        isPremium: true,
      });

      // Broadcast call status updates to all sockets in the text room channel (e.g. for count banners)
      io.to(roomName).emit("call:status:update", {
        room: roomName,
        participants,
      });

      logger.info(`[Call] ${socket.user.name} joined video call in #${roomName}`);
    } catch (error) {
      logger.error(`Error joining call in handler: ${error.message}`);
      socket.emit("call:error", { message: "Internal server error joining call." });
    }
  });

  // Signal peer connection details (offers, answers, ICE candidates) to another socket
  socket.on("call:signal", ({ to, signal }) => {
    io.to(to).emit("call:signal", {
      from: socket.id,
      signal,
    });
  });

  // Leave call explicitly
  socket.on("call:leave", ({ room }) => {
    if (!room || typeof room !== "string") return;
    const roomName = room.trim().toLowerCase().replace(/\s+/g, "-");
    leaveCall(io, socket, roomName);
  });
};

// Helper function to handle a user leaving a call
const leaveCall = (io, socket, roomName) => {
  const roomCall = activeCalls.get(roomName);
  if (roomCall && roomCall.has(socket.id)) {
    roomCall.delete(socket.id);
    if (roomCall.size === 0) {
      activeCalls.delete(roomName);
    }

    // Tell remaining call participants that this user disconnected from call
    socket.to(roomName).emit("call:user-left", {
      socketId: socket.id,
    });

    const participants = roomCall ? Array.from(roomCall.entries()).map(([sid, info]) => ({
      socketId: sid,
      ...info,
    })) : [];

    // Broadcast updated status to the text room channel
    io.to(roomName).emit("call:status:update", {
      room: roomName,
      participants,
    });

    logger.info(`[Call] ${socket.user.name} left video call in #${roomName}`);
  }
};

// Clean up all active calls the socket was in upon disconnect
const handleCallDisconnect = (io, socket) => {
  for (const [roomName, roomCall] of activeCalls.entries()) {
    if (roomCall.has(socket.id)) {
      leaveCall(io, socket, roomName);
    }
  }
};

module.exports = { callHandler, handleCallDisconnect, activeCalls };
