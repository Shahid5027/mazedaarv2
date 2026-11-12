"use client";

import React, { useState, useEffect } from "react";
import { User, Shield, GraduationCap, Users, UserCheck } from "lucide-react";
import { api } from "@/lib/api";

export const RoleSwitcher: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<string>("student");
  const [userName, setUserName] = useState<string>("Aarav Sharma");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCurrentUser().then((res) => {
      if (res.success && res.data) {
        setCurrentRole(res.data.role);
        setUserName(res.data.full_name);
      }
    });
  }, []);

  const handleRoleChange = async (role: string) => {
    setLoading(true);
    const res = await api.switchRole(role, role === "student" ? "STU001" : undefined);
    if (res.success) {
      setCurrentRole(role);
      const userRes = await api.getCurrentUser();
      if (userRes.success && userRes.data) {
        setUserName(userRes.data.full_name);
      }
      setIsOpen(false);
      window.location.reload(); // Refresh to ensure active views adapt
    }
    setLoading(false);
  };

  const roleIcons: Record<string, React.ReactNode> = {
    student: <GraduationCap className="w-4 h-4 text-indigo-600" />,
    teacher: <UserCheck className="w-4 h-4 text-emerald-600" />,
    faculty: <UserCheck className="w-4 h-4 text-emerald-600" />,
    counselor: <Users className="w-4 h-4 text-amber-600" />,
    admin: <Shield className="w-4 h-4 text-rose-600" />,
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm text-slate-800"
      >
        <span className="p-1 rounded bg-slate-100">{roleIcons[currentRole] || <User className="w-3.5 h-3.5" />}</span>
        <div className="text-left hidden sm:block">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Demo Role</p>
          <p className="font-semibold text-slate-800 leading-none">{userName}</p>
        </div>
        <span className="ml-1 text-slate-400">▾</span>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 divide-y divide-slate-100 z-50">
          <div className="p-3 bg-slate-50 rounded-t-xl">
            <p className="text-xs font-semibold text-slate-700">Switch Demo Role</p>
            <p className="text-[11px] text-slate-500">Test platform views under simulated personas</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => handleRoleChange("student")}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-50 transition ${
                currentRole === "student" ? "bg-indigo-50/70 text-indigo-900 font-semibold" : "text-slate-700"
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="font-medium">Student (Aarav Sharma)</p>
                <p className="text-[10px] text-slate-500">PS1 Adaptive Learning & Quiz view (STU001)</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleChange("teacher")}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-50 transition ${
                currentRole === "teacher" ? "bg-indigo-50/70 text-indigo-900 font-semibold" : "text-slate-700"
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="font-medium">Faculty / Evaluator (Prof. Sengupta)</p>
                <p className="text-[10px] text-slate-500">PS2 Rubric creation & Score moderation</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleChange("counselor")}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-50 transition ${
                currentRole === "counselor" ? "bg-indigo-50/70 text-indigo-900 font-semibold" : "text-slate-700"
              }`}
            >
              <Users className="w-4 h-4 text-amber-600" />
              <div>
                <p className="font-medium">Retention Counselor (Kavita D.)</p>
                <p className="text-[10px] text-slate-500">PS3 Early Dropout & Interventions</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleChange("admin")}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-50 transition ${
                currentRole === "admin" ? "bg-indigo-50/70 text-indigo-900 font-semibold" : "text-slate-700"
              }`}
            >
              <Shield className="w-4 h-4 text-rose-600" />
              <div>
                <p className="font-medium">Dean / Institutional Admin</p>
                <p className="text-[10px] text-slate-500">Full cross-department integrated metrics</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

