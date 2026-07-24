const User = require("../models/User");
const Payment = require("../models/Payment");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");
const { createShippingOrder } = require("../utils/shippingService");

let stripeInstance = null;
const getStripe = () => {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.includes("your_stripe_secret_key")) {
      throw new AppError("Stripe Secret Key is not configured. Please add it to your backend .env file.", 400);
    }
    stripeInstance = require("stripe")(key);
  }
  return stripeInstance;
};

// Create Stripe Checkout Session
const createCheckoutSession = async (req, res, next) => {
  try {
    const { deliveryAddress } = req.body;
    const stripe = getStripe();
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Premium VIP Upgrade",
              description: "Unlocks the Golden Crown VIP Badge, Custom Highlighted chat, and special perks.",
            },
            unit_amount: 1999, // $19.99
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&method=stripe`,
      cancel_url: `${clientUrl}/payment-cancel`,
      metadata: {
        userId: req.user._id.toString(),
      },
    });

    // Save pending payment record
    await Payment.create({
      user: req.user._id,
      method: "stripe",
      status: "pending",
      amount: 19.99,
      stripeSessionId: session.id,
      deliveryAddress,
    });

    res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    next(error);
  }
};

// Verify Stripe Checkout Session
const verifySession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return next(new AppError("Session ID is required", 400));
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // Update Payment Record
      const payment = await Payment.findOneAndUpdate(
        { stripeSessionId: sessionId },
        { status: "completed" },
        { new: true }
      );

      // Upgrade User
      const userId = session.metadata.userId;
      const user = await User.findByIdAndUpdate(
        userId,
        { isPremium: true },
        { new: true }
      );

      logger.info(`User upgraded to Premium via Stripe: ${user.email}`);

      // Assign courier tracking if deliveryAddress is present
      if (payment && payment.deliveryAddress && payment.shippingStatus === "unshipped") {
        const shippingDetails = await createShippingOrder(payment, user);
        payment.shipmentId = shippingDetails.shipmentId;
        payment.courierPartner = shippingDetails.courierPartner;
        payment.trackingId = shippingDetails.trackingId;
        payment.trackingUrl = shippingDetails.trackingUrl;
        payment.shippingStatus = "processing";
        await payment.save();
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified, user upgraded to Premium successfully.",
        user: user.toSafeObject(),
        shipping: payment && payment.deliveryAddress ? {
          courierPartner: payment.courierPartner,
          trackingId: payment.trackingId,
          trackingUrl: payment.trackingUrl,
          shippingStatus: payment.shippingStatus,
        } : undefined,
      });
    }

    res.status(400).json({
      success: false,
      message: "Stripe checkout session has not been paid.",
    });
  } catch (error) {
    next(error);
  }
};

// Create UPI Payment Request
const createUPIPayment = async (req, res, next) => {
  try {
    const { upiId } = req.body;

    const payment = await Payment.create({
      user: req.user._id,
      method: "upi",
      status: "pending",
      amount: 19.99,
      upiId: upiId || "QR-Scan",
    });

    res.status(201).json({
      success: true,
      message: "UPI Payment requested. Proceed to verify.",
      paymentId: payment._id,
      amount: 19.99,
    });
  } catch (error) {
    next(error);
  }
};

// Verify/Approve UPI Payment (Simulated)
const verifyUPIPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return next(new AppError("Payment ID is required", 400));
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return next(new AppError("Payment record not found", 404));
    }

    if (payment.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "UPI payment already completed.",
      });
    }

    // Complete payment and upgrade user
    payment.status = "completed";
    await payment.save();

    const user = await User.findByIdAndUpdate(
      payment.user,
      { isPremium: true },
      { new: true }
    );

    logger.info(`User upgraded to Premium via UPI: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "UPI Payment simulated successfully.",
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// Create COD Payment Request
const createCODPayment = async (req, res, next) => {
  try {
    const { deliveryAddress } = req.body;
    if (!deliveryAddress) {
      return next(new AppError("Delivery Address is required for Cash on Delivery", 400));
    }

    const payment = await Payment.create({
      user: req.user._id,
      method: "cod",
      status: "pending",
      amount: 19.99,
      deliveryAddress,
    });

    // Automatically dispatch shipment and assign courier partner for COD order
    const shippingDetails = await createShippingOrder(payment, req.user);
    payment.shipmentId = shippingDetails.shipmentId;
    payment.courierPartner = shippingDetails.courierPartner;
    payment.trackingId = shippingDetails.trackingId;
    payment.trackingUrl = shippingDetails.trackingUrl;
    payment.shippingStatus = "processing";
    await payment.save();

    res.status(201).json({
      success: true,
      message: "COD order registered successfully and courier assigned.",
      paymentId: payment._id,
      amount: 19.99,
      deliveryAddress,
      shipping: {
        courierPartner: payment.courierPartner,
        trackingId: payment.trackingId,
        trackingUrl: payment.trackingUrl,
        shippingStatus: payment.shippingStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Simulate Doorstep Cash Collection (COD Delivery)
const simulateCODDelivery = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return next(new AppError("Payment ID is required", 400));
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return next(new AppError("Payment record not found", 404));
    }

    if (payment.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "COD payment already completed.",
      });
    }

    // Complete payment and upgrade user
    payment.status = "completed";
    await payment.save();

    const user = await User.findByIdAndUpdate(
      payment.user,
      { isPremium: true },
      { new: true }
    );

    logger.info(`User upgraded to Premium via COD Doorstep Cash: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "COD Cash collection simulated successfully.",
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// Simulate Card Payment (for fallback testing when Stripe is not configured)
const simulateCardPayment = async (req, res, next) => {
  try {
    const { deliveryAddress } = req.body;

    const payment = await Payment.create({
      user: req.user._id,
      method: "stripe",
      status: "completed",
      amount: 19.99,
      stripeSessionId: `mock-session-${Date.now()}`,
      deliveryAddress,
    });

    // Assign courier partner for simulated card payment if address is present
    if (deliveryAddress) {
      const shippingDetails = await createShippingOrder(payment, req.user);
      payment.shipmentId = shippingDetails.shipmentId;
      payment.courierPartner = shippingDetails.courierPartner;
      payment.trackingId = shippingDetails.trackingId;
      payment.trackingUrl = shippingDetails.trackingUrl;
      payment.shippingStatus = "processing";
      await payment.save();
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isPremium: true },
      { new: true }
    );

    logger.info(`User upgraded to Premium via Card Simulation: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Card payment simulated successfully.",
      user: user.toSafeObject(),
      shipping: payment && payment.deliveryAddress ? {
        courierPartner: payment.courierPartner,
        trackingId: payment.trackingId,
        trackingUrl: payment.trackingUrl,
        shippingStatus: payment.shippingStatus,
      } : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// Process direct UPI QR scan payment
const completeUPIQRPayment = async (req, res, next) => {
  try {
    const payment = await Payment.create({
      user: req.user._id,
      method: "upi",
      status: "completed",
      amount: 19.99,
      upiId: "QR-Scan-Direct",
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isPremium: true },
      { new: true }
    );

    logger.info(`User upgraded to Premium via direct QR Code Scan: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "UPI QR payment processed and VIP activated.",
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// Stripe Webhook Handler (Production Ready)
const handleWebhook = async (req, res, next) => {
  let event;
  try {
    const stripe = getStripe();
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return next(new AppError("Stripe Webhook Secret not configured", 400));
    }

    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    logger.error(`Stripe Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      // Find matching payment record
      const payment = await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: "completed" },
        { new: true }
      );

      // Upgrade user
      const userId = session.metadata.userId;
      const user = await User.findByIdAndUpdate(
        userId,
        { isPremium: true },
        { new: true }
      );

      logger.info(`Stripe Webhook upgraded user: ${user?.email}`);

      // Dispatch shipping order if a delivery address is specified
      if (payment && payment.deliveryAddress && payment.shippingStatus === "unshipped") {
        const shippingDetails = await createShippingOrder(payment, user);
        payment.shipmentId = shippingDetails.shipmentId;
        payment.courierPartner = shippingDetails.courierPartner;
        payment.trackingId = shippingDetails.trackingId;
        payment.trackingUrl = shippingDetails.trackingUrl;
        payment.shippingStatus = "processing";
        await payment.save();
        logger.info(`Stripe Webhook dispatched shipment for user: ${user?.email}`);
      }
    } catch (dbErr) {
      logger.error(`Webhook database update error: ${dbErr.message}`);
      return res.status(500).send(`Database error: ${dbErr.message}`);
    }
  }

  res.json({ received: true });
};

module.exports = {
  createCheckoutSession,
  verifySession,
  createUPIPayment,
  verifyUPIPayment,
  createCODPayment,
  simulateCODDelivery,
  simulateCardPayment,
  completeUPIQRPayment,
  handleWebhook,
};
