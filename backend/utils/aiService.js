const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../config/logger");
const fs = require("fs");
const path = require("path");

async function generateAIResponse(prompt, audioFilePath = null) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== "" && apiKey !== "your_gemini_api_key_here") {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      let contents = [];
      
      if (audioFilePath) {
        const resolvedPath = path.resolve(audioFilePath);
        if (fs.existsSync(resolvedPath)) {
          const audioBuffer = fs.readFileSync(resolvedPath);
          const audioData = {
            inlineData: {
              data: audioBuffer.toString("base64"),
              mimeType: "audio/webm"
            }
          };
          contents.push(audioData);
          contents.push({ text: "The user has uploaded a voice message. Please listen to the audio, transcribe what they said, and then respond directly to their query in a helpful, conversational manner. Format your response with a transcription section at the beginning: '🎙️ **Voice Transcription:** [Your transcription here]\n\n[Your response here]'" });
        } else {
          logger.error(`Audio file not found at path: ${resolvedPath}`);
          contents.push({ text: prompt || "Hello" });
        }
      } else {
        contents.push({ text: prompt || "Hello" });
      }

      const result = await model.generateContent(contents);
      const response = await result.response;
      return response.text();
    } catch (err) {
      logger.error(`Gemini API Error: ${err.message}`);
      // Fall through to smart simulator on failure
    }
  }

  // Smart local simulator fallback
  if (audioFilePath) {
    return "🎙️ **Voice Transcription (Simulated):**\n*\"Hi there! I am testing the voice recorder feature in this premium glassmorphic chat application. Let me know if you can hear this!\"*\n\n---\n\nI have successfully received and transcribed your voice message! 🎙️✨ I'm running in simulator mode right now. Once you set a valid `GEMINI_API_KEY` in the backend environment, I'll transcribe your real voice recordings live using Gemini's multimodal audio processing! What would you like to build next?";
  }

  const lower = prompt.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! I am your AI Assistant. How can I help you today? I can help with coding questions, discuss ideas, or just chat! 🤖✨";
  }
  if (lower.includes("voice") || lower.includes("audio") || lower.includes("record")) {
    return "I see you are interested in voice messages! You can record a message using the microphone icon next to the input field. Once sent, it will render as a premium customized playback widget right in the chat room! 🎙️🎧";
  }
  if (lower.includes("theme") || lower.includes("color") || lower.includes("style")) {
    return "Our application features a premium dark navy-slate background gradient with vibrant Electric Blue and Cyan themes. It uses modern glassmorphic styling to make UI elements pop! 🎨⚡";
  }
  if (lower.includes("help") || lower.includes("features")) {
    return "Here are the awesome features you can try in this chat application:\n1. 🤖 **AI Assistant**: Just chat in the #ai-companion room or mention @ai or @bot.\n2. 🎙️ **Voice Recording**: Send audio recordings easily.\n3. 📞 **Video Calling**: Real-time WhatsApp-style group video calling.\n4. 👑 **Premium VIP Upgrades**: Special tags and custom avatars!";
  }
  if (lower.includes("who are you") || lower.includes("your name")) {
    return "I am your built-in AI Assistant, powered by Google's generative models! I'm integrated directly into the chat socket system to respond instantly to your queries. 🤖🚀";
  }

  return `Thanks for your message: "${prompt}". I'm your AI Companion, currently running in simulator mode. Set a valid GEMINI_API_KEY in the environment file to enable live LLM-powered responses. What else can I help you build? 💡`;
}

module.exports = { generateAIResponse };
