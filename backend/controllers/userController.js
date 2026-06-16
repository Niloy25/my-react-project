const User = require("../models/User");
const AppError = require("../utils/AppError");
const logger = require("../config/logger");

// ── Get own profile ───────────────────────────────────────
// GET /api/users/me (Private)
const getMe = async (req, res, next) => {
  try {
    // req.user already attached by protect middleware
    res.status(200).json({
      success: true,
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ── Update own profile ────────────────────────────────────
// PUT /api/users/me (Private)
const updateMe = async (req, res, next) => {
  try {
    if (req.body.password) {
      return next(
        new AppError(
          "Use /api/users/change-password to update your password",
          400,
        ),
      );
    }
    if (req.body.role) {
      return next(new AppError("You cannot change your own role", 400));
    }

    // Whitelist prevents mass-assignment attacks
    const allowedFields = ["name", "email", "profilePicture"];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    if (Object.keys(updateData).length === 0) {
      return next(new AppError("No valid fields provided to update", 400));
    }

    if (updateData.email && updateData.email !== req.user.email) {
      const existing = await User.findOne({ email: updateData.email });
      if (existing) return next(new AppError("Email is already in use", 409));
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    logger.info(`User updated profile: ${updatedUser.email}`);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ── Soft-delete own account ───────────────────────────────
// DELETE /api/users/me  (Private)
const deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
      refreshTokens: [],
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    logger.info(`User deactivated account: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ── Change password ───────────────────────────────────────
// PUT /api/users/change-password  (Private)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError("Current password is incorrect", 401));
    }

    if (currentPassword === newPassword) {
      return next(
        new AppError(
          "New password must be different from current password",
          400,
        ),
      );
    }

    user.password = newPassword; // pre-save hook hashes it automatically
    user.refreshTokens = []; // invalidate ALL sessions on all devices
    await user.save();

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    logger.info(`User changed password: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};

// ── Get all users — admin only ────────────────────────────
// GET /api/users  (Private / Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ isActive: true })
        .select("-refreshTokens -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMe, updateMe, deleteMe, changePassword, getAllUsers };
