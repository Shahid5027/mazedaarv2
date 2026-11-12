"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Volume2, Globe, AlertCircle, Sparkles } from "lucide-react";

interface SpeechPlayerProps {
  textKannada?: string;
  textHindi?: string;
  textEnglish?: string;
  defaultLang?: "kn-IN" | "hi-IN" | "en-IN";
  title?: string;
  className?: string;
}

export const SpeechPlayer: React.FC<SpeechPlayerProps> = ({
  textKannada = "ಈ ಪರಿಕಲ್ಪನೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು, ಮೊದಲು ಮೂಲಭೂತ ಪ್ರಮೇಯಗಳನ್ನು ಗಮನಿಸಿ.",
  textHindi = "इस अवधारणा को स्पष्ट रूप से समझने के लिए, मूलभूत नियमों और उदाहरणों का अध्ययन करें।",
  textEnglish = "To master this concept thoroughly, focus on understanding the underlying structural invariants.",
  defaultLang = "hi-IN",
  title = "Audio Remedial Explanation",
  className = "",
}) => {
  const [selectedLang, setSelectedLang] = useState<"kn-IN" | "hi-IN" | "en-IN">(defaultLang);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isFallbackVoice, setIsFallbackVoice] = useState(false);
  const [activeVoiceName, setActiveVoiceName] = useState<string>("");
  const [isSupported, setIsSupported] = useState(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getActiveText = () => {
    if (selectedLang === "kn-IN") return textKannada;
    if (selectedLang === "hi-IN") return textHindi;
    return textEnglish;
  };

  const handlePlay = () => {
    if (!isSupported) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const textToSpeak = getActiveText();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = selectedLang;
    utterance.rate = 0.95; // slightly slower for better academic comprehension
    utterance.pitch = 1.0;

    // Search for optimal voice matching the language tag
    const langPrefix = selectedLang.split("-")[0]; // 'kn', 'hi', or 'en'
    let matchedVoice = availableVoices.find((v) => v.lang.toLowerCase() === selectedLang.toLowerCase());

    if (!matchedVoice) {
      // Try prefix match (e.g. hi-IN or hi)
      matchedVoice = availableVoices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      setIsFallbackVoice(false);
      setActiveVoiceName(matchedVoice.name);
    } else {
      // Fallback voice notification
      setIsFallbackVoice(true);
      const defaultVoice = availableVoices.find((v) => v.default) || availableVoices[0];
      if (defaultVoice) {
        utterance.voice = defaultVoice;
        setActiveVoiceName(`${defaultVoice.name} (OS System Fallback)`);
      } else {
        setActiveVoiceName("Browser Generic TTS Voice");
      }
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis utterance error:", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
        <span>Text-to-Speech is not supported by your current browser. You can still read the textual explanation below.</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white space-y-3 ${className}`}>
      {/* Header with Title and Language Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-bold text-xs text-slate-900">{title}</span>
          {isPlaying && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
          )}
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              handleStop();
              setSelectedLang("kn-IN");
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              selectedLang === "kn-IN"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            ಕನ್ನಡ (Kannada)
          </button>
          <button
            type="button"
            onClick={() => {
              handleStop();
              setSelectedLang("hi-IN");
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              selectedLang === "hi-IN"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            हिंदी (Hindi)
          </button>
          <button
            type="button"
            onClick={() => {
              handleStop();
              setSelectedLang("en-IN");
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              selectedLang === "en-IN"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPaused ? "Resume Audio" : "Listen Spoken Explanation"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Audio</span>
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}
        </div>

        {/* Voice indicator */}
        {activeVoiceName && (
          <span className="text-[10px] text-slate-500 line-clamp-1 max-w-[200px]" title={activeVoiceName}>
            Voice: {activeVoiceName}
          </span>
        )}
      </div>

      {/* Fallback Voice Notice */}
      {isFallbackVoice && (
        <div className="p-2 rounded-lg bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Notice: Specific regional {selectedLang === "kn-IN" ? "Kannada" : "Hindi"} voice synthesizer is not installed on this OS. Using fallback speech engine.
          </span>
        </div>
      )}

      {/* Spoken Text Display */}
      <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
        <p className="font-medium">{getActiveText()}</p>
      </div>
    </div>
  );
};

