const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      lowercase: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      enum: ["image", "file", "audio"],
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        fileType: { type: String, enum: ["image", "file", "audio"], required: true },
        fileName: { type: String, required: true },
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Create compound index for fast room history queries ordered by date
messageSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
