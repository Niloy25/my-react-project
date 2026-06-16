const User = require("../models/User");
const logger = require("../config/logger");
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} = require("../utils/generateTokens");
const jwt = require("jsonwebtoken");

// ─────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
// ─────────────────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Create user — password hashed automatically by pre-save hook
    const user = await User.create({ name, email, password });

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to DB (supports multiple devices)
    user.refreshTokens.push({ token: refreshToken });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Set refresh token in httpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      accessToken,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (it has select:false on the model)
    const user = await User.findOne({ email, isActive: true }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare submitted password with hashed password in DB
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Keep only last 5 refresh tokens (clean up old devices)
    user.refreshTokens.push({ token: refreshToken });
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // Remove this specific refresh token from DB
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { refreshTokens: { token } },
      });
    }

    // Clear the cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Refresh access token using refresh token cookie
// @route   POST /api/auth/refresh
// @access  Public (uses cookie)
// ─────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    // Verify refresh token signature
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Check this token exists in DB (prevents reuse after logout)
    const user = await User.findOne({
      _id: decoded.id,
      "refreshTokens.token": token,
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not recognised",
      });
    }

    // Issue a fresh access token
    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, logout, refreshToken };
