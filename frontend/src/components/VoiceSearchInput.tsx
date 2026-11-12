"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle, Volume2, Globe, CheckCircle2 } from "lucide-react";

interface VoiceSearchInputProps {
  onTranscript: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export const VoiceSearchInput: React.FC<VoiceSearchInputProps> = ({
  onTranscript,
  placeholder = "Search syllabus concepts or ask a question...",
  className = "",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState("hi-IN"); // Default to Hindi, can switch to Kannada (kn-IN) or English (en-IN)
  const [isSupported, setIsSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setStatusMessage("Web Speech API is not supported in this browser. Please use keyboard input or Chrome/Edge.");
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage("Speech recognition unavailable. Please use modern Chrome/Edge.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage(
          selectedLang === "kn-IN"
            ? "ಧ್ವನಿ ರೆಕಾರ್ಡಿಂಗ್ ಪ್ರಾರಂಭವಾಗಿದೆ... (ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ)"
            : selectedLang === "hi-IN"
            ? "आवाज़ रिकॉर्डिंग शुरू है... (हिंदी में बोलें)"
            : "Listening... (Speak your question in English)"
        );
        setInterimText("");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimText(interim);
        }

        if (final) {
          setInterimText(final);
          onTranscript(final);
          setStatusMessage(`Recognized: "${final}"`);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setStatusMessage("Microphone permission was denied. Please allow microphone access in browser settings.");
        } else if (event.error === "no-speech") {
          setStatusMessage("No speech detected. Please speak closer to microphone.");
        } else {
          setStatusMessage(`Speech recognition error: ${event.error}. You can also type text directly.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error(err);
      setIsListening(false);
      setStatusMessage("Could not initialize microphone. Please check system permissions.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Language Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs shrink-0">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-600">Voice Lang:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isListening}
            className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
          >
            <option value="kn-IN">ಕನ್ನಡ (Kannada - kn-IN)</option>
            <option value="hi-IN">हिंदी (Hindi - hi-IN)</option>
            <option value="en-IN">English (India - en-IN)</option>
          </select>
        </div>

        {/* Microphone Action Button */}
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            isListening
              ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
          title={isListening ? "Stop listening" : "Click to speak in selected language"}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4 animate-bounce" />
              <span>Recording... (Click to stop)</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Speak Query (ಕನ್ನಡ / हिंदी / Eng)</span>
            </>
          )}
        </button>
      </div>

      {/* Live Transcript / Interim feedback */}
      {interimText && (
        <div className="p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs flex items-center gap-2 animate-in fade-in">
          <Volume2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="text-slate-500 font-medium">Spoken: </span>
          <span className="font-bold text-indigo-900 font-mono">{interimText}</span>
        </div>
      )}

      {/* Status Notice / Fallback Warning */}
      {statusMessage && (
        <div
          className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
            statusMessage.includes("error") || statusMessage.includes("not supported") || statusMessage.includes("denied")
              ? "bg-amber-50 border border-amber-200 text-amber-900"
              : "bg-slate-50 border border-slate-200 text-slate-700"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};

