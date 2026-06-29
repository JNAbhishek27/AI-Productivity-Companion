import { useState, useEffect, useRef, FormEvent } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles, RefreshCw, MessageSquare } from "lucide-react";
import { ChatMessage, VoiceState } from "../types";

interface AuraVoiceCoachProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => void;
  isChatLoading: boolean;
  tasksCount: number;
}

export default function AuraVoiceCoach({
  chatHistory,
  onSendMessage,
  isChatLoading,
  tasksCount
}: AuraVoiceCoachProps) {
  const [inputText, setInputText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatLoading]);

  // Handle Vocal Speech Synthesis (Speaking)
  useEffect(() => {
    if (chatHistory.length > 0 && voiceEnabled) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (lastMessage.role === "assistant") {
        speakText(lastMessage.content);
      }
    }
  }, [chatHistory, voiceEnabled]);

  // Clean up synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Set up Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          onSendMessage(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone access denied. Please allow microphone permissions in settings.");
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      console.warn("Speech recognition is not supported in this browser.");
    }
  }, [onSendMessage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage("Speech recognition is not supported on this browser version. Please type your command.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        // Stop any ongoing speech first so it doesn't feed back
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel current speaking
    window.speechSynthesis.cancel();

    // Clean text from markdown bold/asterisks for natural speaking
    const cleanText = text.replace(/[*#_`~-]/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose a high quality premium sounding english voice if available
    const voices = window.speechSynthesis.getVoices();
    const auraVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || 
                      voices.find(v => v.lang.startsWith("en") && v.name.includes("Natural")) || 
                      voices.find(v => v.lang.startsWith("en"));
    if (auraVoice) {
      utterance.voice = auraVoice;
    }

    utterance.rate = 1.05; // Slightly faster natural pacing
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSendText = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  return (
    <div id="aura-coach-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[550px]">
      
      {/* Visualizer Aura Orb & Voice Options (Left Panel) */}
      <div className="lg:col-span-4 bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm flex flex-col justify-between items-center text-center">
        <div className="w-full">
          <div className="flex items-center justify-between mb-4 w-full">
            <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-500">Companion Interface</span>
            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setVoiceEnabled(!voiceEnabled);
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                voiceEnabled 
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                  : "bg-zinc-800 border-zinc-700 text-zinc-500"
              }`}
              title={voiceEnabled ? "Voice Enabled" : "Voice Muted"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <h3 className="text-base font-bold text-zinc-100">Meet Aura</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-[200px] mx-auto">
            Your personal vocal focus coach. Talk or type to plan, review, and organize.
          </p>
        </div>

        {/* Dynamic Glowing Aura Orb */}
        <div className="relative my-8">
          {/* Outer Pulsing Glows */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/30 to-violet-500/30 blur-2xl transition-all duration-700 ${
            isListening ? "scale-150 animate-ping opacity-60" : isChatLoading ? "scale-125 animate-pulse opacity-40" : "scale-100 opacity-20"
          }`} />

          {/* Core Orb */}
          <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg transition-transform duration-300 ${
            isListening ? "scale-110 shadow-indigo-500/50" : "hover:scale-105"
          }`}>
            <Sparkles className={`w-12 h-12 text-white/95 ${isListening ? "animate-spin" : isChatLoading ? "animate-pulse" : ""}`} />
          </div>

          {/* Listening Orb Overlay text */}
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-950 text-zinc-100 border border-zinc-800 text-[10px] font-bold tracking-widest uppercase rounded-full shadow-md font-mono whitespace-nowrap">
            {isListening ? "Listening..." : isChatLoading ? "Thinking..." : "Idle / Aura"}
          </span>
        </div>

        {/* Microphone triggering */}
        <div className="w-full space-y-2">
          {errorMessage && (
            <p className="text-[10px] text-rose-400 bg-rose-500/5 border border-rose-500/20 p-2 rounded-xl text-center leading-tight">
              {errorMessage}
            </p>
          )}

          <button
            onClick={toggleListening}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isListening 
                ? "bg-rose-600 text-white animate-pulse" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isListening ? "Pause Listening" : "Talk to Aura (Voice)"}
          </button>
          <span className="text-[10px] text-zinc-500 block">
            Supports Chrome, Safari & Edge Web Speech transcription.
          </span>
        </div>
      </div>

      {/* Interactive Chat Board (Right Panel) */}
      <div className="lg:col-span-8 bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm flex flex-col justify-between h-full min-h-[450px]">
        
        {/* Chat History Header */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-zinc-300">Daily Coaching Session</h3>
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1 max-h-[300px]">
          {chatHistory.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-zinc-900 text-zinc-100 rounded-bl-none border border-zinc-800/80"
                }`}
              >
                {m.content}
                <span className={`text-[9px] block mt-1 text-right font-mono opacity-60 ${m.role === "user" ? "text-indigo-200" : "text-zinc-500"}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800/80 text-zinc-400 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                Aura is contemplating...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Text box submission */}
        <form onSubmit={handleSendText} className="flex gap-2 pt-3 border-t border-zinc-800">
          <input
            type="text"
            placeholder="Type your message, ask to priority rank, schedule or decompose..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isChatLoading}
            className="flex-1 px-4 py-2.5 text-xs border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isChatLoading || !inputText.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
