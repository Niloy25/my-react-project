
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { setAccessToken } from "../utils/axios";
import toast from "react-hot-toast";

let lastProcessedToken = null;

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { restoreSession } = useAuth();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("SSO Login failed. Missing access token.", { id: "oauth-error" });
      navigate("/login");
      return;
    }

    // Prevent double execution in React Strict Mode
    if (token === lastProcessedToken) return;
    lastProcessedToken = token;

    const handleOAuthSuccess = async () => {
      try {
        // Save the access token
        setAccessToken(token);

        // Fetch user data and update Redux auth state
        await restoreSession().unwrap();

        toast.success("Welcome back 🎉", { id: "oauth-success" });
        navigate("/dashboard");
      } catch (err) {
        toast.error("Failed to restore session. Please try logging in again.", { id: "oauth-error" });
        navigate("/login");
      }
    };

    handleOAuthSuccess();
  }, [token, navigate, restoreSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Verifying session...</h2>
        <p className="text-sm text-gray-400 mt-1">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;
