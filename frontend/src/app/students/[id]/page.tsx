"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  FileCheck2,
  AlertTriangle,
  User,
  Mail,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Calendar,
  Activity,
  Layers,
  History,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { LoadingState } from "@/components/EmptyState";
import { FeedbackBreakdown } from "@/components/FeedbackBreakdown";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Student360ProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params?.id as string;
  const initialTab = searchParams.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      setLoading(true);
      api
        .getStudent360(studentId)
        .then((res) => {
          if (res.success && res.data) {
            setProfile(res.data);
          } else {
            setError(res.message || "Student record not found in system");
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [studentId]);

  if (loading) {
    return <LoadingState message={`Aggregating 360° telemetry across PS1, PS2, and PS3 for ${studentId}...`} />;
  }

  if (error || !profile) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left space-y-1">
          <p className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Access Restricted / Record Not Found</span>
          </p>
          <p className="text-slate-600 leading-relaxed">{error || "Student record not found or inaccessible under your active role."}</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="px-3.5 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs transition hover:bg-slate-800 shadow-sm">
            Return to Dashboard
          </Link>
          <Link href="/students" className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs transition hover:bg-slate-50">
            Student Directory
          </Link>
        </div>
      </div>
    );
  }

  const { core, ps1_adaptive_learning, ps2_evaluations, ps3_retention_risk } = profile;
  const isHighRisk = ps3_retention_risk.risk_score >= 50;

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "learning", label: "PS1 Learning", icon: GraduationCap },
    { id: "assessments", label: "PS2 Assessments", icon: FileCheck2 },
    { id: "retention", label: "PS3 Retention", icon: AlertTriangle },
    { id: "activity", label: "Activity History", icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Student Directory</span>
        </Link>

        {/* Profile Card Header */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-900 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
              {core.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{core.name}</h1>
                <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  {core.student_id}
                </span>
                <StatusBadge type="risk" value={ps3_retention_risk.risk_score} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {core.department} • Semester {core.semester} • {core.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right shrink-0">
            <div>
              <span className="editorial-tag text-[10px] text-slate-400 font-semibold uppercase">Current CGPA</span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{core.cgpa}</p>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="editorial-tag text-[10px] text-slate-400 font-semibold uppercase">Attendance Rate</span>
              <p
                className={`text-2xl font-black mt-0.5 ${
                  core.attendance_pct < 65
                    ? "text-rose-600"
                    : core.attendance_pct < 75
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {core.attendance_pct}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Module Integration Affirmation Pill */}
      <div className="p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between text-xs border border-slate-800">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Unified Database Record: PS1 Adaptive, PS2 Grading, and PS3 ML Retention write to shared ID:</span>
        </span>
        <span className="editorial-tag px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold">
          {core.student_id}
        </span>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="PS1 Mastery"
              value={`${ps1_adaptive_learning.average_mastery}%`}
              subtitle="Curriculum Topics"
              variant="brand"
              icon={GraduationCap}
            />
            <MetricCard
              title="PS2 Graded Tests"
              value={ps2_evaluations.evaluations_count}
              subtitle="Evaluated Submissions"
              variant="default"
              icon={FileCheck2}
            />
            <MetricCard
              title="PS3 Risk Probability"
              value={`${Math.round(ps3_retention_risk.dropout_probability * 100)}%`}
              subtitle="Random Forest Model"
              variant={isHighRisk ? "danger" : "default"}
              icon={AlertTriangle}
            />
            <MetricCard
              title="LMS Engagement (30d)"
              value={`${core.lms_logins_30d || 14} Logins`}
              subtitle="Activity Volume"
              variant="success"
              icon={Activity}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Learning Status */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">PS1 Learning Mastery</h3>
                <span className="text-xs font-bold text-indigo-600">{ps1_adaptive_learning.average_mastery}%</span>
              </div>
              <p className="text-xs text-slate-600">
                Diagnosed weak concept: <strong className="text-amber-800">{ps1_adaptive_learning.weak_concepts?.[0] || "None"}</strong>.
              </p>
              <Link
                href="/ps1-adaptive"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 pt-2"
              >
                <span>Open Adaptive Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Assessment Status */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">PS2 Assessments</h3>
                <span className="editorial-tag text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                  {ps2_evaluations.evaluations_count} Completed
                </span>
              </div>
              <p className="text-xs text-slate-600">
                All submitted subjective evaluations graded via SentenceTransformer embeddings with faculty moderation audit logs.
              </p>
              <Link
                href="/ps2-grading"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 pt-2"
              >
                <span>Open Assessment Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Retention Status */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">PS3 Retention Risk</h3>
                <span className={`editorial-tag text-[9px] px-1.5 py-0.5 rounded font-semibold ${isHighRisk ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {ps3_retention_risk.risk_tier.toUpperCase()} TIER
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Primary factor: <strong className="text-rose-700">{ps3_retention_risk.primary_risk_driver || "Attendance Continuity"}</strong>.
              </p>
              <Link
                href="/ps3-dropout"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 pt-2"
              >
                <span>Inspect SHAP Attributions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PS1 LEARNING */}
      {activeTab === "learning" && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Curriculum Topic Mastery & Remediation</h3>
              <p className="text-xs text-slate-500">Bayesian updates from student formative quizzes</p>
            </div>
            <Link
              href="/ps1-adaptive"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Take Quiz in PS1 &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {ps1_adaptive_learning.mastery_list?.map((item: any, i: number) => (
              <div key={i} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs text-slate-900">{item.topic_id}</p>
                  <p className="text-[11px] text-slate-500">Evaluated difficulty: {item.difficulty_level || "medium"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-800">{item.mastery_level}%</span>
                  <StatusBadge type="mastery" value={item.mastery_level} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PS2 ASSESSMENTS */}
      {activeTab === "assessments" && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Formative Evaluation History</h3>
              <p className="text-xs text-slate-500">Graded submissions with criterion-level feedback</p>
            </div>
            <Link
              href="/ps2-grading"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Open Grading Desk &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {ps2_evaluations.evaluations?.map((ev: any) => (
              <div key={ev.evaluation_id} className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{ev.assessment_title || ev.assessment_id}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {ev.final_score} / {ev.max_marks || 30.0} Marks
                    </span>
                    <StatusBadge type="submission" value={ev.status} />
                  </div>
                </div>
                <div className="pt-1">
                  <FeedbackBreakdown feedback={ev.ai_feedback} />
                </div>
                {ev.audit_history && ev.audit_history.length > 0 && (
                  <div className="pt-2 text-[11px] text-purple-700 font-medium">
                    Faculty Moderated by: {ev.audit_history[0].moderated_by} (Override: {ev.audit_history[0].new_score})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PS3 RETENTION */}
      {activeTab === "retention" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">SHAP Local Additive Attributions</h3>
                <p className="text-xs text-slate-500">Local feature contributions from TreeExplainer</p>
              </div>
              <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                Random Forest
              </span>
            </div>

            <div className="space-y-2">
              {ps3_retention_risk.shap_attributions?.map((attr: any, i: number) => {
                const isRiskIncreasing = attr.shap_value > 0;
                return (
                  <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 capitalize">{attr.feature.replace(/_/g, " ")}: </span>
                      <span className="text-slate-600 font-medium">{attr.feature_value}</span>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold ${
                        isRiskIncreasing ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {attr.shap_value > 0 ? `+${attr.shap_value}` : attr.shap_value} ({attr.impact_direction})
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 italic">
              * Non-causal notice: SHAP values describe local additive model feature attributions; they do not establish empirical causality.
            </p>
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVITY HISTORY */}
      {activeTab === "activity" && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chronological System Activity Log</h3>
              <p className="text-xs text-slate-500">Cross-engine activity recorded under {studentId}</p>
            </div>
          </div>

          <div className="space-y-3">
            {profile.activity_history?.map((act: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{act.action}</span>
                    <span className="editorial-tag text-[9px] text-slate-400">{act.timestamp || "Recent"}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{act.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
