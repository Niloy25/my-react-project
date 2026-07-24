const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    method: {
      type: String,
      enum: ["stripe", "upi", "cod"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "failed"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    stripeSessionId: {
      type: String,
    },
    upiId: {
      type: String,
    },
    deliveryAddress: {
      type: String,
    },
    courierPartner: {
      type: String,
    },
    shipmentId: {
      type: String,
    },
    trackingId: {
      type: String,
    },
    trackingUrl: {
      type: String,
    },
    shippingStatus: {
      type: String,
      enum: ["unshipped", "processing", "shipped", "in_transit", "delivered", "cancelled"],
      default: "unshipped",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
