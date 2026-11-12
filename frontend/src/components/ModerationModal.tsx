"use client";

import React, { useState } from "react";
import { X, CheckCircle2, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

interface ModerationModalProps {
  evaluation: any;
  isOpen: boolean;
  onClose: () => void;
  onModerated: () => void;
}

export const ModerationModal: React.FC<ModerationModalProps> = ({
  evaluation,
  isOpen,
  onClose,
  onModerated,
}) => {
  const [overrideScore, setOverrideScore] = useState<number>(
    evaluation?.moderator_override_score ?? evaluation?.total_score ?? 0
  );
  const [notes, setNotes] = useState<string>(evaluation?.moderator_notes ?? "");
  const [saving, setSaving] = useState(false);

  if (!isOpen || !evaluation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api.overrideEvaluation(evaluation.evaluation_id, {
      moderator_override_score: Number(overrideScore),
      moderator_notes: notes,
    });
    if (res.success) {
      onModerated();
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
          <div>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-purple-500/30 text-purple-100 border border-purple-400/40">
              PS2 Faculty Moderation
            </span>
            <h3 className="text-lg font-bold mt-1">Score Override & Quality Review</h3>
            <p className="text-xs text-purple-200">
              Evaluation ID: {evaluation.evaluation_id} (Student: {evaluation.student_id})
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-purple-900">Human-in-the-Loop Moderation Protocol</p>
              <p className="text-purple-700 text-[11px] mt-0.5">
                Faculty oversight ensures automated subjective grading matches course criteria. Any override is permanently logged with instructor remarks.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="text-slate-500 font-medium">Original AI Suggested Score</p>
              <p className="text-base font-black text-slate-800">
                {evaluation.total_score} / {evaluation.max_score} ({evaluation.percentage}%)
              </p>
            </div>
            <div className="text-right">
              <label className="block text-slate-700 font-bold mb-1">New Faculty Score</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={evaluation.max_score}
                required
                value={overrideScore}
                onChange={(e) => setOverrideScore(Number(e.target.value))}
                className="w-24 p-1.5 text-center font-bold text-sm rounded border border-purple-300 focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Moderator Audit Notes / Rationale
            </label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Awarded +2 marks for recognizing lack of node revisit mechanism in Dijkstra despite brevity."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold transition shadow-md shadow-purple-700/30 flex items-center gap-1.5"
            >
              {saving ? "Saving..." : "Confirm & Save Override"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

