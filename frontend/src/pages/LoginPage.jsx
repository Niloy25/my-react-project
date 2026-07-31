import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const handleSocialLogin = (provider) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  const mutation = useMutation({
    mutationFn: ({ email, password }) => login(email.trim(), password),

    onSuccess: () => {
      toast.success("Welcome back!");
      navigate("/dashboard");
    },

    onError: (err) => {
      const msg = err.response?.data?.message || "Login failed. Try again.";

      if (err.response?.status === 403 && err.response?.data?.isVerified === false) {
        toast.error(msg);
        const mockOtp = err.response.data.mockOtp;
        const otpQuery = mockOtp ? `&mockOtp=${mockOtp}` : "";
        navigate(`/verify-email?email=${encodeURIComponent(err.response.data.email)}${otpQuery}`);
      } else if (err.response?.status === 401) {
        setError("password", {
          type: "manual",
          message: "Invalid email or password",
        });
      } else if (err.response?.status === 429) {
        toast.error("Too many attempts. Try again in 15 minutes.");
      } else {
        toast.error(msg);
      }
    },
  });

  const onSubmit = async (data) => {
    const validationErrors = {};

    if (!data.email) validationErrors.email = "Email is required";
    if (!data.password) validationErrors.password = "Password is required";

    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, message]) => {
        setError(field, { type: "manual", message });
      });
      return;
    }

    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#070a13] via-[#0e1329] to-[#05060b] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[#110e2c]/40 backdrop-blur-xl rounded-3xl border border-white/[0.06] shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-gray-400 mt-1">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password */}
            <Input
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="Your password"
              error={errors.password?.message}
              {...register("password")}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-gray-400 hover:text-gray-200 text-xs font-medium focus:outline-none"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              }
            />

            {/* Submit */}
            <Button
              type="submit"
              isLoading={isSubmitting || mutation.isPending}
              className="mt-2 w-full"
            >
              {isSubmitting || mutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#131031] px-3 py-0.5 rounded-full text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-white/10 rounded-xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-all font-medium text-sm text-gray-200 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.093-5.136 4.093-3.324 0-6.027-2.702-6.027-6.027s2.703-6.027 6.027-6.027c1.554 0 2.96.592 4.027 1.556l3.056-3.056C19.098 2.998 15.845 2 12.24 2 6.643 2 2 6.643 2 12.24s4.643 10.24 10.24 10.24c5.795 0 10.24-4.11 10.24-10.24 0-.685-.082-1.339-.24-1.955H12.24z"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin("facebook")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-white/10 rounded-xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-all font-medium text-sm text-gray-200 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#1877F2"
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
              Facebook
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary-400 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
