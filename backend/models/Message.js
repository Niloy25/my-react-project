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
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for fast room history queries ordered by date
messageSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
