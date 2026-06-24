import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import api, { setAccessToken, clearAccessToken } from "../utils/axios";

// ── Initial state ─────────────────────────────────────────
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // true on first load while we check session
};

// ── Reducer ───────────────────────────────────────────────
const authReducer = (state, action) => {
  switch (action.type) {
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "AUTH_LOADING":
      return { ...state, isLoading: true };
    case "AUTH_STOP_LOADING":
      return { ...state, isLoading: false };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

// ── Context ───────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On app load — try to restore session using refresh token cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await api.post("/auth/refresh");
        setAccessToken(data.accessToken);

        const meRes = await api.get("/users/me");
        dispatch({ type: "AUTH_SUCCESS", payload: { user: meRes.data.user } });
      } catch {
        // No valid session — user needs to log in
        dispatch({ type: "AUTH_STOP_LOADING" });
      }
    };
    restoreSession();
  }, []);

  // ── Actions ───────────────────────────────────────────
  const signup = useCallback(async (name, email, password) => {
    const { data } = await api.post("/auth/signup", { name, email, password });
    setAccessToken(data.accessToken);
    dispatch({ type: "AUTH_SUCCESS", payload: { user: data.user } });
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setAccessToken(data.accessToken);
    dispatch({ type: "AUTH_SUCCESS", payload: { user: data.user } });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if server call fails, clear local state
    } finally {
      clearAccessToken();
      dispatch({ type: "AUTH_LOGOUT" });
    }
  }, []);

  const updateUser = useCallback((updates) => {
    dispatch({ type: "UPDATE_USER", payload: updates });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, signup, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

export default AuthContext;
