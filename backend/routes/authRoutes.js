const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");

const {
  signup,
  login,
  logout,
  refreshToken,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

// ── Rate limiters ──────────────────────────────────────────────────────────
// Login: max 5 attempts per 15 minutes per IP
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

// Signup: max 10 accounts per hour per IP
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

// ── Routes ─────────────────────────────────────────────────────────────────
// POST /api/auth/signup
router.post("/signup", signupLimiter, signupRules, validate, signup);

// POST /api/auth/login
router.post("/login", loginLimiter, loginRules, validate, login);

// POST /api/auth/logout  (protected — must be logged in to logout)
router.post("/logout", protect, logout);

// POST /api/auth/refresh
router.post("/refresh", refreshToken);

module.exports = router;
