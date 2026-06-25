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

  const mutation = useMutation({
    mutationFn: ({ email, password }) => login(email.trim(), password),

    onSuccess: () => {
      toast.success("Welcome back!");
      navigate("/dashboard");
    },

    onError: (err) => {
      const msg = err.response?.data?.message || "Login failed. Try again.";

      if (err.response?.status === 401) {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">
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
                  className="text-gray-400 hover:text-gray-600 text-xs font-medium focus:outline-none"
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

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary-600 hover:underline font-medium"
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
