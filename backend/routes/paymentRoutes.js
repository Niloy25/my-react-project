const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createCheckoutSession,
  verifySession,
  createUPIPayment,
  verifyUPIPayment,
  createCODPayment,
  simulateCODDelivery,
  simulateCardPayment,
  completeUPIQRPayment,
  handleWebhook,
} = require("../controllers/paymentController");

const router = express.Router();

// Webhook endpoint (must be raw body - public endpoint since Stripe calls it)
router.post("/webhook", handleWebhook);

// All other endpoints require authentication
router.use(protect);

router.post("/create-checkout-session", createCheckoutSession);
router.post("/verify-session", verifySession);
router.post("/upi", createUPIPayment);
router.post("/upi/verify", verifyUPIPayment);
router.post("/cod", createCODPayment);
router.post("/cod/simulate-delivery", simulateCODDelivery);
router.post("/card-simulate", simulateCardPayment);
router.post("/upi-qr-complete", completeUPIQRPayment);

module.exports = router;
