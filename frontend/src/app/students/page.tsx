"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users2,
  Search,
  Filter,
  ArrowRight,
  UserPlus,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { RegisterStudentModal } from "@/components/RegisterStudentModal";
import { MetricCard } from "@/components/MetricCard";
import { LoadingState } from "@/components/EmptyState";

export default function StudentsDirectoryPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({
        search: search || undefined,
        department: department || undefined,
        status: status || undefined,
      });
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [department, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  const highRiskCount = students.filter((s) => s.risk_level === "high" || s.risk_score >= 50).length;
  const activeCount = students.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              Shared Identity Layer
            </span>
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
              Primary Key: student_id
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Institutional Student Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single unified model unifying PS1 topic mastery, PS2 subjective grading, and PS3 retention predictions.
          </p>
        </div>

        <button
          onClick={() => setRegisterModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Directory Records"
          value={students.length}
          subtitle="Persistent database rows"
          variant="default"
          icon={Users2}
        />
        <MetricCard
          title="Active Students"
          value={activeCount}
          subtitle="Currently enrolled"
          variant="brand"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Flagged High Risk"
          value={highRiskCount}
          subtitle="Assigned to counselor copilot"
          variant={highRiskCount > 0 ? "danger" : "default"}
          icon={Users2}
        />
        <MetricCard
          title="Core Model Architecture"
          value="Shared 360°"
          subtitle="Zero cross-module friction"
          variant="success"
          icon={ShieldCheck}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email, or STU ID..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus-ring"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Data Science">Data Science</option>
            <option value="Electronics & CS">Electronics & CS</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="at_risk">At Risk Only</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <LoadingState message="Filtering institutional directory..." />
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Attendance Rate</th>
                  <th className="py-2.5 px-3">CGPA</th>
                  <th className="py-2.5 px-3">Retention Risk Tier</th>
                  <th className="py-2.5 px-3 text-right">360° Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((stu) => (
                  <tr key={stu.student_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">{stu.student_id}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{stu.full_name}</p>
                      <p className="text-[11px] text-slate-400">{stu.email}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{stu.department || "Computer Science"}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold ${
                          stu.attendance_rate < 65
                            ? "text-rose-600"
                            : stu.attendance_rate < 75
                            ? "text-amber-600"
                            : "text-slate-800"
                        }`}
                      >
                        {stu.attendance_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{stu.cgpa}</td>
                    <td className="py-3 px-3">
                      <StatusBadge type="risk" value={stu.risk_level || "low"} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/students/${stu.student_id}`}
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <span>View 360°</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Student Modal */}
      <RegisterStudentModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onStudentRegistered={loadStudents}
      />
    </div>
  );
}
