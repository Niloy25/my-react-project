import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import useSocket from "../../hooks/useSocket";
import { selectUser } from "../../store/authSlice";
import toast from "react-hot-toast";
import api from "../../utils/axios";

import ChatSidebar from "./ChatSidebar";
import VideoCallOverlay from "./VideoCallOverlay";
import MessageContainer from "./MessageContainer";

export const ChatRoom = () => {
  const { socket, isConnected } = useSocket();
  const currentUser = useSelector(selectUser);

  const [activeRoom, setActiveRoom] = useState("general");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]); // Array of { id, file, previewUrl, type }
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);

  // Audio Recording states and refs
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [typingUsers, setTypingUsers] = useState({}); // room -> { userId: name }
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const filesRef = useRef(selectedFiles);
  useEffect(() => {
    filesRef.current = selectedFiles;
  }, [selectedFiles]);

  // ── WebRTC Video Call States ─────────────────────────────
  const [isInCall, setIsInCall] = useState(false);
  const [activeCallParticipants, setActiveCallParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({}); // socketId -> { stream, user }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // socketId -> RTCPeerConnection
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isInCall, isVideoOff]);

  const closePeerConnection = (socketId) => {
    const pc = peersRef.current[socketId];
    if (pc) {
      pc.close();
      delete peersRef.current[socketId];
    }
    setRemoteStreams((prev) => {
      const updated = { ...prev };
      delete updated[socketId];
      return updated;
    });
  };

  const createPeerConnection = (targetSocketId, participant, isInitiator) => {
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(configuration);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("call:signal", {
          to: targetSocketId,
          signal: {
            type: "candidate",
            candidate: event.candidate,
          },
        });
      }
    };

    // Track stream handler
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: {
          stream: remoteStream,
          user: participant,
        },
      }));
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        closePeerConnection(targetSocketId);
      }
    };

    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (socket) {
            socket.emit("call:signal", {
              to: targetSocketId,
              signal: {
                type: "offer",
                offer,
              },
            });
          }
        } catch (err) {
          console.error("Error creating offer:", err);
        }
      };
    }

    return pc;
  };

  const createMockStream = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#4f46e5");
    grad.addColorStop(0.5, "#7c3aed");
    grad.addColorStop(1, "#db2777");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("👑 VIP Call Active", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px sans-serif";
    ctx.fillText(currentUser?.name || "Premium VIP Member", canvas.width / 2, canvas.height / 2 + 25);

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("👑 VIP Call Active", canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = "20px sans-serif";
      ctx.fillText(currentUser?.name || "Premium VIP Member", canvas.width / 2, canvas.height / 2 + 25);

      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 + 80, 10 + Math.sin(frame * 0.15) * 4, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fill();
    }, 100);

    const videoStream = canvas.captureStream(15);
    const videoTrack = videoStream.getVideoTracks()[0];

    let audioTrack;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctxAudio = new AudioContext();
      const dest = ctxAudio.createMediaStreamDestination();
      const osc = ctxAudio.createOscillator();
      const gain = ctxAudio.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      audioTrack = dest.stream.getAudioTracks()[0];
    } catch (e) {
      console.warn("Could not create Web Audio destination:", e);
    }

    const tracks = [];
    if (videoTrack) tracks.push(videoTrack);
    if (audioTrack) tracks.push(audioTrack);

    const mockStream = new MediaStream(tracks);

    const originalStop = videoTrack.stop;
    videoTrack.stop = function () {
      clearInterval(interval);
      if (originalStop) originalStop.apply(this, arguments);
    };

    return mockStream;
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
      return stream;
    } catch (err) {
      console.warn("Media devices access failed, falling back to mock stream:", err);
      toast.error("Failed to access camera/mic. Using camera simulator.");

      try {
        const stream = createMockStream();
        localStreamRef.current = stream;
        setLocalStream(stream);
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
        });
        stream.getVideoTracks().forEach((track) => {
          track.enabled = !isVideoOff;
        });
        return stream;
      } catch (fallbackErr) {
        console.error("Mock stream creation failed:", fallbackErr);
        toast.error("Could not load simulation camera stream.");
        throw err;
      }
    }
  };

  const joinCall = async () => {
    if (!currentUser?.isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      const stream = await startLocalStream();
      setIsInCall(true);
      if (socket) {
        socket.emit("call:join", { room: activeRoom });
      }
      toast.success("Joined channel video call.");
    } catch (err) {
      setIsInCall(false);
    }
  };

  const leaveCall = () => {
    if (socket) {
      socket.emit("call:leave", { room: activeRoom });
    }

    Object.keys(peersRef.current).forEach((socketId) => {
      closePeerConnection(socketId);
    });
    peersRef.current = {};

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStreams({});
    setIsInCall(false);
  };

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
  };

  const toggleVideo = () => {
    const nextState = !isVideoOff;
    setIsVideoOff(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
  };

  useEffect(() => {
    return () => {
      leaveCall();
    };
  }, [activeRoom]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  // ── Auto-Scroll ─────────────────────────────────────────
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ── Handle Room Joining & Event Listeners ─────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    const roomName = activeRoom;

    socket.emit("room:join", { room: roomName });

    setMessages([
      {
        id: `sys_welcome_${Date.now()}`,
        type: "system",
        message: `Welcome to #${roomName}! This is the beginning of the channel.`,
        timestamp: new Date().toISOString(),
      },
    ]);

    const handleMessageReceive = (msg) => {
      if (msg.room === roomName) {
        setMessages((prev) => [...prev, { ...msg, type: "chat" }]);
      }
    };

    const handleRoomJoined = (data) => {
      console.log("Joined confirmation:", data.message);
    };

    const handleRoomHistory = (data) => {
      if (data.room === roomName) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const historyWithChatType = data.messages
            .map((msg) => ({ ...msg, type: "chat" }))
            .filter((msg) => !existingIds.has(msg.id));

          const systemMessages = prev.filter((m) => m.type === "system");
          const realTimeMessages = prev.filter((m) => m.type === "chat");

          return [
            ...systemMessages,
            ...historyWithChatType,
            ...realTimeMessages,
          ];
        });
      }
    };

    const handleUserJoined = (data) => {
      if (data.room === roomName && data.userId !== currentUser?._id) {
        setMessages((prev) => [
          ...prev,
          {
            id: `sys_join_${Date.now()}_${data.userId}`,
            type: "system",
            message: `${data.name} joined #${roomName}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    const handleErrorMessage = (data) => {
      toast.error(data.message);
    };

    // ── WebRTC Video Call Socket Listeners ────────────────────
    const handleCallStatusUpdate = (data) => {
      if (data.room === roomName) {
        setActiveCallParticipants(data.participants);
      }
    };

    const handleCallJoined = async (data) => {
      if (data.room !== roomName) return;
      for (const participant of data.participants) {
        if (participant.socketId === socket.id) continue;
        const pc = createPeerConnection(participant.socketId, participant, true);
        peersRef.current[participant.socketId] = pc;
      }
    };

    const handleCallUserJoined = (participant) => {
      const pc = createPeerConnection(participant.socketId, participant, false);
      peersRef.current[participant.socketId] = pc;
    };

    const handleCallUserLeft = ({ socketId }) => {
      closePeerConnection(socketId);
    };

    const handleCallSignal = async ({ from, signal }) => {
      let pc = peersRef.current[from];

      if (signal.type === "offer") {
        if (!pc) {
          const participant = activeCallParticipants.find(p => p.socketId === from) || { socketId: from, name: "Remote Peer" };
          pc = createPeerConnection(from, participant, false);
          peersRef.current[from] = pc;
        }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("call:signal", {
            to: from,
            signal: {
              type: "answer",
              answer,
            },
          });
        } catch (err) {
          console.error("Error handling WebRTC offer signal:", err);
        }
      } else if (signal.type === "answer") {
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          } catch (err) {
            console.error("Error setting WebRTC answer remote description:", err);
          }
        }
      } else if (signal.type === "candidate") {
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            console.error("Error adding WebRTC ICE candidate:", err);
          }
        }
      }
    };

    const handleCallError = (data) => {
      toast.error(data.message || "Video call connection error.");
      leaveCall();
    };

    const handleTypingStatus = (data) => {
      if (data.room === roomName) {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          if (!updated[roomName]) {
            updated[roomName] = {};
          }
          if (data.isTyping) {
            updated[roomName][data.userId] = data.name;
          } else {
            delete updated[roomName][data.userId];
          }
          return updated;
        });
      }
    };

    socket.on("message:receive", handleMessageReceive);
    socket.on("room:joined", handleRoomJoined);
    socket.on("room:history", handleRoomHistory);
    socket.on("room:user:joined", handleUserJoined);
    socket.on("error:message", handleErrorMessage);
    socket.on("typing:status", handleTypingStatus);
    socket.on("call:status:update", handleCallStatusUpdate);
    socket.on("call:joined", handleCallJoined);
    socket.on("call:user-joined", handleCallUserJoined);
    socket.on("call:user-left", handleCallUserLeft);
    socket.on("call:signal", handleCallSignal);
    socket.on("call:error", handleCallError);

    return () => {
      socket.emit("room:leave", { room: roomName });
      socket.off("message:receive", handleMessageReceive);
      socket.off("room:joined", handleRoomJoined);
      socket.off("room:history", handleRoomHistory);
      socket.off("room:user:joined", handleUserJoined);
      socket.off("error:message", handleErrorMessage);
      socket.off("typing:status", handleTypingStatus);
      socket.off("call:status:update", handleCallStatusUpdate);
      socket.off("call:joined", handleCallJoined);
      socket.off("call:user-joined", handleCallUserJoined);
      socket.off("call:user-left", handleCallUserLeft);
      socket.off("call:signal", handleCallSignal);
      socket.off("call:error", handleCallError);
    };
  }, [socket, isConnected, activeRoom, currentUser?._id]);

  // ── Emoji Picker Outside Click ───────────────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ── Emoji Click Handler ──────────────────────────────────
  const handleEmojiClick = (emoji) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const text = messageText;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      setMessageText(before + emoji + after);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setMessageText((prev) => prev + emoji);
    }
  };

  // ── File Attachment Handlers ──────────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 files per message");
      return;
    }

    const newSelected = [];
    for (const file of files) {
      const isImage = file.type.startsWith("image/");
      const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;

      if (file.size > maxSize) {
        toast.error(`"${file.name}" is too large. Max size: ${isImage ? "5MB for images" : "10MB for documents"}`);
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = isImage ? URL.createObjectURL(file) : null;
      newSelected.push({
        id,
        file,
        previewUrl,
        type: isImage ? "image" : "file"
      });
    }

    setSelectedFiles((prev) => [...prev, ...newSelected]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeSelectedFile = (id) => {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearAllSelectedFiles = () => {
    selectedFiles.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Send Message ─────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!socket || !isConnected) {
      toast.error("Not connected to the socket server");
      return;
    }

    const trimmed = messageText.trim();
    if (!trimmed && selectedFiles.length === 0) return;

    if (trimmed.length > 1000) {
      toast.error("Message exceeds maximum length of 1000 characters");
      return;
    }

    let attachmentsPayload = [];

    if (selectedFiles.length > 0) {
      try {
        setIsUploading(true);

        attachmentsPayload = await Promise.all(
          selectedFiles.map(async (item) => {
            const formData = new FormData();

            let uploadEndpoint = "/uploads/single-file";
            let fieldName = "file";

            if (item.type === "image") {
              uploadEndpoint = "/uploads/single-image";
              fieldName = "image";
            }

            formData.append(fieldName, item.file);

            const response = await api.post(uploadEndpoint, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });

            return {
              fileUrl: response.data.filePath,
              fileType: item.type,
              fileName: item.file.name,
            };
          })
        );

        toast.success(`${selectedFiles.length} file(s) uploaded successfully`);
      } catch (error) {
        console.error("Upload error:", error);
        const errorMsg = error.response?.data?.message || "Failed to upload one or more attachments";
        toast.error(errorMsg);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    socket.emit("message:send", {
      room: activeRoom,
      message: trimmed,
      attachments: attachmentsPayload,
      fileUrl: attachmentsPayload.length > 0 ? attachmentsPayload[0].fileUrl : null,
      fileType: attachmentsPayload.length > 0 ? attachmentsPayload[0].fileType : null,
      fileName: attachmentsPayload.length > 0 ? attachmentsPayload[0].fileName : null,
    });

    setMessageText("");
    clearAllSelectedFiles();
    setShowEmojiPicker(false);
  };

  // ── Voice Messages Recording ──────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        await uploadVoiceMessage(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success("Voice recording started.");
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    }
    setIsRecording(false);
    setRecordingTime(0);
    clearInterval(recordingIntervalRef.current);
    toast.error("Recording discarded.");
  };

  const uploadVoiceMessage = async (blob) => {
    if (!socket || !isConnected) {
      toast.error("Not connected to socket server.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      const file = new File([blob], `VoiceMessage_${Date.now()}.webm`, { type: "audio/webm" });
      formData.append("file", file);

      const response = await api.post("/uploads/single-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        socket.emit("message:send", {
          room: activeRoom,
          message: "Voice Message",
          attachments: [
            {
              fileUrl: response.data.filePath,
              fileType: "audio",
              fileName: "VoiceMessage.webm",
            }
          ],
          fileUrl: response.data.filePath,
          fileType: "audio",
          fileName: "VoiceMessage.webm",
        });
        toast.success("Voice message sent successfully.");
      }
    } catch (error) {
      console.error("Voice upload error:", error);
      const errMsg = error.response?.data?.message || "Failed to upload voice message.";
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white/[0.02] backdrop-blur-xl rounded-3xl shadow-2xl border border-white/[0.05] h-[560px] flex overflow-hidden relative">
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .message-bubble-anim {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 1. Sidebar */}
      <ChatSidebar
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
        isConnected={isConnected}
      />

      <div className="flex-1 flex flex-col bg-[#0f0c24]/10 min-w-0">
        {/* 2. WebRTC Video Call Overlay */}
        <VideoCallOverlay
          isInCall={isInCall}
          activeCallParticipants={activeCallParticipants}
          joinCall={joinCall}
          isVideoOff={isVideoOff}
          isMuted={isMuted}
          localVideoRef={localVideoRef}
          remoteStreams={remoteStreams}
          toggleMute={toggleMute}
          toggleVideo={toggleVideo}
          leaveCall={leaveCall}
          showUpgradeModal={showUpgradeModal}
          setShowUpgradeModal={setShowUpgradeModal}
        />

        {/* 3. Messages & Input Main Area */}
        <MessageContainer
          activeRoom={activeRoom}
          messages={messages}
          currentUser={currentUser}
          typingUsers={typingUsers}
          messagesEndRef={messagesEndRef}
          selectedFiles={selectedFiles}
          removeSelectedFile={removeSelectedFile}
          clearAllSelectedFiles={clearAllSelectedFiles}
          messageText={messageText}
          setMessageText={setMessageText}
          handleSendMessage={handleSendMessage}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          isRecording={isRecording}
          recordingTime={recordingTime}
          cancelRecording={cancelRecording}
          stopRecording={stopRecording}
          startRecording={startRecording}
          isConnected={isConnected}
          isUploading={isUploading}
          inputRef={inputRef}
          isInCall={isInCall}
          joinCall={joinCall}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          emojiPickerRef={emojiPickerRef}
          activeEmojiCategory={activeEmojiCategory}
          setActiveEmojiCategory={setActiveEmojiCategory}
          handleEmojiClick={handleEmojiClick}
        />
      </div>
    </div>
  );
};

export default ChatRoom;
