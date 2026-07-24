import React, { useState, useRef } from "react";
import {
  Globe,
  Play,
  Pause,
  FileText,
  Download,
  Check,
  Loader2,
  X,
  Paperclip,
  Mic,
  Smile,
  Video,
  Send,
  Trash2,
  StopCircle,
} from "lucide-react";
import { ROOM_ICONS } from "./ChatSidebar";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    icon: "😀",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "😎", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓"]
  },
  {
    name: "Gestures",
    icon: "👍",
    emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🧠", "👀", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "🔥", "✨"]
  },
  {
    name: "Animals",
    icon: "🐱",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦢", "🦉", "🐊", "🐢", "🦎", "🐍", "🐳", "🐬", "🐙", "🐚", "🦋", "🐝", "🐞", "🌲", "🌳", "🌴", "🌵", "🍀", "🍁", "🍂", "🍃", "🍄", "🌹", "🌸", "🌺", "🌻", "🌼", "🌷", "☀️", "🌙"]
  },
  {
    name: "Food",
    icon: "🍕",
    emojis: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🌽", "🥕", "🍞", "🧀", "🍳", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🥗", "🥘", "🍜", "🍝", "🍣", "🍤", "🍦", "🍧", "🍩", "🍪", "🎂", "🍰", "🍫", "🍬", "🍭", "☕", "🍵", "🍺", "🍻"]
  },
  {
    name: "Objects",
    icon: "🚀",
    emojis: ["⚽", "🏀", "🏈", "🎾", "🎮", "🕹️", "🏆", "🎫", "🎬", "🎤", "🎧", "🎹", "🎸", "🎻", "🎨", "💻", "📱", "⌚", "📷", "🎥", "💡", "🕯️", "💵", "✉️", "📦", "✏️", "✒️", "📁", "📅", "🔒", "🔑", "🔨", "🔧", "🛡️", "🚗", "🚀", "⚓", "✈️", "🎈", "🎉", "🎁", "🔮", "🛎️", "🧸", "🔔", "📣", "📢", "💬", "💯", "⚠️"]
  }
];

