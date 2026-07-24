import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({ isOpen, onClose, title, icon: Icon, children }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Dynamic Fade-in card wrapper */}
      <div 
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl relative flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CSS Fade-in keyframes */}
        <style>{`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .animate-fade-in {
            animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>

        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-indigo-500" />} {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
