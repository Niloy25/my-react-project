import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/axios";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Smartphone,
  Truck,
  ShieldCheck,
  ArrowRight,
  QrCode,
  Camera,
  RefreshCw,
  Scan,
} from "lucide-react";
import toast from "react-hot-toast";

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const sessionId = searchParams.get("session_id");
  const paymentId = searchParams.get("payment_id");
  const method = searchParams.get("method") || "stripe";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [codAddress, setCodAddress] = useState("");

  // UPI Mode & Scanner States
  const [upiMode, setUpiMode] = useState("collect"); // "collect" (push) or "qr" (scan QR)
  const [qrScanning, setQrScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Confetti particles generator for premium effect
  const [confetti, setConfetti] = useState([]);
  const generateConfetti = () => {
    const newConfetti = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + "%",
      delay: Math.random() * 3 + "s",
      duration: Math.random() * 2 + 2 + "s",
      size: Math.random() * 8 + 4 + "px",
      color: ["#FBBF24", "#F472B6", "#60A5FA", "#34D399", "#A78BFA"][Math.floor(Math.random() * 5)],
    }));
    setConfetti(newConfetti);
  };

  // ── React Query Verification checks ───────────────────────
  const isStripe = method === "stripe";
  const isSimulatedStripe = isStripe && (sessionId?.startsWith("mock-session-") || searchParams.get("simulated") === "true");
  const shouldVerifyStripe = isStripe && sessionId && !isSimulatedStripe;

  const stripeVerifyQuery = useQuery({
    queryKey: ["stripeVerify", sessionId],
    queryFn: async () => {
      const response = await api.post("/payments/verify-session", { sessionId });
      return response.data;
    },
    enabled: !!shouldVerifyStripe,
    retry: 1,
  });

  useEffect(() => {
    if (isSimulatedStripe) {
      updateUser({ isPremium: true });
      setSuccess(true);
      generateConfetti();
      setLoading(false);
    }
  }, [isSimulatedStripe]);

  useEffect(() => {
    if (stripeVerifyQuery.isSuccess && stripeVerifyQuery.data?.success) {
      updateUser({ isPremium: true });
      setSuccess(true);
      generateConfetti();
      toast.success("Lifetime VIP Premium membership activated!");
      setLoading(false);
    } else if (stripeVerifyQuery.isError) {
      setError(stripeVerifyQuery.error?.response?.data?.message || "Failed to verify transaction status.");
      setLoading(false);
    } else if (stripeVerifyQuery.isLoading && shouldVerifyStripe) {
      setLoading(true);
    } else {
      // For UPI & COD payment pages
      if (method === "upi" || method === "cod") {
        const address = searchParams.get("address") || "your registered address";
        setCodAddress(address);
        setLoading(false);
      }
    }
  }, [stripeVerifyQuery.isSuccess, stripeVerifyQuery.isError, stripeVerifyQuery.isLoading, stripeVerifyQuery.data, shouldVerifyStripe, method, searchParams]);

  // UPI approval simulation mutation
  const upiVerifyMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/payments/upi/verify", { paymentId });
      return response.data;
    },
    onSuccess: () => {
      updateUser({ isPremium: true });
      setSuccess(true);
      generateConfetti();
      toast.success("Simulated UPI payment received! VIP activated.");
      stopCamera();
    },
    onError: () => {
      toast.error("Failed to simulate UPI approval.");
    },
  });

  // COD delivery simulation mutation
  const codDeliveryMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/payments/cod/simulate-delivery", { paymentId });
      return response.data;
    },
    onSuccess: () => {
      updateUser({ isPremium: true });
      setSuccess(true);
      generateConfetti();
      toast.success("Simulated cash collected and VIP activated!");
    },
    onError: () => {
      toast.error("Failed to simulate COD delivery.");
    },
  });

  // Webcam QR scanner logic
  const startCamera = async () => {
    setCameraActive(true);
    setCameraError(false);
    setScanProgress(0);
    setQrScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable. Falling back to simulated scan view.");
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setQrScanning(false);
    setScanProgress(0);
  };

  // Auto scan progress loop
  useEffect(() => {
    let timer;
    if (qrScanning) {
      timer = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            upiVerifyMutation.mutate();
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [qrScanning]);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const isSimulating = upiVerifyMutation.isPending || codDeliveryMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e1b4b,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,#311042,transparent_60%)]" />

      {/* Confetti Render */}
      {success &&
        confetti.map((c) => (
          <span
            key={c.id}
            className="absolute pointer-events-none rounded-full animate-fall"
            style={{
              left: c.left,
              animationDelay: c.delay,
              animationDuration: c.duration,
              width: c.size,
              height: c.size,
              backgroundColor: c.color,
              top: "-20px",
            }}
          />
        ))}

      {/* CSS Animations */}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(167,139,250,0.2)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(167,139,250,0.6)); }
        }
        .animate-glow {
          animation: pulse-glow 2s infinite ease-in-out;
        }
        @keyframes laser-swipe {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-laser {
          animation: laser-swipe 2s infinite linear;
        }
      `}</style>

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
            <p className="text-slate-400 text-sm">Please do not refresh or close this tab...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-9 h-9 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
            <p className="text-red-400/90 text-sm mb-8">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 font-bold rounded-2xl transition duration-300"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {!loading && !error && (
          <div>
            {success ? (
              // Shared Success Layout for Stripe/UPI Success/COD Completed
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-glow">
                  <Sparkles className="w-10 h-10 text-slate-950 stroke-[2.5]" />
                </div>
                <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent">
                  VIP Activated!
                </h2>
                <p className="text-slate-300 text-sm font-semibold mb-6">
                  Thank you! Your Lifetime Premium VIP status is active.
                </p>

                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 mb-8 text-left">
                  <div className="flex items-center gap-3 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-4 h-4" /> Activated Perks
                  </div>
                  <ul className="text-slate-400 text-xs space-y-2">
                    <li className="flex items-center gap-2">👑 Shiny Gold Crown status indicators</li>
                    <li className="flex items-center gap-2">💬 Highlighted text color in chats</li>
                    <li className="flex items-center gap-2">📂 Unlimited large files/attachments sharing</li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 font-extrabold rounded-2xl shadow-lg shadow-sky-500/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  Enter Chat Rooms <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Pending states for UPI and COD
              <div>
                {method === "upi" && (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Complete UPI Payment</h2>

                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 mb-6">
                      <button
                        onClick={() => {
                          stopCamera();
                          setUpiMode("collect");
                        }}
                        className={`py-2 px-3 rounded-xl font-bold text-xs transition duration-300 flex items-center justify-center gap-1.5 ${
                          upiMode === "collect"
                            ? "bg-slate-800 text-white shadow-sm border border-slate-700/50"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" /> Push Request
                      </button>
                      <button
                        onClick={() => setUpiMode("qr")}
                        className={`py-2 px-3 rounded-xl font-bold text-xs transition duration-300 flex items-center justify-center gap-1.5 ${
                          upiMode === "qr"
                            ? "bg-slate-800 text-white shadow-sm border border-slate-700/50"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" /> Scan QR Code
                      </button>
                    </div>

                    {/* Push Request Mode */}
                    {upiMode === "collect" && (
                      <div className="py-2 animate-fade-in">
                        <div className="w-16 h-16 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                          <Smartphone className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Awaiting UPI Approval</h3>
                        <p className="text-slate-400 text-xs mb-6 px-4">
                          We've sent a payment request of <strong>$19.99</strong> to the UPI ID: <code className="text-indigo-400 bg-indigo-950/30 px-2 py-1 rounded text-xs">{searchParams.get("upi_id") || "you"}</code>. Please check your banking app to approve it.
                        </p>

                        {/* Developer Mock Tool Box */}
                        <div className="border border-amber-500/30 bg-amber-950/20 rounded-2xl p-5 mb-8 text-left">
                          <h4 className="text-amber-400 font-bold text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            ⚡ Sandbox Simulation
                          </h4>
                          <p className="text-slate-300 text-[11px] mb-4">
                            In developer mode, click below to mock the payment approval signal coming from your UPI provider.
                          </p>
                          <button
                            onClick={() => upiVerifyMutation.mutate()}
                            disabled={isSimulating}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 text-slate-950 font-extrabold rounded-xl transition duration-300 text-xs shadow-md shadow-amber-500/10 flex items-center justify-center gap-2"
                          >
                            {upiVerifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve Simulated UPI"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* QR Code Scan Mode */}
                    {upiMode === "qr" && (
                      <div className="py-1 animate-fade-in space-y-5">
                        {!qrScanning ? (
                          <div className="space-y-6">
                            {/* Render QR code */}
                            <div className="bg-white p-4 rounded-3xl w-48 h-48 mx-auto flex items-center justify-center shadow-lg border-4 border-indigo-500/20">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=0f172a&data=${encodeURIComponent(
                                  `upi://pay?pa=vippremium@upi&pn=MERNVIP&am=19.99&cu=USD`
                                )}`}
                                alt="UPI Payment QR Code"
                                className="w-full h-full"
                              />
                            </div>
                            <div>
                              <h3 className="text-base font-bold">Scan with Phone or Scan inside Page</h3>
                              <p className="text-slate-400 text-xs mt-1.5 px-6 leading-relaxed">
                                You can scan this QR code with any UPI app on your phone, OR use our built-in camera scanner below to simulate the scan.
                              </p>
                            </div>
                            <button
                              onClick={startCamera}
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-50 text-white font-extrabold rounded-xl transition duration-300 text-xs flex items-center justify-center gap-2"
                            >
                              <Camera className="w-4 h-4" /> Open Built-in QR Scanner
                            </button>
                          </div>
                        ) : (
                          // Interactive QR Scanner Viewport
                          <div className="space-y-4">
                            <div className="relative w-full h-56 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                              {/* Glowing Scan Viewfinder grid overlay */}
                              <div className="absolute inset-0 z-20 border-[24px] border-slate-950/60 pointer-events-none" />
                              <div className="absolute w-44 h-44 border-2 border-indigo-400/80 rounded-xl z-20 pointer-events-none flex items-center justify-center">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-400 -translate-x-1 -translate-y-1" />
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-400 translate-x-1 -translate-y-1" />
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-400 -translate-x-1 translate-y-1" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-400 translate-x-1 translate-y-1" />
                              </div>

                              {/* Laser Sweep line */}
                              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_10px_#818cf8] z-20 animate-laser pointer-events-none" />

                              {/* Webcam feed */}
                              {!cameraError ? (
                                <video
                                  ref={videoRef}
                                  autoPlay
                                  playsInline
                                  className="w-full h-full object-cover z-10"
                                />
                              ) : (
                                // Mock scanner graphics if no camera access
                                <div className="text-center p-6 flex flex-col items-center justify-center z-10">
                                  <Scan className="w-12 h-12 text-slate-700 animate-pulse mb-3" />
                                  <p className="text-[10px] text-slate-500">Camera Access Blocked / Mock Scanner Running</p>
                                  <p className="text-xs text-indigo-400 font-extrabold mt-1">Simulating scan frame alignment...</p>
                                </div>
                              )}
                            </div>

                            {/* Scan Progress Bar */}
                            <div className="space-y-1.5 text-left">
                              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" /> Scanning QR Code...
                                </span>
                                <span>{scanProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div
                                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${scanProgress}%` }}
                                />
                              </div>
                            </div>

                            <button
                              onClick={stopCamera}
                              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs rounded-xl font-bold transition duration-300"
                            >
                              Cancel Scanner
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-6 border-t border-slate-800 pt-6">
                      <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl transition duration-300 text-sm"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                )}

                {method === "cod" && (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-blue-950/40 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Truck className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">COD Order Placed!</h2>
                    <p className="text-slate-400 text-sm mb-4">
                      Your VIP Welcome Kit order has been registered for Cash on Delivery.
                    </p>
                    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/80 mb-6 text-xs text-slate-400 text-left">
                      <strong className="text-slate-300">Shipping Address:</strong><br />
                      <span className="break-all">{codAddress}</span>
                    </div>

                    {/* Developer Mock Tool Box */}
                    <div className="border border-amber-500/30 bg-amber-950/20 rounded-2xl p-5 mb-8 text-left">
                      <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        🚚 Sandbox Simulation
                      </h4>
                      <p className="text-slate-300 text-[11px] mb-4">
                        In developer mode, click below to mock the delivery agent arriving, collecting cash, and activating your VIP status.
                      </p>
                      <button
                        onClick={() => codDeliveryMutation.mutate()}
                        disabled={isSimulating}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 text-slate-950 font-extrabold rounded-xl transition duration-300 text-xs shadow-md shadow-amber-500/10 flex items-center justify-center gap-2"
                      >
                        {codDeliveryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Collect Cash & Activate"}
                      </button>
                    </div>

                    <button
                      onClick={() => navigate("/dashboard")}
                      className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl transition duration-300 text-sm"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
