const User = require("../models/User");
const logger = require("../config/logger");
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} = require("../utils/generateTokens");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

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
      if (!existingUser.isVerified) {
        // Generate new OTP, update expiry, resend
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.verificationOTP = otp;
        existingUser.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
        
        if (password) {
          existingUser.password = password; 
        }
        if (name) {
          existingUser.name = name;
        }

        await existingUser.save();
        
        const emailSent = await sendEmail({
          to: existingUser.email,
          subject: "Verify your email - OTP Code",
          text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
          html: `<h3>Email Verification</h3><p>Your OTP code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
        });

        logger.info(`Resent OTP to unverified existing user: ${existingUser.email}`);

        const responseData = {
          success: true,
          message: "Email is already registered but unverified. A new verification OTP has been sent.",
          email: existingUser.email,
          isVerified: false,
        };

        const hasSMTPConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
        if ((!hasSMTPConfig || !emailSent) && process.env.NODE_ENV === "development") {
          responseData.mockOtp = otp;
        }

        return res.status(200).json(responseData);
      }

      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with isVerified: false and OTP fields
    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verificationOTP: otp,
      verificationOTPExpires: otpExpires,
    });

    // Send verification email
    const emailSent = await sendEmail({
      to: user.email,
      subject: "Verify your email - OTP Code",
      text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
      html: `<h3>Email Verification</h3><p>Your OTP code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
    });

    logger.info(`New user registered (unverified): ${user.email}`);

    const responseData = {
      success: true,
      message: "Account registered successfully. Please verify your email using the OTP sent.",
      email: user.email,
      isVerified: false,
    };

    const hasSMTPConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    if ((!hasSMTPConfig || !emailSent) && process.env.NODE_ENV === "development") {
      responseData.mockOtp = otp;
    }

    res.status(201).json(responseData);
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

    // Check if email is verified
    if (!user.isVerified) {
      // Auto-resend OTP for convenience
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOTP = otp;
      user.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      const emailSent = await sendEmail({
        to: user.email,
        subject: "Verify your email - OTP Code",
        text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
        html: `<h3>Email Verification</h3><p>Your OTP code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
      });

      const responseData = {
        success: false,
        message: "Email is not verified. A verification OTP has been sent to your email.",
        isVerified: false,
        email: user.email,
      };

      const hasSMTPConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
      if ((!hasSMTPConfig || !emailSent) && process.env.NODE_ENV === "development") {
        responseData.mockOtp = otp;
      }

      return res.status(403).json(responseData);
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
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
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

// ─────────────────────────────────────────────────────────
// @desc    Verify OTP code sent to email
// @route   POST /api/auth/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP code are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account is already verified. Please log in.",
      });
    }

    const isMockOtp = process.env.NODE_ENV === "development" && (otp === "123456" || otp === "000000");

    // Check if OTP matches and has not expired
    if (!isMockOtp && (!user.verificationOTP || user.verificationOTP !== otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    if (!isMockOtp && new Date() > user.verificationOTPExpires) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one.",
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationOTPExpires = null;

    // Log the user in immediately
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push({ token: refreshToken });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    logger.info(`User email verified and logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      accessToken,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Resend OTP code
// @route   POST /api/auth/resend-otp
// @access  Public
// ─────────────────────────────────────────────────────────
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account is already verified. Please log in.",
      });
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationOTP = otp;
    user.verificationOTPExpires = otpExpires;
    await user.save({ validateBeforeSave: false });

    const emailSent = await sendEmail({
      to: user.email,
      subject: "Verify your email - OTP Code",
      text: `Your new verification code is ${otp}. It will expire in 10 minutes.`,
      html: `<h3>Email Verification</h3><p>Your new OTP code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
    });

    logger.info(`Resent OTP code to user: ${user.email}`);

    const responseData = {
      success: true,
      message: "A new verification code has been sent to your email.",
    };

    const hasSMTPConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    if ((!hasSMTPConfig || !emailSent) && process.env.NODE_ENV === "development") {
      responseData.mockOtp = otp;
    }

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// Helper: Check if OAuth client details are placeholders
const isPlaceholder = (val) => !val || val.startsWith("your_") || val.includes("placeholder");

// Helper: Determine origin client URL dynamically based on request referer or ENV fallback
const getClientUrl = (req) => {
  const referer = req.headers.referer;
  if (referer) {
    try {
      const url = new URL(referer);
      // In dev, allow any localhost. In prod, strict match env setting
      if (process.env.NODE_ENV === "development" || url.origin === process.env.CLIENT_URL) {
        return url.origin;
      }
    } catch (e) {
      // Ignore
    }
  }
  return process.env.CLIENT_URL || "http://localhost:3000";
};

// ─────────────────────────────────────────────────────────
// @desc    Redirect to Google OAuth consent screen
// @route   GET /api/auth/google
// @access  Public
// ─────────────────────────────────────────────────────────
const googleLogin = (req, res) => {
  const isMock = isPlaceholder(process.env.GOOGLE_CLIENT_ID);
  const clientUrl = getClientUrl(req);
  
  if (isMock) {
    logger.warn("Google OAuth credentials are not configured. Running in Mock bypass mode.");
    const callbackUrl = `${req.protocol}://${req.get("host")}/api/auth/google/callback?code=mock_google_code&state=${encodeURIComponent(clientUrl)}`;
    return res.redirect(callbackUrl);
  }

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const callbackUrl = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
  const options = {
    redirect_uri: callbackUrl,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    state: clientUrl,
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };
  const qs = new URLSearchParams(options).toString();
  res.redirect(`${rootUrl}?${qs}`);
};

// ─────────────────────────────────────────────────────────
// @desc    Google OAuth Callback
// @route   GET /api/auth/google/callback
// @access  Public
// ─────────────────────────────────────────────────────────
const googleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    // Resolve dynamic client redirect URL safely
    let clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    if (state) {
      try {
        const parsedState = new URL(state);
        if (process.env.NODE_ENV === "development" || parsedState.origin === new URL(clientUrl).origin) {
          clientUrl = parsedState.origin;
        }
      } catch (e) {
        // Ignore
      }
    }

    if (!code) {
      return res.redirect(`${clientUrl}/login?error=Google authentication failed`);
    }

    let googleUser = {};

    const isMock = isPlaceholder(process.env.GOOGLE_CLIENT_ID) || code === "mock_google_code";

    if (isMock) {
      googleUser = {
        id: "mock_google_id_123456",
        email: "mock.google.user@example.com",
        name: "Mock Google User",
        picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      };
    } else {
      const callbackUrl = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
      // 1. Exchange authorization code for access token
      const tokenUrl = "https://oauth2.googleapis.com/token";
      const tokenParams = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      };

      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(tokenParams).toString(),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        logger.error(`Google token exchange error: ${JSON.stringify(tokenData)}`);
        return res.redirect(`${clientUrl}/login?error=Google token exchange failed`);
      }

      // 2. Fetch user profile with access token
      const profileUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
      const profileRes = await fetch(profileUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      googleUser = await profileRes.json();
      if (!profileRes.ok || !googleUser.email) {
        logger.error(`Google userinfo fetch error: ${JSON.stringify(googleUser)}`);
        return res.redirect(`${clientUrl}/login?error=Google user info fetch failed`);
      }
    }

    // 3. Find or create user
    let user = await User.findOne({
      $or: [{ googleId: googleUser.id }, { email: googleUser.email.toLowerCase() }],
    });

    if (user) {
      // Connect Google account if signed up originally with email
      if (!user.googleId) {
        user.googleId = googleUser.id;
      }
      // Social login emails are auto-verified
      if (!user.isVerified) {
        user.isVerified = true;
      }
      if (!user.profilePicture && googleUser.picture) {
        user.profilePicture = googleUser.picture;
      }
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.id,
        isVerified: true,
        profilePicture: googleUser.picture || "",
      });
    }

    // 4. Log user in (Generate tokens, set cookie)
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push({ token: refreshToken });
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    logger.info(`User logged in via Google SSO: ${user.email}`);

    // Redirect to frontend OAuthSuccess route
    res.redirect(`${clientUrl}/oauth-success?token=${accessToken}`);
  } catch (error) {
    logger.error(`Google OAuth Callback error: ${error.message}`);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Redirect to Facebook OAuth screen
// @route   GET /api/auth/facebook
// @access  Public
// ─────────────────────────────────────────────────────────
const facebookLogin = (req, res) => {
  const isMock = isPlaceholder(process.env.FACEBOOK_APP_ID);
  const clientUrl = getClientUrl(req);

  if (isMock) {
    logger.warn("Facebook App credentials are not configured. Running in Mock bypass mode.");
    const callbackUrl = `${req.protocol}://${req.get("host")}/api/auth/facebook/callback?code=mock_facebook_code&state=${encodeURIComponent(clientUrl)}`;
    return res.redirect(callbackUrl);
  }

  const rootUrl = "https://www.facebook.com/v20.0/dialog/oauth";
  const callbackUrl = `${req.protocol}://${req.get("host")}/api/auth/facebook/callback`;
  const options = {
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: callbackUrl,
    scope: "email,public_profile",
    response_type: "code",
    state: clientUrl,
  };
  const qs = new URLSearchParams(options).toString();
  res.redirect(`${rootUrl}?${qs}`);
};

// ─────────────────────────────────────────────────────────
// @desc    Facebook OAuth Callback
// @route   GET /api/auth/facebook/callback
// @access  Public
// ─────────────────────────────────────────────────────────
const facebookCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    // Resolve dynamic client redirect URL safely
    let clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    if (state) {
      try {
        const parsedState = new URL(state);
        if (process.env.NODE_ENV === "development" || parsedState.origin === new URL(clientUrl).origin) {
          clientUrl = parsedState.origin;
        }
      } catch (e) {
        // Ignore
      }
    }

    if (!code) {
      return res.redirect(`${clientUrl}/login?error=Facebook authentication failed`);
    }

    let facebookUser = {};

    const isMock = isPlaceholder(process.env.FACEBOOK_APP_ID) || code === "mock_facebook_code";

    if (isMock) {
      facebookUser = {
        id: "mock_facebook_id_123456",
        email: "mock.facebook.user@example.com",
        name: "Mock Facebook User",
        picture: { data: { url: "https://graph.facebook.com/123456/picture?type=normal" } },
      };
    } else {
      const callbackUrl = `${req.protocol}://${req.get("host")}/api/auth/facebook/callback`;
      // 1. Exchange code for access token
      const tokenUrl = "https://graph.facebook.com/v20.0/oauth/access_token";
      const tokenParams = {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: callbackUrl,
        code,
      };

      const tokenRes = await fetch(`${tokenUrl}?${new URLSearchParams(tokenParams).toString()}`);
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        logger.error(`Facebook token exchange error: ${JSON.stringify(tokenData)}`);
        return res.redirect(`${clientUrl}/login?error=Facebook token exchange failed`);
      }

      // 2. Fetch user profile info
      const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`;
      const profileRes = await fetch(profileUrl);
      facebookUser = await profileRes.json();

      if (!profileRes.ok || !facebookUser.email) {
        logger.error(`Facebook user info fetch error: ${JSON.stringify(facebookUser)}`);
        return res.redirect(`${clientUrl}/login?error=Facebook user info fetch failed`);
      }
    }

    // 3. Find or create user
    let user = await User.findOne({
      $or: [{ facebookId: facebookUser.id }, { email: facebookUser.email.toLowerCase() }],
    });

    const pictureUrl = facebookUser.picture?.data?.url || "";

    if (user) {
      if (!user.facebookId) {
        user.facebookId = facebookUser.id;
      }
      if (!user.isVerified) {
        user.isVerified = true;
      }
      if (!user.profilePicture && pictureUrl) {
        user.profilePicture = pictureUrl;
      }
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      user = await User.create({
        name: facebookUser.name,
        email: facebookUser.email,
        facebookId: facebookUser.id,
        isVerified: true,
        profilePicture: pictureUrl,
      });
    }

    // 4. Log user in
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push({ token: refreshToken });
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    logger.info(`User logged in via Facebook SSO: ${user.email}`);

    res.redirect(`${clientUrl}/oauth-success?token=${accessToken}`);
  } catch (error) {
    logger.error(`Facebook OAuth Callback error: ${error.message}`);
    next(error);
  }
};

module.exports = {
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
};
