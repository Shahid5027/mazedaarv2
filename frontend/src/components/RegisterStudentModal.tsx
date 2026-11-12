"use client";

import React, { useState } from "react";
import { X, UserPlus, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentRegistered: () => void;
}

export const RegisterStudentModal: React.FC<RegisterStudentModalProps> = ({
  isOpen,
  onClose,
  onStudentRegistered,
}) => {
  const [studentId, setStudentId] = useState("STU011");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [semester, setSemester] = useState(2);
  const [cgpa, setCgpa] = useState(7.5);
  const [attendance, setAttendance] = useState(85.0);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !name || !email) return;

    setSaving(true);
    const res = await api.createStudent({
      student_id: studentId,
      name,
      email,
      department,
      semester: Number(semester),
      cgpa: Number(cgpa),
      attendance_pct: Number(attendance),
      status: attendance < 65 || cgpa < 6.0 ? "at_risk" : "active",
    });

    if (res.success) {
      onStudentRegistered();
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white flex items-center justify-between">
          <div>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/30 text-indigo-100 border border-indigo-400/40">
              Shared Student Identity
            </span>
            <h3 className="text-lg font-bold mt-1">Register New Student Profile</h3>
            <p className="text-xs text-indigo-200">
              Enrolls student across PS1 Adaptive, PS2 Grading, and PS3 Risk models
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student Identifier</label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                placeholder="e.g. STU011"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Semester</label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ishaan Malhotra"
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">University Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ishaan.m@educore.edu"
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Data Science">Data Science</option>
              <option value="Electronics & CS">Electronics & CS</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial CGPA (0 - 10)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={cgpa}
                onChange={(e) => setCgpa(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Attendance Percentage (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                required
                value={attendance}
                onChange={(e) => setAttendance(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
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
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {saving ? "Registering..." : "Create Student Entity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

