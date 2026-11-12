"use client";

import React, { useState } from "react";
import { X, BookOpen, Video, Languages, CheckCircle2, ArrowRight } from "lucide-react";

interface RemedialResourceModalProps {
  resource: {
    resource_id: string;
    topic_id: string;
    topic_name: string;
    title: string;
    type: string;
    estimated_minutes: number;
    language: string;
    content_summary: string;
    url?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RemedialResourceModal: React.FC<RemedialResourceModalProps> = ({
  resource,
  isOpen,
  onClose,
}) => {
  const [lang, setLang] = useState<"en" | "hi">((resource?.language as "en" | "hi") || "en");
  const [completed, setCompleted] = useState(false);

  if (!isOpen || !resource) return null;

  const contentMap: Record<string, { en: string; hi: string }> = {
    REM_001: {
      en: "AVL trees are self-balancing binary search trees where the heights of the two child subtrees of any node differ by at most one. When an insertion causes an imbalance (Balance Factor > 1 or < -1), four rotation cases restore the invariant:\n\n1. Left-Left (LL): Single Right Rotation\n2. Right-Right (RR): Single Left Rotation\n3. Left-Right (LR): Left Rotation on child, then Right Rotation on parent\n4. Right-Left (RL): Right Rotation on child, then Left Rotation on parent.",
      hi: "एवीएल ट्री (AVL Tree) एक सेल्फ-बैलेंसिंग बाइनरी सर्च ट्री है जिसमें किसी भी नोड के बाएँ और दाएँ सब-ट्री की ऊँचाइयों का अंतर अधिक से अधिक 1 हो सकता है।\n\nचार मुख्य रोटेशन स्थितियाँ होती हैं:\n१. लेफ्ट-लेफ्ट (LL): सिंगल राइट रोटेशन\n२. राइट-राइट (RR): सिंगल लेफ्ट रोटेशन\n३. लेफ्ट-राइट (LR): डबल रोटेशन\n४. राइट-लेफ्ट (RL): डबल रोटेशन।",
    },
    REM_002: {
      en: "Binary Search Tree (BST) property dictates that for any node X, all values in its left subtree are strictly smaller than X, and all values in its right subtree are strictly greater. Inorder traversal (Left, Root, Right) always outputs values in sorted ascending order.",
      hi: "बाइनरी सर्च ट्री (BST) में प्रत्येक नोड के बाएँ सब-ट्री के सभी मान छोटे होते हैं और दाएँ सब-ट्री के मान बड़े होते हैं। इनऑर्डर ट्रैवर्सल (Left -> Root -> Right) हमेशा तत्वों को आरोही (बढ़ते) क्रम में प्रस्तुत करता है।",
    },
    REM_003: {
      en: "Backpropagation computes the gradient of the loss function with respect to each weight by applying the calculus chain rule backward from the output layer to the input layer. With Sigmoid activations, gradients can vanish because the derivative reaches a maximum of only 0.25.",
      hi: "बैकप्रोपेगेशन (Backpropagation) आउटपुट लेयर से इनपुट लेयर की ओर चेन रूल (Chain Rule) लागू करके प्रत्येक भार (Weight) के सापेक्ष लॉस के ग्रेडिएंट की गणना करता है। सिग्मॉइड एक्टिवेशन में डेरिवेटिव अधिकतम 0.25 होने के कारण ग्रेडिएंट वैनिशिंग (गायब) हो सकती है।",
    },
    REM_004: {
      en: "Dynamic Programming solves complex problems by breaking them into overlapping subproblems with optimal substructure. Step 1: Identify state parameters. Step 2: Formulate the recurrence relation. Step 3: Define base cases. Step 4: Choose between memoization (top-down) or tabulation (bottom-up).",
      hi: "डायनामिक प्रोग्रामिंग (DP) समस्याओं को छोटे ओवरलैपिंग सब-प्रॉब्लम्स में विभाजित करके हल करती है। चरण १: स्टेट वैरिएबल्स की पहचान। चरण २: रिकरेंस संबंध बनाना। चरण ३: बेस केस तय करना। चरण ४: मेमोइज़ेशन या टेबुलेशन का चयन।",
    },
  };

  const detailedLesson = contentMap[resource.resource_id] || {
    en: resource.content_summary,
    hi: resource.content_summary,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 bg-gradient-to-r from-indigo-800 to-indigo-950 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/30 text-indigo-100 border border-indigo-400/40">
                Remedial Concept Hub
              </span>
              <span className="text-xs text-indigo-200">{resource.estimated_minutes} Min Module</span>
            </div>
            <h3 className="text-lg font-bold mt-1">{resource.title}</h3>
            <p className="text-xs text-indigo-200">Focus Topic: {resource.topic_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Language Switcher */}
          <div className="flex items-center justify-between p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-700">Multilingual Instruction Delivery</span>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 rounded text-xs font-bold transition ${
                  lang === "en" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang("hi")}
                className={`px-3 py-1 rounded text-xs font-bold transition ${
                  lang === "hi" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                हिंदी (Hindi)
              </button>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              {lang === "en" ? "Structured Remedial Walkthrough" : "सरल अवधारणा व्याख्या"}
            </h4>
            <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
              {detailedLesson[lang]}
            </div>
          </div>

          {/* Verification check */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${completed ? "text-emerald-600" : "text-slate-400"}`} />
              <span className="font-medium text-slate-700">
                {completed ? "Remedial Concept Reviewed and Verified!" : "Mark step as reviewed after reading"}
              </span>
            </div>
            <button
              onClick={() => setCompleted(!completed)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                completed
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {completed ? "Completed ✓" : "Mark as Done"}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-md shadow-indigo-600/30"
            >
              Return to Adaptive Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

