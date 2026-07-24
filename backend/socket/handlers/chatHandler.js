const logger = require("../../config/logger");
const Message = require("../../models/Message");
const User = require("../../models/User");
const { activeCalls } = require("./callHandler");
const { generateAIResponse } = require("../../utils/aiService");

async function getOrCreateAIUser() {
  let aiUser = await User.findOne({ email: "ai.assistant@helper.ai" });
  if (!aiUser) {
    aiUser = new User({
      name: "AI Assistant",
      email: "ai.assistant@helper.ai",
      password: "ai-assistant-system-password-dummy",
      isPremium: true,
      profilePicture: "",
      isVerified: true
    });
    await aiUser.save();
  }
  return aiUser;
}

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
  socket.on("room:join", async ({ room }) => {
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

    // Send the current video call status for this room to the joining user
    const roomCall = activeCalls ? activeCalls.get(roomName) : null;
    const participants = roomCall
      ? Array.from(roomCall.entries()).map(([sid, info]) => ({
        socketId: sid,
        ...info,
      }))
      : [];

    socket.emit("call:status:update", {
      room: roomName,
      participants,
    });

    logger.info(`${socket.user.name} joined room: ${roomName}`);

    // Fetch and send room history to the joining user
    try {
      const history = await Message.find({ room: roomName })
        .populate("sender", "name profilePicture isPremium")
        .sort({ createdAt: 1 })
        .limit(100);

      const formattedHistory = history.map((msg) => ({
        id: msg._id.toString(),
        room: msg.room,
        message: msg.message,
        fileUrl: msg.fileUrl,
        fileType: msg.fileType,
        fileName: msg.fileName,
        attachments: msg.attachments || [],
        sender: {
          userId: msg.sender?._id || "deleted",
          name: msg.sender?.name || "Deleted User",
          avatar: msg.sender?.profilePicture || "",
          isPremium: msg.sender?.isPremium || false,
        },
        timestamp: msg.createdAt.toISOString(),
      }));

      socket.emit("room:history", {
        room: roomName,
        messages: formattedHistory,
      });
    } catch (error) {
      logger.error(`Failed to load chat history for ${roomName}: ${error.message}`);
    }
  });

  // ── Leave Room ──────────────────────────────────────────
  socket.on("room:leave", ({ room }) => {
    if (!room) return;
    socket.leave(room);
    logger.info(`${socket.user.name} left room: ${room}`);
  });

  // ── Send Message ────────────────────────────────────────
  socket.on("message:send", async ({ room, message, fileUrl, fileType, fileName, attachments }) => {
    if (!room) return;

    const trimmed = typeof message === "string" ? message.trim() : "";
    const hasAttachments = (attachments && attachments.length > 0) || fileUrl;
    if (!trimmed && !hasAttachments) return;
    if (trimmed && trimmed.length > 1000) return;

    // Make sure sender is in the room before broadcasting
    if (!socket.rooms.has(room)) {
      socket.emit("error:message", {
        message: `You are not in room #${room}. Join it first.`,
      });
      return;
    }

    try {
      const newMessage = new Message({
        room,
        sender: socket.user._id,
        message: trimmed,
        fileUrl,
        fileType,
        fileName,
        attachments: attachments || [],
      });
      await newMessage.save();

      // Fetch fresh user details to avoid stale isPremium state
      const dbUser = await User.findById(socket.user._id).select("isPremium");
      const isPremium = dbUser ? dbUser.isPremium : false;

      const payload = {
        id: newMessage._id.toString(),
        room,
        message: trimmed,
        fileUrl,
        fileType,
        fileName,
        attachments: newMessage.attachments || [],
        sender: {
          userId: socket.user._id,
          name: socket.user.name,
          avatar: socket.user.profilePicture || "",
          isPremium,
        },
        timestamp: newMessage.createdAt.toISOString(),
      };

      // Send to ALL users in the room including sender
      io.to(room).emit("message:receive", payload);

      logger.info(`[#${room}] ${socket.user.name}: ${trimmed ? trimmed.slice(0, 50) : "[Attachment]"}`);

      // Check if this is the AI Companion channel or references the bot
      const isAIChat = room === "ai-companion" || trimmed.toLowerCase().includes("@ai") || trimmed.toLowerCase().includes("@bot") || trimmed.toLowerCase().includes("@assistant");
      if (isAIChat) {
        // Run asynchronously to allow instant UI delivery of user message
        (async () => {
          try {
            const aiUser = await getOrCreateAIUser();
            
            // Emit typing status
            io.to(room).emit("typing:status", {
              room,
              userId: aiUser._id.toString(),
              name: aiUser.name,
              isTyping: true,
            });

            // Simulate typing delay
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Clean prompt of tags
            const cleanPrompt = trimmed
              .replace(/@ai-companion/gi, "")
              .replace(/@ai/gi, "")
              .replace(/@bot/gi, "")
              .replace(/@assistant/gi, "")
              .trim();

            const isAudio = fileType === "audio" || (attachments && attachments.some(att => att.fileType === "audio"));
            const targetAudio = isAudio ? (fileUrl || (attachments && attachments.find(att => att.fileType === "audio")?.fileUrl)) : null;
            const path = require("path");
            const audioPathOnDisk = targetAudio ? path.join(__dirname, "../..", targetAudio) : null;

            const promptText = isAudio ? "[User sent a voice message / audio recording]" : (cleanPrompt || "Hello");

            const responseText = await generateAIResponse(promptText, audioPathOnDisk);

            const aiMessage = new Message({
              room,
              sender: aiUser._id,
              message: responseText,
            });
            await aiMessage.save();

            const aiPayload = {
              id: aiMessage._id.toString(),
              room,
              message: responseText,
              attachments: [],
              sender: {
                userId: aiUser._id,
                name: aiUser.name,
                avatar: "",
                isPremium: true,
              },
              timestamp: aiMessage.createdAt.toISOString(),
            };

            // Stop typing status
            io.to(room).emit("typing:status", {
              room,
              userId: aiUser._id.toString(),
              name: aiUser.name,
              isTyping: false,
            });

            // Emit response
            io.to(room).emit("message:receive", aiPayload);
          } catch (aiErr) {
            logger.error(`AI Bot Error: ${aiErr.message}`);
          }
        })();
      }
    } catch (error) {
      logger.error(`Failed to save message: ${error.message}`);
      socket.emit("error:message", {
        message: "Failed to send message. Please try again.",
      });
    }
  });
};

module.exports = chatHandler;
