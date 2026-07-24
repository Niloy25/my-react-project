const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");

const {
  signup,
  login,
  logout,
  refreshToken,
  verifyOTP,
  resendOTP,
  googleLogin,
  googleCallback,
  facebookLogin,
  facebookCallback,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

// ── Rate limiters ──────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many accounts created from this IP. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many token refresh requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Validation rules ───────────────────────────────────────────────────────
const signupRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2–50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number")
    .matches(/[!@#$%^&*]/)
    .withMessage("Password must contain a special character (!@#$%^&*)"),
];

const loginRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

const verifyOtpRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP code must be 6 digits")
    .isNumeric()
    .withMessage("OTP code must contain only numbers"),
];

const resendOtpRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
];

// ── Routes ─────────────────────────────────────────────────────────────────
// POST /api/auth/signup
router.post("/signup", signupLimiter, signupRules, validate, signup);

// POST /api/auth/login
router.post("/login", loginLimiter, loginRules, validate, login);

// POST /api/auth/verify-otp
router.post("/verify-otp", verifyOtpLimiter, verifyOtpRules, validate, verifyOTP);

// POST /api/auth/resend-otp
router.post("/resend-otp", resendOtpLimiter, resendOtpRules, validate, resendOTP);

// GET /api/auth/google -> Redirects to Google consent screen
router.get("/google", googleLogin);

// GET /api/auth/google/callback -> Google returns token success
router.get("/google/callback", googleCallback);

// GET /api/auth/facebook -> Redirects to Facebook consent screen
router.get("/facebook", facebookLogin);

// GET /api/auth/facebook/callback -> Facebook returns token success
router.get("/facebook/callback", facebookCallback);

// POST /api/auth/logout  (protected — must be logged in to logout)
router.post("/logout", protect, logout);

// POST /api/auth/refresh
router.post("/refresh", refreshLimiter, refreshToken);

module.exports = router;
