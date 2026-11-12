"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { AIFeedbackPayload } from "@/lib/types";

interface FeedbackBreakdownProps {
  feedback: AIFeedbackPayload;
  className?: string;
}

export const FeedbackBreakdown: React.FC<FeedbackBreakdownProps> = ({
  feedback,
  className = "",
}) => {
  if (!feedback) {
    return (
      <div className={`p-4 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-500 italic ${className}`}>
        No automated conceptual feedback recorded for this submission.
      </div>
    );
  }

  // Gracefully handle string feedback
  if (typeof feedback === "string") {
    return (
      <div className={`p-4 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-700 leading-relaxed font-sans ${className}`}>
        <p className="font-semibold text-slate-900 mb-1">Evaluator Notes:</p>
        <p className="whitespace-pre-wrap">{feedback}</p>
      </div>
    );
  }

  const {
    correct_concepts = [],
    missing_concepts = [],
    incorrect_concepts = [],
    suggestions = [],
  } = feedback;

  const hasAnyEntries =
    (correct_concepts && correct_concepts.length > 0) ||
    (missing_concepts && missing_concepts.length > 0) ||
    (incorrect_concepts && incorrect_concepts.length > 0) ||
    (suggestions && suggestions.length > 0);

  if (!hasAnyEntries) {
    return (
      <div className={`p-4 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-500 italic ${className}`}>
        Evaluation completed with no specific concept discrepancies identified.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 1. Correct Concepts */}
      {correct_concepts && correct_concepts.length > 0 && (
        <div className="p-3.5 rounded-lg border border-emerald-200/80 bg-emerald-50/40 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Correct Concepts ({correct_concepts.length})</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-emerald-950 font-sans">
            {correct_concepts.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {typeof item === "string" ? item : String(item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 2. Missing Concepts */}
      {missing_concepts && missing_concepts.length > 0 && (
        <div className="p-3.5 rounded-lg border border-amber-200/80 bg-amber-50/40 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Missing Concepts ({missing_concepts.length})</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-amber-950 font-sans">
            {missing_concepts.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {typeof item === "string" ? item : String(item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Incorrect Concepts */}
      {incorrect_concepts && incorrect_concepts.length > 0 && (
        <div className="p-3.5 rounded-lg border border-rose-200/80 bg-rose-50/40 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Incorrect Concepts &amp; Contradictions ({incorrect_concepts.length})</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-rose-950 font-sans">
            {incorrect_concepts.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {typeof item === "string" ? item : String(item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Improvement Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="p-3.5 rounded-lg border border-indigo-200/80 bg-indigo-50/40 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-indigo-900">
            <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Improvement Suggestions ({suggestions.length})</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-indigo-950 font-sans">
            {suggestions.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {typeof item === "string" ? item : String(item)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

