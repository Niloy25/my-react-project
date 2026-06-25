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
                    className="text-gray-400 hover:text-gray-600 text-xs font-medium focus:outline-none"
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
