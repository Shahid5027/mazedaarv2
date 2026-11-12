"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Globe,
  Sparkles,
  X,
  Send,
  Loader2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  MessageSquare,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";

interface VoiceTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  topicId?: string;
  topicName?: string;
  defaultLang?: "kn-IN" | "hi-IN" | "en-IN";
}

interface ChatTurn {
  id: string;
  sender: "student" | "tutor";
  text: string;
  language: string;
  timestamp: string;
  followUp?: string;
  practicePrompt?: string;
}

export const VoiceTutorModal: React.FC<VoiceTutorModalProps> = ({
  isOpen,
  onClose,
  studentId,
  topicId,
  topicName = "Data Structures & Algorithms",
  defaultLang = "kn-IN",
}) => {
  const [selectedLang, setSelectedLang] = useState<"kn-IN" | "hi-IN" | "en-IN">(defaultLang);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: "intro-1",
      sender: "tutor",
      text:
        defaultLang === "kn-IN"
          ? "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಎಐ ಬೋಧಕ. ನೀವು ಮೈಕ್ರೋಫೋನ್ ಬಳಸಿ ಕನ್ನಡದಲ್ಲಿ ಪ್ರಶ್ನೆ ಕೇಳಬಹುದು."
          : defaultLang === "hi-IN"
          ? "नमस्ते! मैं आपका एआई ट्यूटर हूँ। आप माइक्रोफ़ोन से हिंदी में प्रश्न पूछ सकते हैं।"
          : "Hello! I am your AI Adaptive Tutor. Speak into your microphone or type any question to start.",
      language: defaultLang,
      timestamp: "Just now",
      followUp:
        defaultLang === "kn-IN"
          ? "ಉದಾಹರಣೆಗೆ: ಎವಿಎಲ್ ಮರಗಳಲ್ಲಿ ಬ್ಯಾಲೆನ್ಸ್ ಫ್ಯಾಕ್ಟರ್ ಎಂದರೇನು?"
          : defaultLang === "hi-IN"
          ? "उदाहरण के लिए: AVL ट्री में बैलेंस फैक्टर क्या होता है?"
          : "For example: How do AVL tree rotations restore balance?",
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, liveTranscript, isProcessing]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Update initial greeting when language toggles
  const handleLanguageChange = (lang: "kn-IN" | "hi-IN" | "en-IN") => {
    stopSpeaking();
    setSelectedLang(lang);
    const greeting =
      lang === "kn-IN"
        ? "ಕನ್ನಡ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ಮೈಕ್ರೋಫೋನ್ ಆನ್ ಮಾಡಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮಾತನಾಡಿ."
        : lang === "hi-IN"
        ? "हिंदी भाषा चुनी गई है। माइक्रोफ़ोन शुरू करें और अपना सवाल बोलें।"
        : "English language selected. Tap the microphone and speak your query.";

    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: "tutor",
        text: greeting,
        language: lang,
        timestamp: "Now",
      },
    ]);
  };

  // Speak aloud using SpeechSynthesis
  const speakText = (text: string, langCode: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.95;

    // Attempt to match language voice
    const voices = window.speechSynthesis.getVoices();
    const targetPrefix = langCode.split("-")[0];
    const matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Speech Recognition (Microphone)
  const startListening = () => {
    stopSpeaking();
    setSpeechError(null);
    setLiveTranscript("");

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(
        "Microphone speech recognition is not supported in this browser. Please use the text input below."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setLiveTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone permission denied. Please allow microphone access or type your question.");
        } else if (event.error !== "no-speech") {
          setSpeechError(`Speech error: ${event.error}. You can also type your question.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (liveTranscript.trim()) {
          processQuestion(liveTranscript.trim());
          setLiveTranscript("");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setSpeechError(err.message || "Failed to start speech recognition.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  // Process Query with Backend AI Voice Tutor
  const processQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;

    // 1. Append student message
    const userTurn: ChatTurn = {
      id: `stu-${Date.now()}`,
      sender: "student",
      text: queryText,
      language: selectedLang,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userTurn]);
    setTextInput("");
    setIsProcessing(true);

    try {
      const res = await api.queryVoiceTutor({
        student_id: studentId,
        question: queryText,
        language: selectedLang,
        topic_id: topicId,
      });

      if (res.success && res.data) {
        const d = res.data;
        const tutorTurn: ChatTurn = {
          id: `tut-${Date.now()}`,
          sender: "tutor",
          text: d.response_text,
          language: selectedLang,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          followUp: d.follow_up_question,
          practicePrompt: d.practice_prompt,
        };
        setMessages((prev) => [...prev, tutorTurn]);

        // Speak response aloud automatically for speech-to-speech loop!
        speakText(d.response_text, selectedLang);
      } else {
        const fallbackTurn: ChatTurn = {
          id: `tut-${Date.now()}`,
          sender: "tutor",
          text: "I experienced a temporary difficulty processing that concept. Let me explain the core invariant: focus on the fundamental definition and step-by-step state representations.",
          language: selectedLang,
          timestamp: "Now",
        };
        setMessages((prev) => [...prev, fallbackTurn]);
      }
    } catch (err: any) {
      setSpeechError(err.message || "Failed to reach AI Tutor.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) {
      processQuestion(textInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col h-[650px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Conversational AI Voice Tutor</h3>
                <span className="editorial-tag text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  PS1 Multilingual
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{topicName} • Real-time Speech-to-Speech</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector Pills */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs shadow-2xs">
              <button
                onClick={() => handleLanguageChange("kn-IN")}
                className={`px-2 py-1 rounded font-semibold transition ${
                  selectedLang === "kn-IN"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ಕನ್ನಡ
              </button>
              <button
                onClick={() => handleLanguageChange("hi-IN")}
                className={`px-2 py-1 rounded font-semibold transition ${
                  selectedLang === "hi-IN"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => handleLanguageChange("en-IN")}
                className={`px-2 py-1 rounded font-semibold transition ${
                  selectedLang === "en-IN"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={() => {
                stopSpeaking();
                stopListening();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Audio Status Ribbon */}
        {(isListening || isSpeaking || isProcessing) && (
          <div className="px-4 py-2 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2 font-medium">
              {isListening && (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>Listening in {selectedLang === "kn-IN" ? "Kannada" : selectedLang === "hi-IN" ? "Hindi" : "English"}... Speak your question</span>
                </>
              )}
              {isSpeaking && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AI Tutor is speaking aloud...</span>
                </>
              )}
              {isProcessing && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Analyzing question and synthesizing adaptive response...</span>
                </>
              )}
            </div>

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-2 py-0.5 rounded bg-white border border-indigo-200 text-indigo-700 font-semibold text-[11px] hover:bg-indigo-100 flex items-center gap-1"
              >
                <Square className="w-3 h-3" />
                <span>Interrupt / Mute</span>
              </button>
            )}
          </div>
        )}

        {speechError && (
          <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Scrollable Conversation History */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          {messages.map((turn) => {
            const isStudent = turn.sender === "student";
            return (
              <div
                key={turn.id}
                className={`flex flex-col ${isStudent ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-600">
                    {isStudent ? "You" : "AI Voice Tutor"}
                  </span>
                  <span>•</span>
                  <span>{turn.timestamp}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                    isStudent
                      ? "bg-slate-900 text-white rounded-br-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{turn.text}</p>

                  {!isStudent && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <button
                        onClick={() => speakText(turn.text, turn.language)}
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay Audio</span>
                      </button>

                      {turn.practicePrompt && (
                        <span className="editorial-tag text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium">
                          Practice Active
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Follow-up question suggestion pill */}
                {turn.followUp && !isStudent && (
                  <button
                    onClick={() => processQuestion(turn.followUp!)}
                    className="mt-2 text-left p-2 rounded-xl border border-indigo-100 bg-indigo-50/60 hover:bg-indigo-100 text-[11px] text-indigo-900 transition flex items-center gap-2 max-w-[85%]"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-medium truncate">{turn.followUp}</span>
                    <ChevronRight className="w-3 h-3 ml-auto text-indigo-400 shrink-0" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Live recognition bubble */}
          {liveTranscript && (
            <div className="flex flex-col items-end animate-pulse">
              <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-xs bg-slate-800 text-slate-200 border border-slate-700">
                <span className="text-[10px] text-indigo-300 block mb-0.5">Listening:</span>
                <p>{liveTranscript}...</p>
              </div>
            </div>
          )}
        </div>

        {/* Input & Microphone Control Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            {/* Primary Microphone Voice Trigger */}
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 shadow-sm ${
                isListening
                  ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
              title={isListening ? "Stop listening" : "Start speaking question"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Fallback Text Input */}
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                selectedLang === "kn-IN"
                  ? "ಮೈಕ್ ಬಳಸಿ ಮಾತನಾಡಿ ಅಥವಾ ಇಲ್ಲಿ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ..."
                  : selectedLang === "hi-IN"
                  ? "माइक से बोलें या यहाँ प्रश्न टाइप करें..."
                  : "Speak into microphone or type your question..."
              }
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
            />

            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-40 shrink-0"
              title="Send text query"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span>Powered by EDUCORE Multilingual Curriculum RAG</span>
            <span>Microphone Audio • Web Speech Synthesis Live</span>
          </div>
        </div>

      </div>
    </div>
  );
};

