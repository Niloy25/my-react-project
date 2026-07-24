import React, { useEffect, useRef } from "react";
import { VideoOff, MicOff, Mic, Video, PhoneOff } from "lucide-react";
import Modal from "../ui/Modal";

// Remote video stream helper component
const RemoteVideo = ({ streamObject, name, isPremium }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && streamObject) {
      videoRef.current.srcObject = streamObject;
    }
  }, [streamObject]);

  return (
    <div className="relative w-full h-40 bg-gray-900 rounded-2xl overflow-hidden shadow-md group border border-gray-800 animate-fade-in">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-white/10">
        <span className="text-[10px] font-black text-white">{name}</span>
        {isPremium && <span className="text-xs">👑</span>}
      </div>
    </div>
  );
};

const VideoCallOverlay = ({
  isInCall,
  activeCallParticipants,
  joinCall,
  isVideoOff,
  isMuted,
  localVideoRef,
  remoteStreams,
  toggleMute,
  toggleVideo,
  leaveCall,
  showUpgradeModal,
  setShowUpgradeModal,
}) => {
  return (
    <>
      {/* Active Video Call Invitation Banner */}
      {!isInCall && activeCallParticipants.length > 0 && (
        <div className="bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3.5 flex items-center justify-between text-white animate-fade-in border-b border-cyan-500/10">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-400"></span>
            </span>
            <div>
              <p className="text-xs font-black tracking-wide uppercase">Active Group Video Call</p>
              <p className="text-[10px] text-indigo-100 font-bold mt-0.5">
                Join {activeCallParticipants.length} participant{activeCallParticipants.length > 1 ? "s" : ""} on video
              </p>
            </div>
          </div>
          <button
            onClick={joinCall}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-extrabold rounded-xl text-xs transition duration-300 shadow-md active:scale-95 border border-white/10"
          >
            Join Call
          </button>
        </div>
      )}

      {/* Active Video Stream Grid */}
      {isInCall && (
        <div className="p-5 bg-gray-950 border-b border-gray-800 animate-fade-in shadow-inner">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Local Video Card */}
              <div className="relative w-full h-40 bg-gray-900 rounded-2xl overflow-hidden shadow-md group border-2 border-indigo-500/50">
                {isVideoOff ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-500">
                    <VideoOff className="w-8 h-8 mb-1.5" />
                    <span className="text-[10px] font-bold uppercase">Camera Off</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-2 left-2 bg-indigo-600/90 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-indigo-400/30">
                  <span className="text-[10px] font-black text-white">You (Host)</span>
                  <span className="text-xs">👑</span>
                </div>
                {isMuted && (
                  <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm p-1.5 rounded-lg border border-red-400/20">
                    <MicOff className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Remote Video Cards */}
              {Object.entries(remoteStreams).map(([socketId, remote]) => (
                <RemoteVideo
                  key={socketId}
                  streamObject={remote.stream}
                  name={remote.user?.name || "Peer"}
                  isPremium={remote.user?.isPremium}
                />
              ))}
            </div>

            {/* Toolbar Controls */}
            <div className="flex items-center justify-center gap-4 bg-gray-900/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-gray-800 w-fit mx-auto shadow-2xl">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-xl transition duration-300 active:scale-95 border ${isMuted
                  ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                  : "bg-gray-950 border-gray-850 text-gray-300 hover:bg-gray-850"
                  }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-xl transition duration-300 active:scale-95 border ${isVideoOff
                  ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                  : "bg-gray-950 border-gray-850 text-gray-300 hover:bg-gray-850"
                  }`}
                title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>

              <button
                onClick={leaveCall}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition duration-300 active:scale-95 shadow-md shadow-red-500/10"
                title="Leave Call"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {showUpgradeModal && (
        <Modal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="👑 VIP Premium Feature Locked"
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-amber-200 animate-bounce">
              👑
            </div>
            <h3 className="text-lg font-bold text-gray-900">Multi-Party Video Calls</h3>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Group video calling is exclusive to our <strong>VIP Premium Members</strong>. Stand out with special crown badges, custom colored message names, and access to group video calling.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  document.getElementById("premium-upgrade-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold rounded-xl transition duration-300 shadow-md shadow-amber-500/20 active:scale-95 text-sm"
              >
                Upgrade to VIP now ($19.99)
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-3 bg-gray-50 hover:bg-gray-105 border border-gray-205 text-gray-650 font-bold rounded-xl transition duration-300 text-sm active:scale-95"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default VideoCallOverlay;
