const express = require("express");
const { body } = require("express-validator");

const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  getMe,
  updateMe,
  deleteMe,
  changePassword,
  getAllUsers,
} = require("../controllers/userController");

const router = express.Router();

// ── Validation Rules ───────────────────────────────────────
const updateMeRules = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2–50 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
];

const changePasswordRules = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Minimum 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Must contain a number")
    .matches(/[!@#$%^&*]/)
    .withMessage("Must contain a special character"),
];

// ── Apply protect to ALL routes in this file ───────────────
router.use(protect);

// ── Routes ─────────────────────────────────────────────────
router.get("/me", getMe);
router.put("/me", updateMeRules, validate, updateMe);
router.delete("/me", deleteMe);
router.put("/change-password", changePasswordRules, validate, changePassword);
router.get("/", authorize("admin"), getAllUsers);

module.exports = router;
