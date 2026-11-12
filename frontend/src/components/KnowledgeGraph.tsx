"use client";

import React, { useState } from "react";
import {
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Volume2,
  BookOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { SpeechPlayer } from "./SpeechPlayer";

export interface ConceptNode {
  id: string;
  label: string;
  type: string;
  status: string; // "mastered" | "in_progress" | "remedial"
  mastery?: number; // e.g. 88, 62, 35
  description?: string;
  prerequisites?: string[];
  remedialLesson?: {
    title: string;
    englishSummary: string;
    hindiSummary: string;
    kannadaSummary: string;
  };
}

interface KnowledgeGraphProps {
  topicName: string;
  nodes: any[];
  prerequisites?: string[];
  onLaunchQuiz?: (conceptId?: string) => void;
  className?: string;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  topicName,
  nodes,
  prerequisites = [],
  onLaunchQuiz,
  className = "",
}) => {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || "");
  const [showAudioModal, setShowAudioModal] = useState(false);

  // Map nodes to enriched concepts with mastery values and positions
  const enrichedNodes: ConceptNode[] = nodes.map((n, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === nodes.length - 1;
    let status = n.status || "in_progress";
    let mastery = n.mastery ?? (status === "mastered" ? 88 : status === "remedial" ? 38 : 64);

    return {
      id: n.id || `C_${idx}`,
      label: n.label || n.name || `Concept ${idx + 1}`,
      type: n.type || "algorithmic",
      status: status,
      mastery: mastery,
      description:
        n.description ||
        `Core theoretical invariant and operational mechanics for ${n.label || "this concept"}.`,
      prerequisites: idx > 0 ? [nodes[idx - 1].label || nodes[idx - 1].id] : [],
      remedialLesson: {
        title: `Remedial Module: ${n.label || "Concept Foundation"}`,
        englishSummary: `Understanding ${n.label}: Verify structural balance invariants and worst-case logarithmic properties before executing transformations.`,
        hindiSummary: `${n.label} को समझें: संरचनात्मक संतुलन नियमों और लघुगणकीय सीमाओं की पुष्टि करें ताकि एल्गोरिथ्म प्रभावी रहे।`,
        kannadaSummary: `${n.label} ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ: ರಚನಾತ್ಮಕ ಸಮತೋಲನ ನಿಯಮಗಳನ್ನು ಮತ್ತು ಲಾಗರಿಥಮಿಕ್ ಮಿತಿಗಳನ್ನು ಗಮನಿಸಿ.`,
      },
    };
  });

  const selectedNode = enrichedNodes.find((n) => n.id === selectedNodeId) || enrichedNodes[0];

  const getNodeColor = (status: string) => {
    switch (status) {
      case "mastered":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-500",
          text: "text-emerald-900",
          badge: "bg-emerald-100 text-emerald-800",
          ring: "ring-emerald-400",
          fill: "#10b981",
        };
      case "remedial":
        return {
          bg: "bg-rose-50",
          border: "border-rose-500",
          text: "text-rose-900",
          badge: "bg-rose-100 text-rose-800",
          ring: "ring-rose-400",
          fill: "#f43f5e",
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-500",
          text: "text-blue-900",
          badge: "bg-blue-100 text-blue-800",
          ring: "ring-blue-400",
          fill: "#3b82f6",
        };
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <GitBranch className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Interactive Concept Knowledge Graph</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any concept node to inspect prerequisite dependency paths, mastery status, and targeted audio remediation.
          </p>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 text-slate-600 hover:text-slate-900 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[10px] font-mono text-slate-500">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1 text-slate-600 hover:text-slate-900 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1.0)}
              className="p-1 text-slate-600 hover:text-slate-900 transition border-l border-slate-200"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Mastered (&ge;80%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> 50-79%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> &lt;50%
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Visual Graph Canvas */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/60 p-6 min-h-[220px] flex items-center justify-center">
        <div
          className="transition-transform duration-200 flex flex-wrap items-center justify-center gap-6 relative"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {enrichedNodes.map((node, idx) => {
            const isSelected = selectedNode?.id === node.id;
            const colors = getNodeColor(node.status);

            return (
              <React.Fragment key={node.id}>
                {/* Node Pill */}
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`group relative p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center text-center w-48 shadow-sm cursor-pointer ${
                    colors.bg
                  } ${colors.border} ${
                    isSelected ? "ring-4 ring-indigo-500/30 scale-105 shadow-md" : "hover:scale-102"
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Step {idx + 1}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${colors.badge}`}>
                      {node.mastery}%
                    </span>
                  </div>

                  <p className={`text-xs font-black line-clamp-1 ${colors.text}`}>{node.label}</p>
                  <p className="text-[10px] text-slate-500 capitalize mt-0.5">{node.type} concept</p>

                  {/* Mastery Progress Bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${node.mastery}%`, backgroundColor: colors.fill }}
                    />
                  </div>
                </button>

                {/* Prerequisite Link Connector Arrow */}
                {idx < enrichedNodes.length - 1 && (
                  <div className="hidden md:flex flex-col items-center text-slate-400">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">prereq</span>
                    <div className="flex items-center font-bold text-sm text-indigo-400">
                      ──────►
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Concept Deep-Dive Inspector Drawer */}
      {selectedNode && (
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px] uppercase tracking-wider">
                  Active Concept Focus
                </span>
                <span className="text-xs font-bold text-slate-900">{selectedNode.label}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{selectedNode.description}</p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowAudioModal((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition shadow-2xs cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Audio Lesson (ಕನ್ನಡ / हिंदी)</span>
              </button>

              <button
                type="button"
                onClick={() => onLaunchQuiz && onLaunchQuiz(selectedNode.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test Concept</span>
              </button>
            </div>
          </div>

          {/* Prerequisite Chain Details */}
          {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-indigo-100/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Prerequisite dependencies required before mastery: </span>
              <strong className="text-slate-700">{selectedNode.prerequisites.join(", ")}</strong>
            </div>
          )}

          {/* Inline Audio Player Component if toggled */}
          {showAudioModal && selectedNode.remedialLesson && (
            <div className="pt-2 animate-in fade-in duration-150">
              <SpeechPlayer
                title={`Spoken Remedial Audio: ${selectedNode.label}`}
                textEnglish={selectedNode.remedialLesson.englishSummary}
                textHindi={selectedNode.remedialLesson.hindiSummary}
                textKannada={selectedNode.remedialLesson.kannadaSummary}
                defaultLang="hi-IN"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
