import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#2d121c,transparent_75%)]" />

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10 text-center">
        <div className="w-16 h-16 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-9 h-9 text-red-400" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Checkout Cancelled</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Your payment session has been cancelled. No charges were made. You can attempt to upgrade your account at any time.
        </p>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 font-bold rounded-2xl transition duration-300 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
