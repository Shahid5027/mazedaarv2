"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  TrendingDown,
  UploadCloud,
  UserCheck,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  BarChart2,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Grid3X3,
  TrendingUp,
  Activity,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { CsvUploadModal } from "@/components/CsvUploadModal";
import { InterventionModal } from "@/components/InterventionModal";
import { ModelMetricsModal } from "@/components/ModelMetricsModal";
import { MetricCard } from "@/components/MetricCard";
import { LoadingState } from "@/components/EmptyState";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export default function DropoutPredictionPage() {
  const [riskOverview, setRiskOverview] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("STU003");
  const [explainability, setExplainability] = useState<any>(null);
  const [shapData, setShapData] = useState<any>(null);
  const [longitudinalData, setLongitudinalData] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("risk_score");

  // Modals
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, studentsRes, intervRes, heatRes] = await Promise.all([
        api.getRiskOverview(),
        api.getRiskStudents({ risk_level: riskFilter || undefined, sort_by: sortBy }),
        api.getInterventions(),
        api.getRiskHeatmap(),
      ]);

      if (overviewRes.success && overviewRes.data) setRiskOverview(overviewRes.data);
      if (studentsRes.success && studentsRes.data) setStudents(studentsRes.data);
      if (intervRes.success && intervRes.data) setInterventions(intervRes.data);
      if (heatRes.success && heatRes.data) setHeatmapData(heatRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [riskFilter, sortBy]);

  const loadStudentExplainability = async (studentId: string) => {
    setSelectedStudentId(studentId);
    try {
      const [expRes, shapRes, longRes] = await Promise.all([
        api.getExplainability(studentId),
        api.getStudentShap(studentId),
        api.getLongitudinalTrend(studentId),
      ]);
      if (expRes.success && expRes.data) setExplainability(expRes.data);
      if (shapRes.success && shapRes.data) setShapData(shapRes.data);
      if (longRes.success && longRes.data) setLongitudinalData(longRes.data);
    } catch (e) {
      console.warn("Failed to load student details:", e);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentExplainability(selectedStudentId);
    }
  }, [selectedStudentId]);

  const handleUpdateInterventionStatus = async (interventionId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === "planned" || currentStatus === "open"
        ? "in_progress"
        : currentStatus === "in_progress"
        ? "resolved"
        : "open";

    const res = await api.updateIntervention(interventionId, { status: nextStatus });
    if (res.success) {
      loadData();
    }
  };

  if (loading) {
    return <LoadingState message="Connecting to SHAP TreeExplainer & Dropout Model Engine..." />;
  }

  const highRiskCount = riskOverview?.high_risk_count ?? 3;
  const mediumRiskCount = riskOverview?.medium_risk_count ?? 3;
  const lowRiskCount = riskOverview?.low_risk_count ?? 4;
  const avgRisk = riskOverview?.average_risk_score ?? 48.5;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
              Problem Statement 3
            </span>
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
              Model: RandomForestClassifier + TreeExplainer
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Explainable Student Retention Copilot
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Exact additive SHAP local feature attributions, longitudinal trajectory tracking, 3x3 risk matrix, and counselor workflows.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMetricsModalOpen(true)}
            className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Model Metrics</span>
          </button>
          <button
            onClick={() => setCsvModalOpen(true)}
            className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload Batch CSV</span>
          </button>
          <button
            onClick={() => setInterventionModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Intervention</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="High Risk (P &ge; 50%)"
          value={highRiskCount}
          subtitle="Immediate Counselor Action"
          variant="danger"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Medium Risk Watchlist"
          value={mediumRiskCount}
          subtitle="Attendance or Grade dip"
          variant="warning"
          icon={Clock}
        />
        <MetricCard
          title="Low Risk Stable"
          value={lowRiskCount}
          subtitle="Normative progression"
          variant="success"
          icon={ShieldCheck}
        />
        <MetricCard
          title="Cohort Average Risk"
          value={`${avgRisk}%`}
          subtitle="Random Forest baseline"
          variant="brand"
          icon={Activity}
        />
      </div>

      {/* Interactive 3x3 Risk Heatmap Matrix (Deliverable C4) */}
      {heatmapData && heatmapData.risk_matrix_heatmap && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4" id="heatmap-matrix">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Institutional 3x3 Risk Matrix Heatmap</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution across Attendance tiers (&lt;65%, 65-80%, &gt;80%) vs Academic CGPA tiers (&lt;6.0, 6.0-7.5, &gt;7.5)
              </p>
            </div>
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
              Live Persisted Data
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {heatmapData.risk_matrix_heatmap.map((cell: any, idx: number) => {
              const count = cell.count || 0;
              const riskTier = cell.risk_tier || "low";
              const cellBg =
                riskTier === "critical"
                  ? "bg-rose-50/90 border-rose-200 hover:border-rose-300"
                  : riskTier === "high"
                  ? "bg-amber-50/80 border-amber-200 hover:border-amber-300"
                  : "bg-emerald-50/60 border-emerald-200 hover:border-emerald-300";

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border transition ${cellBg} space-y-1.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="editorial-tag text-[9px] uppercase font-bold text-slate-600">
                      Att: {cell.attendance_tier} | CGPA: {cell.cgpa_tier}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        riskTier === "critical"
                          ? "bg-rose-200/80 text-rose-900"
                          : riskTier === "high"
                          ? "bg-amber-200/80 text-amber-900"
                          : "bg-emerald-200/80 text-emerald-900"
                      }`}
                    >
                      {cell.risk_tier}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-slate-900">{count} Students</span>
                    <span className="text-xs text-slate-600 font-medium">
                      Avg P: {cell.average_probability ? `${Math.round(cell.average_probability * 100)}%` : "N/A"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Student Drilldown: Left Column (Student List) + Right Column (SHAP & Longitudinal) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Watchlist */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Student Risk Watchlist
            </h2>
            <div className="flex items-center gap-1.5">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="text-[10px] font-semibold border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 text-slate-700"
              >
                <option value="">All Tiers</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {students.map((stu) => {
              const isSelected = selectedStudentId === stu.student_id;
              return (
                <button
                  key={stu.student_id}
                  onClick={() => loadStudentExplainability(stu.student_id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 shadow-sm font-semibold"
                      : "border-slate-100 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="editorial-tag text-[9px] text-slate-500 font-semibold">{stu.student_id}</span>
                    <StatusBadge type="risk" value={stu.risk_level || "low"} />
                  </div>
                  <p className="font-bold text-slate-900 mt-1">{stu.full_name}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Attendance: {stu.attendance_rate}%</span>
                    <span>CGPA: {stu.cgpa}</span>
                  </div>
                  <div className="mt-1.5 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        stu.risk_score >= 50 ? "bg-rose-500" : stu.risk_score >= 30 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${stu.risk_score}%` }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: SHAP TreeExplainer & Longitudinal History */}
        <div className="lg:col-span-2 space-y-6">
          {shapData ? (
            <div className="space-y-6">
              {/* Student Header */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {shapData.student_id}
                      </span>
                      <span className="text-xs text-slate-500">
                        P(dropout): <strong>{Math.round(shapData.predicted_probability * 100)}%</strong>
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      SHAP Additive Attribution: {shapData.student_id}
                    </h2>
                  </div>

                  <Link
                    href={`/students/${shapData.student_id}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 shrink-0"
                  >
                    <span>Full 360° Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Model Baseline vs Predicted */}
                <div className="p-3.5 rounded-lg bg-slate-900 text-white flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Model Expected Value (E[f(x)] / Prior):</span>
                    <p className="text-base font-bold text-white">{shapData.base_value * 100}%</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Predicted Student Risk Probability:</span>
                    <p className="text-base font-bold text-amber-400">
                      {Math.round(shapData.predicted_probability * 100)}%
                    </p>
                  </div>
                </div>

                {/* SHAP Feature Contribution Waterfall (Deliverable C1) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      TreeExplainer Local Additive Feature Attributions (&phi;<sub>i</sub>)
                    </h3>
                    <span className="editorial-tag text-[9px] text-slate-400">Exact Shapley Values</span>
                  </div>

                  <div className="space-y-2">
                    {shapData.feature_shap_values?.map((item: any) => {
                      const isRiskIncreasing = item.shap_value > 0;
                      const absVal = Math.abs(item.shap_value);
                      const barWidth = Math.min(100, Math.round((absVal / 0.15) * 100));

                      return (
                        <div key={item.feature} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-800 capitalize">
                              {item.feature.replace(/_/g, " ")}: <strong>{item.feature_value}</strong>
                            </span>
                            <span
                              className={`font-mono text-[11px] font-bold ${
                                isRiskIncreasing ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {item.shap_value > 0 ? `+${item.shap_value}` : item.shap_value} ({item.impact_direction})
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isRiskIncreasing ? "bg-rose-500" : "bg-emerald-500"}`}
                              style={{ width: `${barWidth}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-slate-400 italic pt-1">
                    * Disclaimer: SHAP values describe local additive model feature attributions; they do not establish empirical causality.
                  </p>
                </div>
              </div>

              {/* Longitudinal Risk Progression Chart (Deliverable C2) */}
              {longitudinalData && (
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Longitudinal Risk Trajectory (Multi-Week Timeline)
                      </h3>
                      <p className="text-[11px] text-slate-500">Historical trend across risk, attendance, and grades</p>
                    </div>
                    {longitudinalData.has_sufficient_history && (
                      <span className="editorial-tag text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {longitudinalData.data_point_count} Snapshots
                      </span>
                    )}
                  </div>

                  {longitudinalData.has_sufficient_history ? (
                    <div className="h-60 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={longitudinalData.progression_series}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Line
                            type="monotone"
                            dataKey="risk_score"
                            name="Risk Score"
                            stroke="#ef4444"
                            strokeWidth={2.5}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="attendance_rate"
                            name="Attendance Rate"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="average_grade"
                            name="Average Grade"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      Insufficient historical data points to render longitudinal trend chart (minimum 2 historical evaluations required).
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              Select a student from the left watchlist to view exact SHAP attributions and longitudinal history.
            </div>
          )}
        </div>
      </div>

      {/* Counselor Intervention Workspace (Deliverable C3) */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4" id="counselor-tasks">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Counselor Retention Intervention Workspace</span>
            </h2>
            <p className="text-xs text-slate-500">
              Assigned academic and counseling action plans with status progression
            </p>
          </div>
          <button
            onClick={() => setInterventionModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Action Item</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Intervention Action</th>
                <th className="py-2.5 px-3">Assigned Staff</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interventions.map((item) => (
                <tr key={item.intervention_id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {item.student_name} <span className="text-slate-400 font-normal">({item.student_id})</span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{item.title}</td>
                  <td className="py-2.5 px-3 text-slate-600">{item.counselor_name || "Kavita Deshmukh"}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`editorial-tag px-2 py-0.5 rounded font-semibold ${
                        item.priority === "urgent"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : item.priority === "high"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`editorial-tag px-2 py-0.5 rounded font-semibold ${
                        item.status === "completed" || item.status === "resolved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.status === "in_progress"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleUpdateInterventionStatus(item.intervention_id, item.status)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Advance Status &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CsvUploadModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onUploadSuccess={loadData}
      />

      <InterventionModal
        isOpen={interventionModalOpen}
        onClose={() => setInterventionModalOpen(false)}
        onCreated={loadData}
        studentId={selectedStudentId}
      />

      <ModelMetricsModal
        isOpen={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
      />
    </div>
  );
}
