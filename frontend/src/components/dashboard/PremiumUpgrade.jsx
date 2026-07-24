import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import {
  CreditCard,
  Smartphone,
  Truck,
  ShieldCheck,
  QrCode,
  Camera,
  RefreshCw,
  Scan,
} from "lucide-react";
import api from "../../utils/axios";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";

export const PremiumUpgrade = ({ user, updateUser }) => {
  const navigate = useNavigate();

  // State hooks for payment forms tab navigation
  const [paymentTab, setPaymentTab] = useState("stripe");
  const [upiSubMode, setUpiSubMode] = useState("collect");
  const [stripeDeliveryAddress, setStripeDeliveryAddress] = useState("");

  // Camera QR Scanner states
  const [qrScanning, setQrScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Modal triggers
  const [showCardMockModal, setShowCardMockModal] = useState(false);

  // React Hook Form instances for separate inputs
  // 1. Credit Card Modal Form
  const {
    register: registerCard,
    handleSubmit: handleCardSubmitHook,
    formState: { errors: cardErrors },
    setValue: setCardValue,
    watch: watchCard,
    reset: resetCard,
  } = useForm({
    defaultValues: {
      cardName: user?.name || "John Doe",
      cardNum: "4242 4242 4242 4242",
      cardExp: "12/28",
      cardCvc: "123",
    },
  });

  const cardName = watchCard("cardName") || "";
  const cardNum = watchCard("cardNum") || "";
  const cardExp = watchCard("cardExp") || "";

  // 2. UPI ID Form
  const {
    register: registerUpi,
    handleSubmit: handleUpiSubmitHook,
    formState: { errors: upiErrors },
    reset: resetUpi,
  } = useForm({
    defaultValues: {
      upiId: "sandbox@upi",
    },
  });

  // 3. COD Address Form
  const {
    register: registerCod,
    handleSubmit: handleCodSubmitHook,
    formState: { errors: codErrors },
    reset: resetCod,
  } = useForm({
    defaultValues: {
      deliveryAddress: "123 Sandbox Lane, New York, NY 10001",
    },
  });

  // 4. Stripe Address Form
  const {
    register: registerStripe,
    handleSubmit: handleStripeSubmitHook,
    formState: { errors: stripeErrors },
    reset: resetStripe,
  } = useForm({
    defaultValues: {
      deliveryAddress: "123 Sandbox Lane, New York, NY 10001",
    },
  });

  // ── TanStack React Query mutations ───────────────────────

  // A. Stripe Checkout Mutation
  const stripeCheckoutMutation = useMutation({
    mutationFn: async (deliveryAddress) => {
      const response = await api.post("/payments/create-checkout-session", { deliveryAddress });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      const errMsg = error.response?.data?.message || "";
      if (
        errMsg.toLowerCase().includes("stripe secret key is not configured") ||
        errMsg.toLowerCase().includes("key")
      ) {
        toast.error("Stripe Secret Key missing in backend. Opening Simulated Card payment...");
        setShowCardMockModal(true);
      } else {
        toast.error(errMsg || "Failed to initiate Stripe Checkout.");
      }
    },
  });

  // B. Card Simulation Mutation
  const cardSimulateMutation = useMutation({
    mutationFn: async (deliveryAddress) => {
      const response = await api.post("/payments/card-simulate", { deliveryAddress });
      return response.data;
    },
    onSuccess: () => {
      updateUser({ isPremium: true });
      setShowCardMockModal(false);
      resetCard();
      resetStripe();
      toast.success("Simulated card payment successful! VIP activated.");
      navigate("/payment-success?method=stripe&simulated=true");
    },
    onError: () => {
      toast.error("Failed to process simulated card payment.");
    },
  });

  // C. UPI ID Request Mutation
  const upiCheckoutMutation = useMutation({
    mutationFn: async (upiId) => {
      const response = await api.post("/payments/upi", { upiId });
      return response.data;
    },
    onSuccess: (data, upiId) => {
      toast.success("UPI payment requested!");
      resetUpi();
      navigate(`/payment-success?payment_id=${data.paymentId}&method=upi&upi_id=${encodeURIComponent(upiId)}`);
    },
    onError: () => {
      toast.error("Failed to request UPI payment.");
    },
  });

  // D. Direct QR Scan Mutation
  const directQRScanMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/payments/upi-qr-complete");
      return response.data;
    },
    onSuccess: () => {
      updateUser({ isPremium: true });
      stopCamera();
      toast.success("Simulated QR scan completed! VIP active.");
      navigate("/payment-success?method=stripe&simulated=true");
    },
    onError: () => {
      toast.error("Failed to complete QR scan checkout.");
      stopCamera();
    },
  });

  // E. COD Order Request Mutation
  const codCheckoutMutation = useMutation({
    mutationFn: async (deliveryAddress) => {
      const response = await api.post("/payments/cod", { deliveryAddress });
      return response.data;
    },
    onSuccess: (data, deliveryAddress) => {
      toast.success("COD order created successfully.");
      resetCod();
      navigate(`/payment-success?payment_id=${data.paymentId}&method=cod&address=${encodeURIComponent(deliveryAddress)}`);
    },
    onError: () => {
      toast.error("Failed to submit COD order.");
    },
  });

  // Submissions handlers bound to React Hook Form validation
  const onSubmitCard = () => {
    cardSimulateMutation.mutate(stripeDeliveryAddress);
  };

  const onSubmitUpi = (data) => {
    upiCheckoutMutation.mutate(data.upiId);
  };

  const onSubmitCod = (data) => {
    codCheckoutMutation.mutate(data.deliveryAddress);
  };

  const onSubmitStripe = (data) => {
    setStripeDeliveryAddress(data.deliveryAddress);
    stripeCheckoutMutation.mutate(data.deliveryAddress);
  };

  // Camera control cleanups
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setQrScanning(false);
    setScanProgress(0);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Monitor tab change to stop camera if active
  useEffect(() => {
    stopCamera();
  }, [paymentTab, upiSubMode]);

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
      console.warn("Camera access blocked. Falling back to mockup scanner animation.");
      setCameraError(true);
    }
  };

  // Scan progress simulator
  useEffect(() => {
    let timer;
    if (qrScanning) {
      timer = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            directQRScanMutation.mutate();
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

  const isMutating =
    stripeCheckoutMutation.isPending ||
    cardSimulateMutation.isPending ||
    upiCheckoutMutation.isPending ||
    directQRScanMutation.isPending ||
    codCheckoutMutation.isPending;

  return (
    <>
      <div id="premium-upgrade-section" className="bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/[0.05] p-8 shadow-2xl mb-10 overflow-hidden relative">
        <style>{`
          @keyframes laser-swipe-dash {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          .animate-laser-dash {
            animation: laser-swipe-dash 2.2s infinite linear;
          }
        `}</style>

        {user?.isPremium ? (
          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-amber-500/20">👑</div>
              <div>
                <h3 className="text-xl font-bold text-amber-350">VIP Pro Membership Active</h3>
                <p className="text-sm text-amber-200/80 mt-1">Thank you for upgrading! You have unlocked all visual styles and features on this platform.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-600/10">
              <ShieldCheck className="w-4 h-4" /> Lifetime Active
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Upgrade Offer</span>
                <h2 className="text-3xl font-extrabold text-white mt-4 leading-tight">Join the VIP Club</h2>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Unlock exclusive features, stand out in conversations, and gain access to custom styling elements.
                </p>
              </div>

              <div className="space-y-3.5 my-6">
                <div className="flex items-start gap-3">
                  <span className="text-lg">👑</span>
                  <div>
                    <p className="text-xs font-bold text-gray-200">Premium Golden Crown Badge</p>
                    <p className="text-[11px] text-gray-400">Stand out in both the online members list and chat feed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">🎨</span>
                  <div>
                    <p className="text-xs font-bold text-gray-200">Highlighted Sender Name</p>
                    <p className="text-[11px] text-gray-400">Custom premium visual styling on your messages.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">📹</span>
                  <div>
                    <p className="text-xs font-bold text-gray-200">Multi-Party Video Calls</p>
                    <p className="text-[11px] text-gray-400">Host and join multi-video conferences in channels.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">⚡</span>
                  <div>
                    <p className="text-xs font-bold text-gray-200">Instant VIP Validation</p>
                    <p className="text-[11px] text-gray-400">Immediate access upon completing payment via card or UPI.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <span className="text-sm font-medium text-gray-400">One-time Lifetime Upgrade</span>
                <div className="text-2xl font-black text-red-400 mt-1">$19.99</div>
              </div>
            </div>

            {/* Checkout tabs form */}
            <div className="lg:col-span-7 bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6 flex flex-col">
              <h3 className="text-sm font-bold text-gray-200 mb-4">Choose Payment Method</h3>
              
              {/* Method selector tabs */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {[
                  { id: "stripe", label: "Card", icon: CreditCard },
                  { id: "upi", label: "UPI & QR", icon: Smartphone },
                  { id: "cod", label: "COD", icon: Truck },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPaymentTab(tab.id)}
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
                      paymentTab === tab.id
                        ? "bg-white/[0.04] border-indigo-500 text-white shadow-lg shadow-indigo-500/10 font-bold scale-[1.02]"
                        : "bg-white/[0.01] border-white/[0.05] text-gray-400 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                {/* Stripe Card Option */}
                {paymentTab === "stripe" && (
                  <form onSubmit={handleStripeSubmitHook(onSubmitStripe)} className="space-y-4 py-2">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Secure credit or debit card transactions are powered by <strong>Stripe Checkout</strong>. Clicking the button below redirects you to Stripe's secure portal.
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">Delivery Address (VIP Welcome Kit Delivery)</label>
                      <textarea
                        placeholder="Enter your complete doorstep delivery address"
                        rows="3"
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                        {...registerStripe("deliveryAddress", {
                          required: "Doorstep delivery address is required for VIP Kit delivery",
                          minLength: {
                            value: 8,
                            message: "Enter a complete shipping address (minimum 8 characters)",
                          },
                        })}
                      />
                      {stripeErrors.deliveryAddress && (
                        <p className="text-red-500 text-[10px] font-bold mt-1">{stripeErrors.deliveryAddress.message}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isMutating}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold rounded-xl transition duration-300 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-sm"
                    >
                      {stripeCheckoutMutation.isPending ? "Redirecting..." : "Pay Online with Stripe"}
                    </button>
                  </form>
                )}

                {/* UPI Tab with 2 distinct direct options */}
                {paymentTab === "upi" && (
                  <div className="space-y-5">
                    {/* Sub Mode Selector */}
                    <div className="grid grid-cols-2 gap-2 bg-white/[0.03] p-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setUpiSubMode("collect")}
                        className={`py-2 rounded-lg font-bold text-xs transition duration-300 flex items-center justify-center gap-1 ${
                          upiSubMode === "collect"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-400 hover:text-gray-250"
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" /> Pay via UPI ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiSubMode("qr")}
                        className={`py-2 rounded-lg font-bold text-xs transition duration-300 flex items-center justify-center gap-1 ${
                          upiSubMode === "qr"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-400 hover:text-gray-250"
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" /> Scan QR Code
                      </button>
                    </div>

                    {/* Sub-tab 1: UPI ID */}
                    {upiSubMode === "collect" && (
                      <form onSubmit={handleUpiSubmitHook(onSubmitUpi)} className="space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1.5">Enter UPI ID</label>
                          <input
                            type="text"
                            placeholder="e.g. name@upi"
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                            {...registerUpi("upiId", {
                              required: "UPI ID is required",
                              pattern: {
                                value: /^[^@\s]+@[^@\s]+$/,
                                message: "Enter a valid UPI ID (e.g., name@okaxis)",
                              },
                            })}
                          />
                          {upiErrors.upiId && (
                            <p className="text-red-500 text-[10px] font-bold mt-1">{upiErrors.upiId.message}</p>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={isMutating}
                          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold rounded-xl transition duration-300 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-sm"
                        >
                          {upiCheckoutMutation.isPending ? "Processing..." : "Submit UPI ID"}
                        </button>
                      </form>
                    )}

                    {/* Sub-tab 2: Scan QR Code directly in Dashboard */}
                    {upiSubMode === "qr" && (
                      <div className="space-y-4 py-1 animate-fade-in">
                        {!qrScanning ? (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                            {/* Static QR code display */}
                            <div className="md:col-span-5 bg-white p-3 rounded-2xl flex items-center justify-center border border-white/10 shadow-sm w-36 h-36 mx-auto">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&color=0f172a&data=${encodeURIComponent(
                                  `upi://pay?pa=vippremium@upi&pn=MERNVIP&am=19.99&cu=USD`
                                )}`}
                                alt="Direct Payment QR"
                                className="w-full h-full"
                              />
                            </div>
                            <div className="md:col-span-7 text-center md:text-left space-y-3">
                              <div>
                                <h4 className="text-xs font-bold text-gray-200">Scan & Upgrade Instantly</h4>
                                <p className="text-gray-450 text-[11px] mt-1 leading-relaxed">
                                  Click below to start our built-in simulator scanner. Point it at the QR code to scan, verify, and complete VIP validation.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={startCamera}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-white/10 text-white font-bold rounded-xl transition duration-300 text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 border border-white/10"
                              >
                                <Camera className="w-3.5 h-3.5" /> Start Built-in Scanner
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Built-in Camera QR Scanner viewport inside the dashboard tab
                          <div className="space-y-4 border border-white/[0.05] rounded-xl p-4 bg-white/[0.01]">
                            <div className="relative w-full h-44 bg-slate-950 border border-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                              {/* Grid mask */}
                              <div className="absolute inset-0 z-20 border-[16px] border-slate-950/60 pointer-events-none" />
                              <div className="absolute w-32 h-32 border-2 border-indigo-400/80 rounded-lg z-20 pointer-events-none flex items-center justify-center">
                                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-indigo-400 -translate-x-[1px] -translate-y-[1px]" />
                                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-indigo-400 translate-x-[1px] -translate-y-[1px]" />
                                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-indigo-400 -translate-x-[1px] translate-y-[1px]" />
                                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-indigo-400 translate-x-[1px] translate-y-[1px]" />
                              </div>

                              {/* Laser scanner line */}
                              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_#818cf8] z-20 animate-laser-dash pointer-events-none" />

                              {/* Camera preview or mock feed */}
                              {!cameraError ? (
                                <video
                                  ref={videoRef}
                                  autoPlay
                                  playsInline
                                  className="w-full h-full object-cover z-10"
                                />
                              ) : (
                                <div className="text-center p-3 flex flex-col items-center justify-center z-10">
                                  <Scan className="w-8 h-8 text-slate-700 animate-pulse mb-1.5" />
                                  <p className="text-[9px] text-slate-500">Camera permission blocked. Simulating scan align...</p>
                                  <p className="text-xs text-indigo-500 font-extrabold mt-1">Completing scan process...</p>
                                </div>
                              )}
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1 text-left">
                              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-indigo-500" /> Scanning QR code...
                                </span>
                                <span>{scanProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-gray-200">
                                <div
                                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${scanProgress}%` }}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={stopCamera}
                              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] rounded-lg font-bold transition duration-300 border border-gray-200"
                            >
                              Close Scanner
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* COD Option */}
                {paymentTab === "cod" && (
                  <form onSubmit={handleCodSubmitHook(onSubmitCod)} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">Delivery Address (VIP Welcome Kit Delivery)</label>
                      <textarea
                        placeholder="Enter your complete doorstep delivery address"
                        rows="3"
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                        {...registerCod("deliveryAddress", {
                          required: "Doorstep delivery address is required",
                          minLength: {
                            value: 8,
                            message: "Enter a complete shipping address (minimum 8 characters)",
                          },
                        })}
                      />
                      {codErrors.deliveryAddress && (
                        <p className="text-red-500 text-[10px] font-bold mt-1">{codErrors.deliveryAddress.message}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isMutating}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold rounded-xl transition duration-300 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-sm"
                    >
                      {codCheckoutMutation.isPending ? "Registering Order..." : "Order Cash on Delivery"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simulated Credit Card Payment Modal */}
      <Modal 
        isOpen={showCardMockModal} 
        onClose={() => {
          setShowCardMockModal(false);
          resetCard();
        }}
        title="Simulated Card Checkout"
        icon={CreditCard}
      >
        <form onSubmit={handleCardSubmitHook(onSubmitCard)} className="p-6 space-y-6">
          {/* Interactive Virtual Card Preview */}
          <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden h-44 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-8 -translate-y-8 blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-300">VIP Premium Card</span>
              <span className="text-lg">👑</span>
            </div>

            <div className="text-lg font-mono tracking-widest text-slate-200">
              {cardNum || "••••  ••••  ••••  ••••"}
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] uppercase tracking-wider text-slate-400">Cardholder</p>
                <p className="text-xs font-bold tracking-wide truncate max-w-[180px]">
                  {cardName.toUpperCase() || "YOUR NAME HERE"}
                </p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-wider text-slate-400">Expires</p>
                <p className="text-xs font-mono font-bold">{cardExp || "MM/YY"}</p>
              </div>
            </div>
          </div>

          {/* Form Input fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Cardholder Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                {...registerCard("cardName", { required: "Cardholder name is required" })}
              />
              {cardErrors.cardName && (
                <p className="text-red-500 text-[10px] font-bold mt-1">{cardErrors.cardName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Card Number</label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                {...registerCard("cardNum", {
                  required: "Card number is required",
                  pattern: {
                    value: /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/,
                    message: "Enter 16 digits spacing formatted: 4242 4242 4242 4242",
                  },
                  onChange: (e) => {
                    const v = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
                    const matches = v.match(/\d{4,16}/g);
                    const match = (matches && matches[0]) || "";
                    const parts = [];
                    for (let i = 0, len = match.length; i < len; i += 4) {
                      parts.push(match.substring(i, i + 4));
                    }
                    const formatted = parts.length > 0 ? parts.join(" ") : v;
                    setCardValue("cardNum", formatted);
                  },
                })}
              />
              {cardErrors.cardNum && (
                <p className="text-red-500 text-[10px] font-bold mt-1">{cardErrors.cardNum.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  {...registerCard("cardExp", {
                    required: "Expiry is required",
                    pattern: {
                      value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                      message: "Format as MM/YY",
                    },
                    onChange: (e) => {
                      const v = e.target.value.replace(/[^0-9]/gi, "");
                      if (v.length >= 2) {
                        setCardValue("cardExp", `${v.slice(0, 2)}/${v.slice(2, 4)}`);
                      } else {
                        setCardValue("cardExp", v);
                      }
                    },
                  })}
                />
                {cardErrors.cardExp && (
                  <p className="text-red-500 text-[10px] font-bold mt-1">{cardErrors.cardExp.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">CVC / CVV</label>
                <input
                  type="password"
                  placeholder="•••"
                  maxLength={3}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  {...registerCard("cardCvc", {
                    required: "CVC is required",
                    pattern: {
                      value: /^\d{3}$/,
                      message: "Must be 3 digits",
                    },
                    onChange: (e) => {
                      setCardValue("cardCvc", e.target.value.replace(/[^0-9]/gi, ""));
                    },
                  })}
                />
                {cardErrors.cardCvc && (
                  <p className="text-red-500 text-[10px] font-bold mt-1">{cardErrors.cardCvc.message}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isMutating}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold rounded-xl transition duration-300 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 text-sm"
          >
            {cardSimulateMutation.isPending ? "Processing..." : "Complete $19.99 Simulated Checkout"}
          </button>
        </form>
      </Modal>
    </>
  );
};

export default PremiumUpgrade;
