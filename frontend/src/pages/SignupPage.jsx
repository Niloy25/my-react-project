import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";

// Zod Schema
const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),

  email: z.string().trim().email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password needs an uppercase letter")
    .regex(/[0-9]/, "Password needs a number")
    .regex(/[!@#$%^&*]/, "Password needs a special character (!@#$%^&*)")
    .max(128, "Password is too long"),
});

// Keep the password strength helper
const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;
  if (password.length >= 12) score++;
  return score;
};

const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
const strengthColor = [
  "",
  "bg-red-500",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-500",
  "bg-green-600",
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const passwordValue = watch("password");
  const strength = getPasswordStrength(passwordValue || "");

  const handleSocialLogin = (provider) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  const mutation = useMutation({
    mutationFn: (formData) =>
      signup(formData.name.trim(), formData.email.trim(), formData.password),

    onSuccess: (resData) => {
      toast.success("Verification OTP sent to your email!");
      navigate(`/verify-email?email=${encodeURIComponent(resData.email)}`);
    },

    onError: (err) => {
      const msg = err.response?.data?.message || "Signup failed. Try again.";
      const apiErrors = err.response?.data?.errors;

      if (apiErrors) {
        apiErrors.forEach(({ field, message }) => {
          // You can still manually set errors from API if needed
          // (Zod errors are already handled by the form)
        });
      } else {
        toast.error(msg);
      }
    },
  });

  const onSubmit = async (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#070a13] via-[#0e1329] to-[#05060b] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[#110e2c]/40 backdrop-blur-xl rounded-3xl border border-white/[0.06] shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="text-sm text-gray-400 mt-1">
              Start your journey today
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register("name")}
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password */}
            <div className="space-y-2">
              <Input
                label="Password"
                type={showPass ? "text" : "password"}
                placeholder="Min 8 chars, uppercase, number, symbol"
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

              {/* Password strength bar */}
              {passwordValue && (
                <div className="mt-2 text-left">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength
                            ? strengthColor[strength]
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-xs mt-1 font-medium ${
                      strength <= 2
                        ? "text-red-400"
                        : strength <= 3
                          ? "text-yellow-500"
                          : "text-green-400"
                    }`}
                  >
                    {strengthLabel[strength]}
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={isSubmitting || mutation.isPending}
              className="mt-2 w-full"
            >
              {isSubmitting || mutation.isPending ? "Creating account..." : "Create Account"}
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
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-400 hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
