"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  RefreshCw,
  Users2,
  BookOpen,
  Award,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Target,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUserRole } from "@/lib/useUserRole";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/EmptyState";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const { role, fullName, userId } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [riskOverview, setRiskOverview] = useState<any>(null);
  const [classroomOverview, setClassroomOverview] = useState<any>(null);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stuRes, topRes, subRes, riskRes, classRes, intRes] = await Promise.all([
        api.getStudents(),
        api.getTopics(),
        api.getSubmissions(),
        api.getRiskOverview(),
        api.getClassroomOverview(),
        api.getInterventions(),
      ]);

      if (stuRes.success && stuRes.data) setStudents(stuRes.data);
      if (topRes.success && topRes.data) setTopics(topRes.data);
      if (subRes.success && subRes.data) setSubmissions(subRes.data);
      if (riskRes.success && riskRes.data) setRiskOverview(riskRes.data);
      if (classRes.success && classRes.data) setClassroomOverview(classRes.data);
      if (intRes.success && intRes.data) setInterventions(intRes.data);

      // If student role, fetch STU001 360 profile
      if (role === "student" || userId) {
        const pRes = await api.getStudent360(userId || "STU001");
        if (pRes.success && pRes.data) setStudentProfile(pRes.data);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role, userId]);

  if (loading) {
    return <LoadingState message="Loading role-tailored academic analytics..." />;
  }

  // =========================================================================
  // 1. STUDENT DASHBOARD VIEW
  // =========================================================================
  if (role === "student") {
    const studentCore = studentProfile?.core || {
      student_id: userId || "STU001",
      full_name: fullName,
      cgpa: 8.4,
      attendance_rate: 88.5,
    };
    const masteryList = studentProfile?.ps1_adaptive_learning?.mastery_list || [];
    const avgMastery =
      masteryList.length > 0
        ? Math.round(masteryList.reduce((acc: number, m: any) => acc + m.mastery_level, 0) / masteryList.length)
        : 72;
    const weakConcepts = studentProfile?.ps1_adaptive_learning?.weak_concepts || ["AVL Balance Factor"];
    const recentQuizzes = studentProfile?.ps1_adaptive_learning?.recent_attempts || [
      { topic_id: "TOP_TREES", score_pct: 85.0, difficulty_before: "medium", difficulty_after: "hard" },
      { topic_id: "TOP_GRAPHS", score_pct: 60.0, difficulty_before: "medium", difficulty_after: "medium" },
    ];

    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Student Learning Portal
              </span>
              <span className="text-xs text-slate-400">ID: {studentCore.student_id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, {studentCore.full_name}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Your adaptive mastery is currently at <strong className="text-indigo-300">{avgMastery}%</strong>. 
              Complete recommended practice on weak concept <span className="text-amber-300 font-semibold">{weakConcepts[0] || "AVL Trees"}</span> to level up.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/ps1-adaptive"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md flex items-center gap-2"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Student KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Overall Mastery"
            value={`${avgMastery}%`}
            subtitle="Bayesian Knowledge Trace"
            variant="brand"
            icon={Award}
          />
          <MetricCard
            title="Current CGPA"
            value={studentCore.cgpa ? Number(studentCore.cgpa).toFixed(2) : "8.40"}
            subtitle="Academic Standing"
            variant="success"
            icon={GraduationCap}
          />
          <MetricCard
            title="Attendance Rate"
            value={`${studentCore.attendance_rate || 88.5}%`}
            subtitle="Safe attendance tier (>75%)"
            variant="default"
            icon={Activity}
          />
          <MetricCard
            title="Active Learning Streak"
            value="6 Days"
            subtitle="Consecutive daily sessions"
            variant="default"
            icon={TrendingUp}
          />
        </div>

        {/* Subject Mastery & Weak Concept Alert */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Curriculum Topic Mastery</h2>
                <p className="text-xs text-slate-500">Live progress calibrated by adaptive quiz evaluations</p>
              </div>
              <Link
                href="/ps1-adaptive#knowledge-graph"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Interactive Graph</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {topics.map((t) => {
                const masteryObj = masteryList.find((m: any) => m.topic_id === t.topic_id);
                const score = masteryObj ? masteryObj.mastery_level : 65;
                return (
                  <div key={t.topic_id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-800">{t.name}</span>
                      <StatusBadge type="mastery" value={score} />
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-indigo-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weak Concept & Remediation Callout */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900">Diagnosis: Weak Concept</h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The Bayesian evaluation diagnosed suboptimal mastery on:
              </p>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/60 text-xs">
                <p className="font-bold text-amber-900">{weakConcepts[0] || "AVL Balance Factor"}</p>
                <p className="text-[11px] text-amber-700 mt-1">
                  Identified in recent quiz attempt. Grounded curriculum text from CLRS Algorithms (Page 142) is ready for review.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                href="/ps1-adaptive"
                className="w-full block text-center py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                Listen to Audio Lesson (Kannada / Hindi)
              </Link>
              <Link
                href={`/students/${studentCore.student_id}`}
                className="w-full block text-center py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                View Full 360° Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Adaptive Quizzes */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Adaptive Quiz Attempts</h2>
              <p className="text-xs text-slate-500">Standardized difficulty scaling: &ge;80% promotes difficulty, &lt;50% eases difficulty</p>
            </div>
            <Link
              href="/ps1-adaptive"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Take New Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Topic</th>
                  <th className="py-2.5 px-3">Score Achieved</th>
                  <th className="py-2.5 px-3">Difficulty Prior</th>
                  <th className="py-2.5 px-3">Adaptive Shift</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentQuizzes.map((q: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{q.topic_id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{q.score_pct}%</td>
                    <td className="py-2.5 px-3 uppercase text-[11px] text-slate-500">{q.difficulty_before}</td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-600 capitalize">
                      {q.difficulty_after}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`editorial-tag px-2 py-0.5 rounded ${q.score_pct >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {q.score_pct >= 80 ? "Promoted" : "Consolidating"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. TEACHER / FACULTY DASHBOARD VIEW
  // =========================================================================
  if (role === "teacher" || role === "faculty") {
    const classAvg = classroomOverview?.classroom_average_mastery || 68.4;
    const pendingGrading = submissions.filter((s) => s.status === "pending").length;
    const evaluatedGrading = submissions.filter((s) => s.status === "evaluated" || s.status === "moderated").length;
    const weakestTopic = classroomOverview?.weakest_topic || { name: "Trees & Hierarchical Structures", average_mastery: 54.0 };

    return (
      <div className="space-y-6">
        {/* Faculty Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Faculty & Assessment Portal
              </span>
              <span className="text-xs text-slate-500">Instructor: {fullName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Classroom & Evaluation Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Overview of student submissions, AI scoring moderation, and cohort academic performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/ps2-grading"
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Assessment Workspace</span>
            </Link>
          </div>
        </div>

        {/* Faculty KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Classroom Avg Mastery"
            value={`${classAvg}%`}
            subtitle="Cohort benchmark (PS1)"
            variant="brand"
            icon={GraduationCap}
          />
          <MetricCard
            title="Pending AI Evaluations"
            value={pendingGrading}
            subtitle="Submissions queued"
            variant={pendingGrading > 0 ? "warning" : "default"}
            icon={Clock}
          />
          <MetricCard
            title="Completed Evaluations"
            value={evaluatedGrading}
            subtitle="SentenceTransformer scored"
            variant="success"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Total Enrolled Students"
            value={students.length}
            subtitle="Shared student_id records"
            variant="default"
            icon={Users2}
          />
        </div>

        {/* Assessment Queue & Weakest Concepts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Student Submissions Queue</h2>
                <p className="text-xs text-slate-500">Digital text, scanned PDFs, and image submissions</p>
              </div>
              <Link
                href="/ps2-grading"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View All Submissions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Submission ID</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">File Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.slice(0, 5).map((sub: any) => (
                    <tr key={sub.submission_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{sub.submission_id}</td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {sub.student_name} <span className="text-slate-400">({sub.student_id})</span>
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[10px] text-slate-500">{sub.file_type || "txt"}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge type="submission" value={sub.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={`/ps2-grading?sub_id=${sub.submission_id}`}
                          className="font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Grade / Inspect &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weakest Concepts Diagnosis Callout */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Curriculum Action Alerts</h2>
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200/70 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Classroom Remediation Needed</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                The adaptive engine identified <strong>{weakestTopic.name}</strong> as having the lowest cohort mastery ({weakestTopic.average_mastery}%).
              </p>
              <p className="text-[11px] text-amber-700">
                Recommended faculty intervention: Schedule interactive revision for AVL Tree Rotations before the next formative test.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                href="/ps1-adaptive"
                className="w-full block text-center py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                Inspect Classroom Knowledge Graph
              </Link>
              <Link
                href="/students"
                className="w-full block text-center py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                Filter Students by Weak Concept
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. COUNSELOR DASHBOARD VIEW
  // =========================================================================
  if (role === "counselor") {
    const highRiskCount = riskOverview?.high_risk_count || 3;
    const mediumRiskCount = riskOverview?.medium_risk_count || 3;
    const lowRiskCount = riskOverview?.low_risk_count || 4;
    const openInterventions = interventions.filter((i) => i.status === "open" || i.status === "in_progress").length;

    return (
      <div className="space-y-6">
        {/* Counselor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Student Retention Copilot
              </span>
              <span className="text-xs text-slate-500">Counselor: {fullName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Retention & Early Intervention Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              SHAP-explained dropout predictions and counselor intervention task management.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/ps3-dropout"
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Full Risk Matrix</span>
            </Link>
          </div>
        </div>

        {/* Counselor KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="High Risk Cohort"
            value={highRiskCount}
            subtitle="P(dropout) &ge; 50%"
            variant="danger"
            icon={AlertTriangle}
          />
          <MetricCard
            title="Medium Risk Watchlist"
            value={mediumRiskCount}
            subtitle="P(dropout) 30% - 50%"
            variant="warning"
            icon={Clock}
          />
          <MetricCard
            title="Active Interventions"
            value={openInterventions}
            subtitle="Tasks assigned to counseling"
            variant="brand"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Low Risk Stable"
            value={lowRiskCount}
            subtitle="P(dropout) < 30%"
            variant="success"
            icon={ShieldCheck}
          />
        </div>

        {/* High Risk Students & Active Interventions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Priority Retention Intervention Cases</h2>
                <p className="text-xs text-slate-500">Students flagged by Random Forest model with SHAP indicators</p>
              </div>
              <Link
                href="/ps3-dropout#heatmap-matrix"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>3x3 Heatmap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Risk Level</th>
                    <th className="py-2.5 px-3">Attendance</th>
                    <th className="py-2.5 px-3">CGPA</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter((s) => s.risk_level === "high" || s.risk_score >= 50)
                    .slice(0, 5)
                    .map((stu) => (
                      <tr key={stu.student_id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {stu.full_name} <span className="text-slate-400 font-normal">({stu.student_id})</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge type="risk" value={stu.risk_level || "high"} />
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{stu.attendance_rate}%</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{stu.cgpa}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/students/${stu.student_id}?tab=retention`}
                            className="font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            SHAP Profile &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Counselor Task Card */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Assigned Counselor Tasks</h2>
            <div className="space-y-3">
              {interventions.slice(0, 3).map((item) => (
                <div key={item.intervention_id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    <span className="editorial-tag text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 uppercase">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">Assigned: {item.counselor_name || "Kavita Deshmukh"}</p>
                  <p className="text-[10px] text-slate-400">Student: {item.student_id}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/ps3-dropout#counselor-tasks"
                className="w-full block text-center py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                Manage All Retention Tasks
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. ADMIN & DEFAULT DASHBOARD VIEW
  // =========================================================================
  const highRisk = students.filter((s) => s.risk_level === "high" || s.risk_score >= 50).length;
  const avgClassMastery = classroomOverview?.classroom_average_mastery || 68.4;
  const pendingEvals = submissions.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Admin Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-900 text-white font-semibold">
              Executive Administration
            </span>
            <span className="text-xs text-slate-500">Institution: NIT Karnataka</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            EDUCORE AI — System Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-module telemetry uniting PS1 Adaptive Learning, PS2 Subjective Grading, and PS3 Retention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/students"
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>Shared Student Directory</span>
          </Link>
        </div>
      </div>

      {/* Cross-Module KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Active Students"
          value={students.length}
          subtitle="Shared student_id records"
          variant="default"
          icon={Users2}
        />
        <MetricCard
          title="PS1 Average Mastery"
          value={`${avgClassMastery}%`}
          subtitle="Bayesian Knowledge Trace"
          variant="brand"
          icon={GraduationCap}
        />
        <MetricCard
          title="PS2 Queued Submissions"
          value={pendingEvals}
          subtitle="Awaiting SentenceTransformer"
          variant={pendingEvals > 0 ? "warning" : "default"}
          icon={FileCheck2}
        />
        <MetricCard
          title="PS3 High Risk Count"
          value={highRisk}
          subtitle="Requires Counselor Attention"
          variant="danger"
          icon={AlertTriangle}
        />
      </div>

      {/* Module Navigation Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PS1 Card */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                PS1: Adaptive Learning
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Multilingual Learning & Knowledge Graph</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standardized difficulty scaling, interactive concept graphs, and curriculum RAG remediation with Kannada and Hindi STT/TTS.
            </p>
          </div>
          <Link
            href="/ps1-adaptive"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <span>Open Learning Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* PS2 Card */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                PS2: Subjective Evaluation
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <h2 className="text-base font-bold text-slate-900">SentenceTransformer & OCR Inspector</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              `all-MiniLM-L6-v2` semantic grading, criterion-level evidence quoting, multi-page scanned PDF/image OCR, and faculty audit trail.
            </p>
          </div>
          <Link
            href="/ps2-grading"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <span>Open Assessment Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* PS3 Card */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
                PS3: Retention Copilot
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <h2 className="text-base font-bold text-slate-900">SHAP TreeExplainer & 3x3 Heatmap</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Local additive Shapley feature attributions, longitudinal progression trajectories, cohort risk heatmaps, and counselor tasks.
            </p>
          </div>
          <Link
            href="/ps3-dropout"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <span>Open Retention Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Cohort Directory Overview Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Unified Student Cohort (Integrated 360°)</h2>
            <p className="text-xs text-slate-500">All students mapped across PS1 mastery, PS2 evaluations, and PS3 retention risk</p>
          </div>
          <Link
            href="/students"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All Records</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Student ID</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Attendance</th>
                <th className="py-2.5 px-3">CGPA</th>
                <th className="py-2.5 px-3">Retention Risk</th>
                <th className="py-2.5 px-3 text-right">360° Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.slice(0, 6).map((stu) => (
                <tr key={stu.student_id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{stu.student_id}</td>
                  <td className="py-2.5 px-3 text-slate-800 font-medium">{stu.full_name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{stu.department || "Computer Science"}</td>
                  <td className="py-2.5 px-3 text-slate-700">{stu.attendance_rate}%</td>
                  <td className="py-2.5 px-3 text-slate-700">{stu.cgpa}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge type="risk" value={stu.risk_level || "low"} />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      href={`/students/${stu.student_id}`}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
