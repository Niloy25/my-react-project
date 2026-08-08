// src/store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { setAccessToken, getAccessToken, clearAccessToken } from "../utils/axios";

// ── Async Thunks (replaces login/signup/logout functions from AuthContext) ──

export const signup = createAsyncThunk(
  "auth/signup",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/signup", {
        name,
        email,
        password,
      });
      if (data.accessToken) {
        setAccessToken(data.accessToken);
      }
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Signup failed" },
      );
    }
  },
);

export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp });
      if (data.accessToken) {
        setAccessToken(data.accessToken);
      }
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Verification failed" },
      );
    }
  },
);

export const resendOTP = createAsyncThunk(
  "auth/resendOTP",
  async ({ email }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/resend-otp", { email });
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to resend OTP" },
      );
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAccessToken(data.accessToken);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Login failed" });
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      return rejectWithValue(err.response?.data);
    } finally {
      clearAccessToken();
    }
  },
);

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      // If we don't have an access token in memory, try to get one using refresh token cookie
      if (!getAccessToken()) {
        const { data: refreshData } = await api.post("/auth/refresh");
        setAccessToken(refreshData.accessToken);
      }

      // Fetch user profile
      const { data: meData } = await api.get("/users/me");
      return meData.user;
    } catch (err) {
      clearAccessToken();
      return rejectWithValue(err.response?.data);
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: true, // true on first load while restoring session
    error: null,
  },

  reducers: {
    // Update user fields without re-login (e.g. after profile update)
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // ── Signup ──────────────────────────────────────────────
    builder
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.accessToken) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Signup failed";
      });

    // ── Verify OTP ──────────────────────────────────────────
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Verification failed";
      });

    // ── Login ───────────────────────────────────────────────
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Login failed";
      });

    // ── Logout ──────────────────────────────────────────────
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        // Clear state even if server call failed
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });

    // ── Restore Session ─────────────────────────────────────
    builder
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { updateUser, clearError } = authSlice.actions;

// ── Selectors ─────────────────────────────────────────────
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
