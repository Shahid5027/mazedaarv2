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
  UserPlus,
  Shield,
  UserCheck,
  Users,
  Search,
  Filter,
  Check,
  X,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUserRole } from "@/lib/useUserRole";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState, EmptyState } from "@/components/EmptyState";
import { RemedialResourceModal } from "@/components/RemedialResourceModal";
import { InterventionModal } from "@/components/InterventionModal";
import { VoiceTutorModal } from "@/components/VoiceTutorModal";
import {
  Bell,
  Mic,
  Calendar,
  ListTodo,
} from "lucide-react";
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
  Legend,
} from "recharts";

export default function DashboardPage() {
  const { role, fullName, userId, isAuthenticated } = useUserRole();
  const [loading, setLoading] = useState(true);

  // Core Data Collections
  const [students, setStudents] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  // Specialized Analytics Data
  const [instAnalytics, setInstAnalytics] = useState<any>(null);
  const [teacherAnalytics, setTeacherAnalytics] = useState<any>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);
  const [counselorAnalytics, setCounselorAnalytics] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  // Modals & UI States
  const [voiceTutorOpen, setVoiceTutorOpen] = useState(false);
  const [selectedRemedialResource, setSelectedRemedialResource] = useState<any>(null);
  const [remedialModalOpen, setRemedialModalOpen] = useState(false);
  const [interventionModalStudent, setInterventionModalStudent] = useState<{ id: string; name: string } | null>(null);
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    full_name: "",
    email: "",
    role: "student",
    password: "",
    department: "Computer Science",
    student_id: "",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [stuRes, topRes, subRes, intRes] = await Promise.all([
        api.getStudents(),
        api.getTopics(),
        api.getSubmissions(),
        api.getInterventions(),
      ]);

      if (stuRes.success && stuRes.data) setStudents(stuRes.data);
      if (topRes.success && topRes.data) setTopics(topRes.data);
      if (subRes.success && subRes.data) setSubmissions(subRes.data);
      if (intRes.success && intRes.data) setInterventions(intRes.data);

      // Fetch role-specific analytics
      if (role === "admin") {
        const [instRes, usersRes] = await Promise.all([
          api.getInstitutionAnalytics(),
          api.getUsers(),
        ]);
        if (instRes.success && instRes.data) setInstAnalytics(instRes.data);
        if (usersRes.success && usersRes.data) setAdminUsers(usersRes.data);
      } else if (role === "teacher" || role === "faculty") {
        const tRes = await api.getTeacherAnalytics();
        if (tRes.success && tRes.data) setTeacherAnalytics(tRes.data);
      } else if (role === "counselor") {
        const cRes = await api.getCounselorAnalytics();
        if (cRes.success && cRes.data) setCounselorAnalytics(cRes.data);
      } else if (role === "student") {
        const targetStudentId = userId?.startsWith("STU") ? userId : "STU001";
        const [pRes, sAnalyticRes] = await Promise.all([
          api.getStudent360(targetStudentId),
          api.getStudentAnalytics(targetStudentId),
        ]);
        if (pRes.success && pRes.data) setStudentProfile(pRes.data);
        if (sAnalyticRes.success && sAnalyticRes.data) setStudentAnalytics(sAnalyticRes.data);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [role, userId]);

  // Handle User Status Toggle
  const handleToggleUserStatus = async (user: any) => {
    const nextStatus = !user.is_active;
    const res = await api.updateUserStatus(user.user_id, { is_active: nextStatus });
    if (res.success) {
      setAdminUsers((prev) =>
        prev.map((u) => (u.user_id === user.user_id ? { ...u, is_active: nextStatus } : u))
      );
      setUserActionMsg(`Updated ${user.full_name}'s status to ${nextStatus ? "Active" : "Inactive"}`);
      setTimeout(() => setUserActionMsg(null), 3000);
    }
  };

  // Handle Admin User Creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    const res = await api.createAdminUser(newUserForm);
    if (res.success) {
      setUserActionMsg(`User ${newUserForm.username} created successfully!`);
      setCreateUserModalOpen(false);
      setNewUserForm({
        username: "",
        full_name: "",
        email: "",
        role: "student",
        password: "",
        department: "Computer Science",
        student_id: "",
      });
      const refresh = await api.getUsers();
      if (refresh.success && refresh.data) setAdminUsers(refresh.data);
      setTimeout(() => setUserActionMsg(null), 4000);
    } else {
      setUserActionMsg(res.message || "Failed to create user account.");
    }
    setCreatingUser(false);
  };

  if (loading) {
    return <LoadingState message="Loading authenticated role analytics..." />;
  }

  // =========================================================================
  // 1. STUDENT DASHBOARD VIEW (PURE GRAPH-FREE INSTITUTIONAL SAAS)
  // =========================================================================
  if (role === "student") {
    const studentCore = studentProfile?.core || {
      student_id: userId || "STU001",
      full_name: fullName || "Aarav Sharma",
      cgpa: 8.7,
      attendance_rate: 92.5,
      department: "Computer Science",
      semester: 4,
    };
    const overallMastery = studentAnalytics?.overall_mastery || 78.5;
    const weakConcepts = studentAnalytics?.weak_concepts || ["AVL Balance Factor", "DP Tabulation"];
    const recommendations = studentAnalytics?.recommendations || [
      { title: "AVL Tree Rotations Interactive Visualizer", type: "Visualizer", estimated_minutes: 15 },
      { title: "Bellman-Ford Negative Cycle Detection", type: "Micro-Lecture", estimated_minutes: 10 },
    ];
    const activityHistory = studentAnalytics?.activity_history || [];

    return (
      <div className="space-y-6">
        {/* Welcome / Profile Summary Header */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-base shadow-xs">
              {studentCore.full_name?.charAt(0) || "S"}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">{studentCore.full_name}</h1>
                <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold font-mono">
                  {studentCore.student_id}
                </span>
                <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                  Enrolled • Semester {studentCore.semester || 4}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Department of {studentCore.department || "Computer Science"} • Academic Standing: First Class
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setVoiceTutorOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice AI Tutor (ಕನ್ನಡ • हिन्दी • EN)</span>
            </button>
            <Link
              href="/ps1-adaptive"
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Continue Learning</span>
            </Link>
          </div>
        </div>

        {/* Simple Institutional Stats Strip (Graph-Free Plain Statistics) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{studentCore.attendance_rate || 92.5}%</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">37 / 40 Days Present (Compliant)</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cumulative CGPA</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{studentCore.cgpa?.toFixed(2) || "8.70"}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Scale: 0.0 - 10.0</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Curriculum Mastery</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{overallMastery}%</p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${overallMastery}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Action Items</p>
            <p className="text-xl font-bold text-slate-900 mt-1">2 Items</p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">1 Assignment • 1 Quiz Review</p>
          </div>
        </div>

        {/* Notifications Ribbon */}
        <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/60 flex items-center justify-between text-xs text-indigo-950">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-medium">
              Lab 2 evaluation completed by Prof. Sengupta. Approved grade: <strong>88/100</strong>.
            </span>
          </div>
          <Link href="/students/STU001?tab=assessments" className="font-semibold text-indigo-700 hover:text-indigo-900 underline text-xs">
            Review Marks Breakdown
          </Link>
        </div>

        {/* Enrolled Courses & Topic Progress Bars (Graph-Free) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Enrolled Courses & Topic Progress</h2>
              <p className="text-xs text-slate-500">Curriculum concept mastery tracked via Bayesian Knowledge Tracing</p>
            </div>
            <Link href="/ps1-adaptive" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Open Full Syllabus →
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { name: "Array & Linked List Invariants", mastery: 92, status: "Mastered", color: "bg-emerald-500" },
              { name: "Stack & Queue Structures", mastery: 85, status: "Mastered", color: "bg-emerald-500" },
              { name: "Binary Search Tree Traversals", mastery: 74, status: "In Progress", color: "bg-indigo-500" },
              { name: "AVL Tree Rotations & Balance Factor", mastery: 62, status: "Needs Practice", color: "bg-amber-500" },
              { name: "Dynamic Programming Tabulation", mastery: 50, status: "Needs Review", color: "bg-rose-500" },
            ].map((topicItem, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1 min-w-[200px]">
                  <p className="font-semibold text-slate-800">{topicItem.name}</p>
                  <span className={`editorial-tag text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                    topicItem.mastery >= 80 ? "bg-emerald-50 text-emerald-700" : topicItem.mastery >= 65 ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {topicItem.status}
                  </span>
                </div>

                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-between text-[11px] mb-1 text-slate-600">
                    <span>Mastery Level</span>
                    <span className="font-bold">{topicItem.mastery}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className={`${topicItem.color} h-2 rounded-full`} style={{ width: `${topicItem.mastery}%` }} />
                  </div>
                </div>

                <Link
                  href="/ps1-adaptive"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 font-semibold text-[11px] transition text-center shrink-0"
                >
                  Study Concept
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Two-Column Grid: Assessments & Weak Concepts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending Assessments & Recent Results */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>Assessments & Results</span>
            </h2>
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">Lab 2: Binary Search Tree Invariants</p>
                  <p className="text-[11px] text-slate-500">Graded by SentenceTransformer AI • Moderated</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-600">88 / 100</span>
                  <p className="text-[10px] text-slate-400">Nov 10, 2026</p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">Assignment 3: Dynamic Programming Memoization</p>
                  <p className="text-[11px] text-amber-600 font-medium">Pending Faculty Moderation</p>
                </div>
                <div className="text-right">
                  <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
                    In Review
                  </span>
                  <p className="text-[10px] text-slate-400">Due Nov 15</p>
                </div>
              </div>
            </div>
          </div>

          {/* Targeted Remediation (Weak Concepts) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Weak Concepts Requiring Attention</span>
              </h2>
              <span className="text-xs text-slate-400">Diagnosed via Quizzes</span>
            </div>
            <div className="space-y-2.5">
              {weakConcepts.map((concept: string, idx: number) => (
                <div key={idx} className="p-3 rounded-lg border border-amber-100 bg-amber-50/40 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{concept}</p>
                    <p className="text-[11px] text-slate-500">Suggested remediation: 15 min interactive practice</p>
                  </div>
                  <Link
                    href="/ps1-adaptive#remediation"
                    className="px-2.5 py-1 rounded bg-white border border-amber-200 text-amber-800 font-semibold text-[11px] hover:bg-amber-50 transition"
                  >
                    Start Review
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Personalized Recommendations & Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Recommended Next Steps</span>
            </h2>
            <div className="space-y-2.5">
              {recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{rec.title}</p>
                    <p className="text-[11px] text-slate-500">{rec.type} • ~{rec.estimated_minutes} mins</p>
                  </div>
                  <Link
                    href="/ps1-adaptive"
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-[11px] transition"
                  >
                    Begin
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-600" />
              <span>Recent Activity History</span>
            </h2>
            <div className="space-y-2.5">
              {activityHistory.slice(0, 3).map((item: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{item.action}</p>
                    <p className="text-[11px] text-slate-500">{item.topic}</p>
                  </div>
                  <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 font-semibold border border-slate-200">
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Voice Tutor Modal */}
        <VoiceTutorModal
          isOpen={voiceTutorOpen}
          onClose={() => setVoiceTutorOpen(false)}
          studentId={studentCore.student_id}
          topicName="Data Structures & Algorithms"
          defaultLang="kn-IN"
        />
      </div>
    );
  }

  // =========================================================================
  // 2. TEACHER / FACULTY DASHBOARD VIEW
  // =========================================================================
  if (role === "teacher" || role === "faculty") {
    const topicPerformance = teacherAnalytics?.topic_performance || [
      { topic_id: "T1", topic_name: "Arrays & Linked Lists", avg_mastery: 84.5 },
      { topic_id: "T2", topic_name: "Stack & Queue Structures", avg_mastery: 79.0 },
      { topic_id: "T3", topic_name: "Tree Data Representations", avg_mastery: 62.4 },
      { topic_id: "T4", topic_name: "Graph Algorithms", avg_mastery: 71.2 },
      { topic_id: "T5", topic_name: "Dynamic Programming", avg_mastery: 53.8 },
    ];
    const masteryDist = teacherAnalytics?.mastery_distribution || [
      { name: "Mastered (≥80%)", value: 14, color: "#10b981" },
      { name: "In Progress (50-79%)", value: 8, color: "#6366f1" },
      { name: "Needs Remediation (<50%)", value: 4, color: "#ef4444" },
    ];
    const assessmentDist = teacherAnalytics?.assessment_distribution || [
      { bracket: "0 - 50", count: 1 },
      { bracket: "51 - 70", count: 3 },
      { bracket: "71 - 85", count: 6 },
      { bracket: "86 - 100", count: 2 },
    ];
    const topWeakConcepts = teacherAnalytics?.top_weak_concepts || [
      { concept: "AVL Tree Rotations", students_affected: 6 },
      { concept: "DP State Transitions", students_affected: 5 },
      { concept: "Graph Cycle Detection", students_affected: 4 },
    ];
    const remediationNeeded = teacherAnalytics?.remediation_needed || [];
    const submissionSummary = teacherAnalytics?.submission_summary || {
      total: submissions.length,
      pending: submissions.filter((s) => s.status === "pending").length,
      evaluated: submissions.filter((s) => s.status !== "pending").length,
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Faculty Portal
              </span>
              <span className="text-xs text-slate-500">Instructor: {fullName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Classroom & Evaluation Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Subjective assessment moderation, topic mastery analytics, and student remediation.
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

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Class Active Students"
            value={students.length}
            subtitle="Enrolled cohort"
            variant="default"
            icon={Users2}
          />
          <MetricCard
            title="Pending AI Evaluations"
            value={submissionSummary.pending}
            subtitle="Awaiting moderation"
            variant={submissionSummary.pending > 0 ? "warning" : "default"}
            icon={Clock}
          />
          <MetricCard
            title="Evaluations Completed"
            value={submissionSummary.evaluated}
            subtitle="Graded by SentenceTransformer"
            variant="brand"
            icon={ShieldCheck}
          />
          <MetricCard
            title="Students Requiring Care"
            value={remediationNeeded.length}
            subtitle="Mastery < 60%"
            variant={remediationNeeded.length > 0 ? "danger" : "default"}
            icon={AlertTriangle}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topic-Wise Performance */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Topic-Wise Learning Performance</span>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicPerformance} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis type="category" dataKey="topic_name" tick={{ fontSize: 10, fill: "#64748b" }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} formatter={(val: any) => [`${val}%`, "Avg Mastery"]} />
                  <Bar dataKey="avg_mastery" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mastery Distribution Donut */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <span>Cohort Mastery Distribution</span>
            </h3>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={masteryDist}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    label
                  >
                    {masteryDist.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Score Distribution & Weak Concepts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Assessment Score Distribution</span>
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assessmentDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="bracket" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Frequent Weak Concepts Across Classroom</span>
            </h3>
            <div className="space-y-2.5 pt-2">
              {topWeakConcepts.map((wc: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs"
                >
                  <span className="font-semibold text-slate-800">{wc.concept}</span>
                  <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-100">
                    {wc.students_affected} students affected
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Students Requiring Remediation Table */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Students Requiring Remediation</h3>
              <p className="text-xs text-slate-500">Learners with concept mastery below 60% threshold</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Topic</th>
                  <th className="py-2.5 px-3">Mastery</th>
                  <th className="py-2.5 px-3">Weak Concepts</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {remediationNeeded.map((rem: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{rem.student_name} ({rem.student_id})</td>
                    <td className="py-2.5 px-3 text-slate-700">{rem.topic_name}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-600">{rem.mastery_score}%</td>
                    <td className="py-2.5 px-3 text-slate-500">{(rem.weak_concepts || []).join(", ")}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedRemedialResource({
                            resource_id: "REM_001",
                            topic_id: rem.topic_id,
                            topic_name: rem.topic_name,
                            title: `Remedial Module: ${rem.topic_name}`,
                            type: "interactive_doc",
                            estimated_minutes: 15,
                            language: "en",
                            content_summary: "Automated curriculum RAG remediation guidelines.",
                          });
                          setRemedialModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition text-[11px]"
                      >
                        Assign Resource
                      </button>
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
  // 3. COUNSELOR DASHBOARD VIEW
  // =========================================================================
  if (role === "counselor") {
    const riskDonut = counselorAnalytics?.risk_distribution || [
      { name: "Low Risk", value: 6, color: "#10b981" },
      { name: "Medium Risk", value: 3, color: "#f59e0b" },
      { name: "High Risk", value: 2, color: "#ef4444" },
    ];
    const riskTrend = counselorAnalytics?.risk_trend || [
      { week: "W1", high_risk_count: 5, medium_risk_count: 3 },
      { week: "W2", high_risk_count: 4, medium_risk_count: 4 },
      { week: "W3", high_risk_count: 4, medium_risk_count: 3 },
      { week: "W4", high_risk_count: 3, medium_risk_count: 4 },
      { week: "W5", high_risk_count: 2, medium_risk_count: 3 },
    ];
    const heatmapMatrix = counselorAnalytics?.heatmap_matrix || [];
    const urgentStudents = counselorAnalytics?.urgent_students || [];
    const intStats = counselorAnalytics?.intervention_stats || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                Retention & Counselor Portal
              </span>
              <span className="text-xs text-slate-500">Counselor: {fullName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Retention Intelligence & SHAP Copilot
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Early dropout warning, explainability drivers, and proactive student welfare interventions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/ps3-dropout"
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Full PS3 Retention Hub</span>
            </Link>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="High-Risk Students"
            value={counselorAnalytics?.total_at_risk || 2}
            subtitle="Immediate action required"
            variant="danger"
            icon={AlertTriangle}
          />
          <MetricCard
            title="Active Interventions"
            value={counselorAnalytics?.pending_tasks_count || interventions.length}
            subtitle="Scheduled counseling tasks"
            variant="brand"
            icon={Activity}
          />
          <MetricCard
            title="Resolved Interventions"
            value={interventions.filter((i) => i.status === "completed").length}
            subtitle="Successfully closed"
            variant="default"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Overall Retention Rate"
            value="81.8%"
            subtitle="Institution target ≥ 80%"
            variant="default"
            icon={TrendingUp}
          />
        </div>

        {/* Risk Donut & Risk Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-amber-600" />
              <span>Cohort Risk Distribution</span>
            </h3>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDonut}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    label
                  >
                    {riskDonut.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <LineIcon className="w-4 h-4 text-rose-600" />
              <span>Cohort Risk Trend (Weekly Trajectory)</span>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="high_risk_count" name="High Risk" stroke="#ef4444" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="medium_risk_count" name="Medium Risk" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Institution Risk Heatmap Matrix */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Institution Risk Heatmap (Department × Semester Matrix)</span>
          </h3>
          <p className="text-xs text-slate-500">Cross-tabulation highlighting vulnerable cohorts</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {heatmapMatrix.map((cell: any, idx: number) => {
              const isHigh = cell.risk_level === "high";
              const isMed = cell.risk_level === "medium";
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition ${
                    isHigh
                      ? "bg-rose-50/70 border-rose-200 text-rose-900"
                      : isMed
                      ? "bg-amber-50/70 border-amber-200 text-amber-900"
                      : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{cell.department}</span>
                    <span className="editorial-tag text-[9px] px-1.5 py-0.2 rounded bg-white font-semibold">
                      {cell.semester}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-[11px] opacity-80">{cell.student_count} Students</span>
                    <span className="font-extrabold text-sm">{cell.avg_risk_score} Score</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Students Requiring Immediate Review Table */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Students Requiring Immediate Counselor Review</h3>
              <p className="text-xs text-slate-500">Identified by ML RandomForest Dropout classifier with SHAP attributions</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Attendance</th>
                  <th className="py-2.5 px-3">CGPA</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Top SHAP Drivers</th>
                  <th className="py-2.5 px-3 text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {urgentStudents.map((st: any) => (
                  <tr key={st.student_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{st.name} ({st.student_id})</td>
                    <td className="py-2.5 px-3 text-slate-700">{st.attendance}%</td>
                    <td className="py-2.5 px-3 text-slate-700">{st.cgpa}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-600">{st.risk_score}</td>
                    <td className="py-2.5 px-3 text-slate-500">{(st.top_factors || []).join(", ")}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setInterventionModalStudent({ id: st.student_id, name: st.name });
                          setInterventionModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition text-[11px]"
                      >
                        Create Task
                      </button>
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
  // 4. ADMIN EXECUTIVE DASHBOARD VIEW
  // =========================================================================
  const summary = instAnalytics?.summary || {
    total_students: students.length,
    total_teachers: adminUsers.filter((u) => u.role === "teacher" || u.role === "faculty").length || 2,
    total_courses: 3,
    total_assessments: 11,
    avg_cgpa: 7.39,
    avg_attendance: 79.8,
    active_interventions: interventions.length,
    high_risk_students: students.filter((s) => s.risk_level === "high" || s.risk_score >= 50).length,
  };
  const cgpaDistribution = instAnalytics?.cgpa_distribution || [
    { bracket: "< 6.0", count: 2 },
    { bracket: "6.0 - 7.0", count: 3 },
    { bracket: "7.0 - 8.5", count: 4 },
    { bracket: "8.5 - 10.0", count: 2 },
  ];
  const riskDistribution = instAnalytics?.risk_distribution || [
    { name: "Low Risk", value: 6, color: "#10b981" },
    { name: "Medium Risk", value: 3, color: "#f59e0b" },
    { name: "High Risk", value: 2, color: "#ef4444" },
  ];
  const attendanceTrends = instAnalytics?.attendance_trends || [
    { month: "Aug", actual_attendance: 94.2, target: 85.0 },
    { month: "Sep", actual_attendance: 91.8, target: 85.0 },
    { month: "Oct", actual_attendance: 88.5, target: 85.0 },
    { month: "Nov", actual_attendance: 85.1, target: 85.0 },
    { month: "Dec", actual_attendance: 87.4, target: 85.0 },
  ];
  const progressTrends = instAnalytics?.progress_trends || [
    { week: "W1", avg_mastery: 42.0 },
    { week: "W2", avg_mastery: 55.4 },
    { week: "W3", avg_mastery: 63.8 },
    { week: "W4", avg_mastery: 71.2 },
    { week: "W5", avg_mastery: 74.6 },
  ];
  const departmentStats = instAnalytics?.department_stats || [];

  // Filtered Users List
  const filteredUsers = adminUsers.filter((u) => {
    const matchesRole = userRoleFilter === "all" || u.role.toLowerCase() === userRoleFilter;
    const matchesSearch =
      !userSearchQuery.trim() ||
      u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-900 text-white font-semibold">
              Executive Administration
            </span>
            <span className="text-xs text-slate-500">Institution: NIT Karnataka</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            EDUCORE AI — System Overview & Executive Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-module telemetry uniting PS1 Adaptive Learning, PS2 Subjective Grading, and PS3 Retention Copilot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateUserModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
          <Link
            href="/students"
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>Shared Student Directory</span>
          </Link>
        </div>
      </div>

      {userActionMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{userActionMsg}</span>
        </div>
      )}

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Students"
          value={summary.total_students}
          subtitle="Shared student_id records"
          variant="default"
          icon={Users2}
        />
        <MetricCard
          title="Faculty & Teachers"
          value={summary.total_teachers}
          subtitle="Evaluators & Instructors"
          variant="brand"
          icon={UserCheck}
        />
        <MetricCard
          title="Courses & Assessments"
          value={`${summary.total_courses} / ${summary.total_assessments}`}
          subtitle="Active curriculum"
          variant="default"
          icon={BookOpen}
        />
        <MetricCard
          title="High-Risk Retention"
          value={summary.high_risk_students}
          subtitle="Requires Counselor Attention"
          variant="danger"
          icon={AlertTriangle}
        />
      </div>

      {/* Secondary KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Institution Avg CGPA"
          value={summary.avg_cgpa?.toFixed(2) || "7.39"}
          subtitle="Scale 0 to 10.0"
          variant="default"
          icon={Award}
        />
        <MetricCard
          title="Average Attendance"
          value={`${summary.avg_attendance?.toFixed(1) || "79.8"}%`}
          subtitle="Benchmark target: 85%"
          variant="default"
          icon={Activity}
        />
        <MetricCard
          title="Active Interventions"
          value={summary.active_interventions}
          subtitle="Retention counselor tasks"
          variant="brand"
          icon={Sparkles}
        />
        <MetricCard
          title="PS2 Evaluations Graded"
          value={instAnalytics?.module_overview?.ps2_submissions_evaluated || submissions.length}
          subtitle="Semantic AI scoring"
          variant="default"
          icon={FileCheck2}
        />
      </div>

      {/* Visual Analytics Charts: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Performance & CGPA Distribution */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Academic Performance (CGPA Distribution)</span>
              </h3>
              <p className="text-xs text-slate-500">Student count across performance brackets</p>
            </div>
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
              Avg: {summary.avg_cgpa?.toFixed(2)}
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cgpaDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bracket" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Risk Distribution */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                <span>Student Retention Risk Distribution</span>
              </h3>
              <p className="text-xs text-slate-500">Institution-wide PS3 risk categorizations</p>
            </div>
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">
              {summary.high_risk_students} High Risk
            </span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  label
                >
                  {riskDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <LineIcon className="w-4 h-4 text-indigo-600" />
                <span>Monthly Attendance Trends vs Target</span>
              </h3>
              <p className="text-xs text-slate-500">Chronological attendance trajectory</p>
            </div>
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
              Target: 85.0%
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="actual_attendance" name="Actual Attendance %" stroke="#6366f1" strokeWidth={2.5} />
                <Line type="monotone" dataKey="target" name="Policy Target (85%)" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PS1 Learning Progress Trends */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Learning Progress Trends (PS1 Mastery)</span>
              </h3>
              <p className="text-xs text-slate-500">Average topic mastery trajectory across weeks</p>
            </div>
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
              Rising Mastery
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                <Line type="monotone" dataKey="avg_mastery" name="Avg Mastery %" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Breakdown Overview */}
      {departmentStats.length > 0 && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Department-Wise Performance Matrix</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {departmentStats.map((dept: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">{dept.department}</span>
                  <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                    {dept.students} Students
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Avg CGPA</p>
                    <p className="font-bold text-slate-700">{dept.avg_cgpa}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Attendance</p>
                    <p className="font-bold text-slate-700">{dept.avg_attendance}%</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">High Risk Count:</span>
                  <span className={`font-bold ${dept.high_risk > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {dept.high_risk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Administration & Role Management Table */}
      <div id="user-management" className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Institutional User & Account Management</span>
            </h3>
            <p className="text-xs text-slate-500">
              Manage student, faculty, counselor, and administrator accounts and permissions
            </p>
          </div>
          <button
            onClick={() => setCreateUserModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter users by name or email..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["all", "student", "teacher", "counselor", "admin"].map((r) => (
              <button
                key={r}
                onClick={() => setUserRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  userRoleFilter === r
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Username / Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-slate-900">{u.full_name}</p>
                    {u.student_id && <p className="text-[10px] text-slate-400 font-mono">ID: {u.student_id}</p>}
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-slate-700">{u.username}</p>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`editorial-tag text-[10px] px-2 py-0.5 rounded font-semibold capitalize ${
                        u.role === "admin"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : u.role === "teacher" || u.role === "faculty"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : u.role === "counselor"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{u.department || "Computer Science"}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                      <span>{u.is_active ? "Active" : "Inactive"}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleToggleUserStatus(u)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        u.is_active
                          ? "text-rose-600 hover:bg-rose-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Add User Modal */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Create Institutional User</span>
              </h3>
              <button
                onClick={() => setCreateUserModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  placeholder="e.g. Dr. Priya Raman"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    placeholder="priya_raman"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher / Faculty</option>
                    <option value="counselor">Counselor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="priya.raman@educore.edu"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Min. 6 chars"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={newUserForm.department}
                  onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Electronics & CS">Electronics & CS</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateUserModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-60"
                >
                  {creatingUser ? "Saving..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Modals */}
      <RemedialResourceModal
        isOpen={remedialModalOpen}
        onClose={() => setRemedialModalOpen(false)}
        resource={selectedRemedialResource}
      />

      <InterventionModal
        isOpen={interventionModalOpen}
        onClose={() => setInterventionModalOpen(false)}
        studentId={interventionModalStudent?.id || "STU001"}
        studentName={interventionModalStudent?.name}
        onCreated={() => fetchDashboardData()}
      />
    </div>
  );
}