// Helper: Voice Note Audio Player
const VoiceMessagePlayer = ({ src, isMe }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border min-w-[240px] my-1 ${isMe ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.04] border-white/[0.05] text-white"
      }`}>
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnd}
        preload="metadata"
      />

      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0"
      >
        {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-white/20 accent-sky-450 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-gray-300 font-semibold">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

const MessageContainer = ({
  activeRoom,
  messages,
  currentUser,
  typingUsers,
  messagesEndRef,
  selectedFiles,
  removeSelectedFile,
  clearAllSelectedFiles,
  messageText,
  setMessageText,
  handleSendMessage,
  fileInputRef,
  handleFileSelect,
  isRecording,
  recordingTime,
  cancelRecording,
  stopRecording,
  startRecording,
  isConnected,
  isUploading,
  inputRef,
  isInCall,
  joinCall,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
  activeEmojiCategory,
  setActiveEmojiCategory,
  handleEmojiClick,
}) => {
  const HeaderIcon = ROOM_ICONS[activeRoom] || Globe;

  return (
    <div className="flex-1 flex flex-col bg-[#0f0c24]/10 min-w-0">
      {/* ── Channel Header ── */}
      <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between bg-[#0f0c24]/50 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shadow-sm flex items-center justify-center">
            <HeaderIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-white capitalize leading-none mb-1 text-lg">
              {activeRoom}
            </h3>
            <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">
              Active Channel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-3.5 py-2 rounded-xl border border-indigo-500/20 flex items-center gap-1.5 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"></span>
            </span>
            <span>Real-time Stream</span>
          </div>
        </div>
      </div>

      {/* ── Message History Region ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0f0c24]/20 scrollbar-hidden">
        {messages.map((msg) => {
          if (msg.type === "system") {
            return (
              <div key={msg.id} className="flex justify-center my-2 message-bubble-anim">
                <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20 shadow-sm backdrop-blur-sm">
                  {msg.message}
                </span>
              </div>
            );
          }

          const isMe = msg.sender?.userId === currentUser?._id;
          const time = new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 mb-1">
                {msg.sender?.avatar && !msg.sender.avatar.includes("default-user") ? (
                  <img
                    src={msg.sender.avatar}
                    alt={msg.sender.name}
                    className={`w-9 h-9 rounded-xl object-cover shadow-sm ${msg.sender?.isPremium
                      ? "border-2 border-amber-400 ring-2 ring-amber-400/20"
                      : "border border-white/10"
                      }`}
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-extrabold text-sm shadow-md ${msg.sender?.isPremium
                    ? "bg-gradient-to-tr from-amber-400 to-amber-600 border-2 border-amber-400 shadow-amber-500/10"
                    : "bg-gradient-to-tr from-sky-400 to-cyan-500 shadow-sky-100"
                    }`}>
                    {msg.sender?.name ? msg.sender.name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
              </div>

              {/* Message Content Bubble */}
              <div className="flex flex-col">
                {!isMe && (
                  <div className="flex items-center gap-1 ml-1.5 mb-1.5">
                    <span className={`text-[11px] font-extrabold ${msg.sender?.isPremium ? "text-amber-400" : "text-gray-400"}`}>
                      {msg.sender?.name}
                    </span>
                    {msg.sender?.isPremium && <span title="Premium VIP" className="text-[10px]">👑</span>}
                  </div>
                )}
                <div
                  className={`px-4 py-2.5 rounded-3xl text-sm leading-relaxed shadow-sm transition-all duration-300 relative group border ${isMe
                    ? msg.sender?.isPremium
                      ? "bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-slate-900 rounded-br-none border-amber-300 shadow-amber-500/20 shadow-md font-medium"
                      : "bg-gradient-to-br from-sky-500 to-cyan-500 text-white rounded-br-none border-sky-500/10 shadow-sky-500/10 shadow-md"
                    : "bg-white/[0.04] text-gray-200 rounded-tl-none border-white/[0.05] shadow-sm hover:shadow-md hover:bg-white/[0.06]"
                    } message-bubble-anim`}
                >
                  {/* Attachments Renderer */}
                  {(() => {
                    const msgAttachments = msg.attachments && msg.attachments.length > 0
                      ? msg.attachments
                      : (msg.fileUrl ? [{ fileUrl: msg.fileUrl, fileType: msg.fileType, fileName: msg.fileName }] : []);
                    const images = msgAttachments.filter(att => att.fileType === "image");
                    const otherFiles = msgAttachments.filter(att => att.fileType === "file");
                    const audios = msgAttachments.filter(att => att.fileType === "audio");

                    return (
                      <>
                        {audios.length > 0 && (
                          <div className="mb-2 space-y-1.5 max-w-sm">
                            {audios.map((audio, idx) => (
                              <VoiceMessagePlayer key={idx} src={audio.fileUrl} isMe={isMe} />
                            ))}
                          </div>
                        )}

                        {images.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {images.map((img, idx) => {
                              const isSingle = images.length === 1;
                              return (
                                <div
                                  key={idx}
                                  className={`overflow-hidden rounded-2xl border border-black/5 shadow-inner flex-shrink-0 ${isSingle ? "max-w-xs max-h-60" : "max-w-[140px] h-[100px] w-[140px]"
                                    }`}
                                >
                                  <img
                                    src={img.fileUrl}
                                    alt={img.fileName || "Image attachment"}
                                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                                    onClick={() => window.open(img.fileUrl, "_blank")}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {otherFiles.length > 0 && (
                          <div className="space-y-1.5 mb-2 max-w-sm">
                            {otherFiles.map((file, idx) => (
                              <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-2xl border ${isMe
                                ? msg.sender?.isPremium
                                  ? "bg-slate-950/10 border-slate-950/25 text-slate-900"
                                  : "bg-white/10 border-white/20 text-white"
                                : "bg-gray-50 border-gray-150 text-gray-800"
                                }`}>
                                <div className={`p-1.5 rounded-xl flex items-center justify-center ${isMe
                                  ? msg.sender?.isPremium
                                    ? "bg-slate-950/20 text-slate-900"
                                    : "bg-white/20"
                                  : "bg-indigo-50 text-indigo-600"
                                  }`}>
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold truncate pr-1">{file.fileName || "Attachment"}</p>
                                  <p className={`text-[9px] ${isMe
                                    ? msg.sender?.isPremium
                                      ? "text-slate-800/80"
                                      : "text-indigo-200"
                                    : "text-gray-400"
                                    }`}>File Attachment</p>
                                </div>
                                <a
                                  href={file.fileUrl}
                                  download={file.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-1.5 rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center ${isMe
                                    ? msg.sender?.isPremium
                                      ? "hover:bg-slate-950/15 text-slate-900"
                                      : "hover:bg-white/20 text-white"
                                    : "hover:bg-gray-100 text-gray-600"
                                    }`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {msg.message && (
                    <p className="break-words whitespace-pre-wrap font-medium text-xs">
                      {msg.message}
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isMe ? "text-indigo-200/80" : "text-gray-400"}`}>
                      {time}
                    </span>
                    {isMe && <Check className="w-3 h-3 text-indigo-200/80" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers[activeRoom] && Object.keys(typingUsers[activeRoom]).length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-2xl w-fit animate-pulse my-2 ml-12">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
            <span>{Object.values(typingUsers[activeRoom]).join(", ")} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Attachment Preview Bar ── */}
      {selectedFiles.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/80 backdrop-blur-md flex flex-wrap gap-3 items-center justify-start animate-fade-in max-h-32 overflow-y-auto">
          {selectedFiles.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5 bg-white p-1.5 pr-2 rounded-2xl border border-gray-150 shadow-sm max-w-xs relative group transition-all duration-300 hover:shadow-md">
              {item.type === "image" && item.previewUrl ? (
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                  <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 w-24">
                <p className="text-[11px] font-bold text-gray-800 truncate leading-tight">{item.file.name}</p>
                <p className="text-[9px] text-gray-400 font-semibold leading-none">
                  {(item.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeSelectedFile(item.id)}
                className="p-1 hover:bg-red-500 hover:text-white rounded-lg text-gray-400 transition-all duration-300 flex items-center justify-center active:scale-95 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={clearAllSelectedFiles}
            className="text-[10px] font-black text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100/50 px-2.5 py-1.5 rounded-xl ml-auto transition-all duration-300"
          >
            Clear All
          </button>
        </div>
      )}

      {/* ── Input Form & Emoji Picker ── */}
      <form
        onSubmit={handleSendMessage}
        className="p-5 border-t border-white/[0.06] bg-[#0c0a1c]/60 backdrop-blur-md flex items-center gap-3 relative animate-fade-in"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/zip"
        />

        {isRecording ? (
          <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 flex items-center justify-between text-red-400 font-bold text-sm animate-pulse">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>Recording Audio... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-250 hover:text-white transition duration-200 text-xs flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" /> Discard
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition duration-205 text-xs flex items-center gap-1.5 active:scale-95 shadow-md shadow-red-500/20"
              >
                <StopCircle className="w-3.5 h-3.5" /> Stop & Send
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || isUploading}
              className="p-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-2xl transition-all duration-300 flex items-center justify-center text-gray-400 hover:text-white active:scale-95 disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={startRecording}
              disabled={!isConnected || isUploading}
              className="p-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-2xl transition-all duration-300 flex items-center justify-center text-gray-400 hover:text-red-400 active:scale-95 disabled:opacity-50"
              title="Record Voice Message"
            >
              <Mic className="w-5 h-5" />
            </button>

            <div className="flex-1 relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={!isConnected}
                placeholder={isConnected ? `Message #${activeRoom}...` : "Connecting to secure channel..."}
                className="w-full bg-white/[0.3%] border border-white/[0.08] rounded-2xl pl-5 pr-28 py-4 text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all duration-300 disabled:opacity-50 placeholder-gray-500"
              />

              <div className="absolute right-3 flex items-center gap-1.5">
                {messageText.trim().length > 0 && (
                  <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                    {messageText.length}/1000
                  </span>
                )}
                {isConnected && !isInCall && (
                  <button
                    type="button"
                    onClick={joinCall}
                    className="p-2 rounded-xl text-gray-400 hover:text-sky-400 hover:bg-white/[0.05] transition-all duration-300 flex items-center justify-center active:scale-95"
                    title="Start Video Call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={!isConnected}
                  className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-95 ${showEmojiPicker
                    ? "bg-sky-500/10 text-sky-400"
                    : "text-gray-400 hover:text-sky-400 hover:bg-white/[0.05]"
                    }`}
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              {/* Emoji Popover */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-18 right-0 z-50 bg-[#120f2e] border border-white/10 rounded-3xl shadow-2xl w-72 p-4 animate-fade-in flex flex-col h-64"
                >
                  <div className="flex justify-between border-b border-white/[0.06] pb-2 mb-2">
                    {EMOJI_CATEGORIES.map((category, idx) => (
                      <button
                        key={category.name}
                        type="button"
                        title={category.name}
                        onClick={() => setActiveEmojiCategory(idx)}
                        className={`p-1.5 rounded-xl transition-all duration-300 text-lg active:scale-95 ${activeEmojiCategory === idx
                          ? "bg-sky-500/10 border border-sky-500/25 scale-105 text-white"
                          : "hover:bg-white/[0.05] text-gray-450"
                          }`}
                      >
                        {category.icon}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-2 scrollbar-hidden">
                    {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji, idx) => (
                      <button
                        key={`${emoji}-${idx}`}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl hover:scale-125 transition-transform duration-200 p-1 rounded-lg hover:bg-white/[0.05] flex items-center justify-center active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={!isConnected || isUploading || (!messageText.trim() && selectedFiles.length === 0)}
          className="p-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white rounded-2xl disabled:opacity-40 transition-all duration-300 shadow-lg shadow-sky-100 hover:shadow-xl hover:shadow-sky-200/30 hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          <Send className="w-5 h-5 transform hover:rotate-12 transition-transform duration-300" />
        </button>
      </form>
    </div>
  );
};

export default MessageContainer;
