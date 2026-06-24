import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// Password strength checker
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
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const passwordValue = watch("password");
  const strength = getPasswordStrength(passwordValue || "");

  const validateForm = (data) => {
    const validationErrors = {};

    if (!data.name.trim() || data.name.length < 2) {
      validationErrors.name = "Name must be at least 2 characters";
    }

    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
      validationErrors.email = "Please enter a valid email";
    }

    if (!data.password || data.password.length < 8) {
      validationErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(data.password)) {
      validationErrors.password = "Password needs an uppercase letter";
    } else if (!/[0-9]/.test(data.password)) {
      validationErrors.password = "Password needs a number";
    } else if (!/[!@#$%^&*]/.test(data.password)) {
      validationErrors.password =
        "Password needs a special character (!@#$%^&*)";
    }

    return validationErrors;
  };

  const mutation = useMutation({
    mutationFn: (formData) =>
      signup(formData.name.trim(), formData.email.trim(), formData.password),

    onSuccess: () => {
      toast.success("Account created! Welcome 🎉");
      navigate("/dashboard");
    },

    onError: (err) => {
      const msg = err.response?.data?.message || "Signup failed. Try again.";
      const apiErrors = err.response?.data?.errors;

      if (apiErrors) {
        apiErrors.forEach(({ field, message }) => {
          setError(field, { type: "manual", message });
        });
      } else {
        toast.error(msg);
      }
    },
  });

  const onSubmit = async (data) => {
    const validationErrors = validateForm(data);

    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, message]) => {
        setError(field, { type: "manual", message });
      });
      return;
    }

    clearErrors();
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
            <p className="text-sm text-gray-500 mt-1">
              Start your journey today
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="John Doe"
                className={`input ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="john@example.com"
                className={`input ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  {...register("password")}
                  placeholder="Min 8 chars, uppercase, number, symbol"
                  className={`input pr-10 ${errors.password ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>

              {/* Password strength bar */}
              {passwordValue && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength
                            ? strengthColor[strength]
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-xs mt-1 font-medium ${
                      strength <= 2
                        ? "text-red-500"
                        : strength <= 3
                          ? "text-yellow-600"
                          : "text-green-600"
                    }`}
                  >
                    {strengthLabel[strength]}
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="btn-primary mt-2 w-full"
            >
              {isSubmitting || mutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-600 hover:underline font-medium"
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
