const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Generate a short-lived JWT access token (15 minutes)
 * Sent in response body — stored in memory on the frontend
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
};

/**
 * Generate a long-lived refresh token (7 days)
 * Stored in httpOnly cookie + saved in DB (allows multi-device logout)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

/**
 * Set the refresh token as a secure httpOnly cookie.
 * httpOnly = JS cannot read it (XSS protection)
 * sameSite = CSRF protection
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
};
