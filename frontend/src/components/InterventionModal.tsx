"use client";

import React, { useState } from "react";
import { X, Calendar, UserCheck, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

interface InterventionModalProps {
  studentId: string;
  studentName?: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  studentId,
  studentName,
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("academic_tutoring");
  const [priority, setPriority] = useState("high");
  const [counselor, setCounselor] = useState("Kavita Deshmukh");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setSaving(true);
    const res = await api.createIntervention({
      student_id: studentId,
      counselor_name: counselor,
      title,
      intervention_type: type,
      priority,
      notes,
    });
    if (res.success) {
      onCreated();
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 bg-gradient-to-r from-rose-700 to-amber-700 text-white flex items-center justify-between">
          <div>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-rose-500/30 text-rose-100 border border-rose-400/40">
              PS3 Retention Action
            </span>
            <h3 className="text-lg font-bold mt-1">Schedule Counselor Intervention</h3>
            <p className="text-xs text-rose-100">
              Target Student: {studentName ? `${studentName} (${studentId})` : studentId}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Intervention Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mandatory Attendance Advisory & Academic Remediation Plan"
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Intervention Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800"
              >
                <option value="academic_tutoring">Academic Peer Tutoring</option>
                <option value="attendance_warning">Attendance Advisory</option>
                <option value="financial_aid">Financial / Work Study Review</option>
                <option value="mental_health">Wellness / Stress Counseling</option>
                <option value="career_guidance">Academic Path Guidance</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800"
              >
                <option value="urgent">Urgent (Immediate)</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Counselor</label>
            <input
              type="text"
              required
              value={counselor}
              onChange={(e) => setCounselor(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Action Notes / Context</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe trigger factors (e.g., missed 3 consecutive lectures, scored <40% on formative trees quiz)..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-rose-500"
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
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-md shadow-rose-600/30 flex items-center gap-1.5"
            >
              {saving ? "Scheduling..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

