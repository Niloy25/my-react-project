import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const mockOtp = searchParams.get("mockOtp") || "";
  const navigate = useNavigate();
  const { verifyOTP, resendOTP } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Redirect if no email is provided
  useEffect(() => {
    if (!email) {
      toast.error("Invalid email verification link");
      navigate("/signup");
    }
  }, [email, navigate]);

  // Auto-fill mock OTP in development mode
  useEffect(() => {
    if (mockOtp && /^\d{6}$/.test(mockOtp)) {
      setOtp(mockOtp.split(""));
      toast.info(`[Dev Mode] Automatically filled verification code: ${mockOtp}`, {
        duration: 10000,
        id: "mock-otp-fill",
      });
    }
  }, [mockOtp]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return; // Allow numbers only

    const newOtp = [...otp];
    // Keep only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace back-focus
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) {
      toast.error("Please paste a valid 6-digit code");
      return;
    }

    const pastedDigits = pastedData.split("");
    setOtp(pastedDigits);
    inputRefs.current[5].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOTP(email, otpCode);
      toast.success("Email verified successfully! Welcome 🎉");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Invalid OTP code";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      const resData = await resendOTP(email);
      toast.success("Verification code resent to your email");
      if (resData?.mockOtp) {
        setOtp(resData.mockOtp.split(""));
        toast.info(`[Dev Mode] Automatically filled verification code: ${resData.mockOtp}`, {
          duration: 10000,
          id: "mock-otp-fill",
        });
      } else {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0].focus();
      }
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to resend code";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#070a13] via-[#0e1329] to-[#05060b] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[#110e2c]/40 backdrop-blur-xl rounded-3xl border border-white/[0.06] shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-400">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 19v-8.93a2 2 0 01.89-1.664l8-4.8a2 2 0 012.22 0l8 4.8A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Verify email address</h1>
          <p className="text-sm text-gray-405 mb-6">
            We sent a 6-digit verification code to <br />
            <span className="font-semibold text-gray-300">{email}</span>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 justify-center mb-8" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-xl font-bold border border-white/10 rounded-xl bg-white/[0.04] text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                />
              ))}
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full mb-6"
            >
              Verify Code
            </Button>
          </form>

          <div className="text-sm text-gray-400">
            Didn't receive the email?{" "}
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-primary-400 hover:underline font-semibold"
              >
                Resend code
              </button>
            ) : (
              <span className="text-gray-500 font-medium">
                Resend code in {resendTimer}s
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
