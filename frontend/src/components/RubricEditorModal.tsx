"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface RubricEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssessmentCreated: () => void;
}

export const RubricEditorModal: React.FC<RubricEditorModalProps> = ({
  isOpen,
  onClose,
  onAssessmentCreated,
}) => {
  const [courseId, setCourseId] = useState("CRS_CS201");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalMarks, setTotalMarks] = useState(50);
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [referenceAnswer, setReferenceAnswer] = useState("");
  
  const [criteria, setCriteria] = useState([
    { name: "Technical Accuracy", max_points: 20, description: "Correctness of algorithmic steps and bounds" },
    { name: "Conceptual Depth", max_points: 15, description: "Structural invariants and tradeoff reasoning" },
    { name: "Edge Cases & Proofs", max_points: 10, description: "Proof correctness and degeneration handling" },
    { name: "Clarity & Structure", max_points: 5, description: "Notation clarity and technical organization" },
  ]);

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddCriterion = () => {
    setCriteria([...criteria, { name: "New Criterion", max_points: 10, description: "Evaluation notes" }]);
  };

  const handleRemoveCriterion = (idx: number) => {
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !questionPrompt) return;

    setSaving(true);
    const payload = {
      course_id: courseId,
      title,
      description,
      total_marks: totalMarks,
      created_by: "Prof. Rajesh Sengupta",
      rubric: { criteria },
      questions: [
        {
          question_id: "Q1",
          prompt: questionPrompt,
          max_marks: totalMarks,
          reference_answer: referenceAnswer.trim(),
        },
      ],
    };

    const res = await api.createAssessment(payload);
    if (res.success) {
      onAssessmentCreated();
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
              PS2 Assessment Architect
            </span>
            <h3 className="text-lg font-bold mt-1">Create Subjective Assessment & Rubric</h3>
            <p className="text-xs text-emerald-200">Configure reference answers and scoring criteria for automated grading</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Academic Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="CRS_CS201">CS201: Data Structures & Algorithms</option>
              <option value="CRS_AI301">AI301: Machine Learning Foundations</option>
              <option value="CRS_DB204">DB204: Database Systems & Design</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assessment Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Lab 3: AVL Tree Balancing and Dijkstra Proofs"
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Guidelines</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide instructions for students regarding expected depth and diagrams..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Question & Reference Answer */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center justify-between">
              <span>Primary Question & Reference Model Answer</span>
              <span className="text-slate-500 font-normal">Max Marks: {totalMarks}</span>
            </h4>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Question Prompt</label>
              <textarea
                rows={2}
                required
                value={questionPrompt}
                onChange={(e) => setQuestionPrompt(e.target.value)}
                placeholder="State the subjective question prompt here..."
                className="w-full p-2 rounded-lg border border-slate-300 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Faculty Reference / Benchmark Answer <span className="font-normal text-slate-400">(optional if uploading a reference sheet)</span></label>
              <textarea
                rows={3}
                value={referenceAnswer}
                onChange={(e) => setReferenceAnswer(e.target.value)}
                placeholder="Enter the ideal expected answer containing key terms, algorithmic invariants, and proofs..."
                className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Rubric Criteria Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-700">Evaluation Rubric Criteria</label>
              <button
                type="button"
                onClick={handleAddCriterion}
                className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Criterion
              </button>
            </div>

            <div className="space-y-2">
              {criteria.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => {
                      const updated = [...criteria];
                      updated[idx].name = e.target.value;
                      setCriteria(updated);
                    }}
                    className="flex-1 p-1.5 rounded border border-slate-300 font-medium"
                    placeholder="Criterion Name"
                  />
                  <input
                    type="number"
                    value={c.max_points}
                    onChange={(e) => {
                      const updated = [...criteria];
                      updated[idx].max_points = Number(e.target.value);
                      setCriteria(updated);
                    }}
                    className="w-16 p-1.5 rounded border border-slate-300 text-center"
                    placeholder="Points"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
            >
              {saving ? "Creating..." : "Save Assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

