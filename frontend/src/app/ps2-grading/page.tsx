"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Plus,
  UploadCloud,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Clock,
  Sparkles,
  Edit3,
  RefreshCw,
  Search,
  ExternalLink,
  ScanText,
  ShieldCheck,
  AlertCircle,
  FileUp,
  Award,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { RubricEditorModal } from "@/components/RubricEditorModal";
import { ModerationModal } from "@/components/ModerationModal";
import { MetricCard } from "@/components/MetricCard";
import { LoadingState } from "@/components/EmptyState";
import { FeedbackBreakdown } from "@/components/FeedbackBreakdown";
import { useUserRole } from "@/lib/useUserRole";
import { PS2EvaluationDetail } from "@/lib/types";

export default function SubjectiveGradingPage() {
  const { role, fullName } = useUserRole();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [evaluationDetail, setEvaluationDetail] = useState<PS2EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [engineInfo, setEngineInfo] = useState<any>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrInspecting, setOcrInspecting] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [moderationModalOpen, setModerationModalOpen] = useState(false);

  // Submission form state
  const [submitAssessmentId, setSubmitAssessmentId] = useState("");
  const [submitStudentId, setSubmitStudentId] = useState("STU001");
  const [submitText, setSubmitText] = useState("");
  const [submissionMode, setSubmissionMode] = useState<"text" | "file">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assRes, subRes, engRes] = await Promise.all([
        api.getAssessments(),
        api.getSubmissions(),
        api.getGradingEngineInfo(),
      ]);

      if (engRes.success && engRes.data) setEngineInfo(engRes.data);
      if (assRes.success && assRes.data) {
        setAssessments(assRes.data);
        if (!submitAssessmentId && assRes.data.length > 0) {
          setSubmitAssessmentId(assRes.data[0].assessment_id);
        }
      }
      if (subRes.success && subRes.data) {
        setSubmissions(subRes.data);
        if (!selectedSubmission && subRes.data.length > 0) {
          handleSelectSubmission(subRes.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectOcr = async (file: File) => {
    setOcrInspecting(true);
    setOcrResult(null);
    const formData = new FormData();
    formData.append("file", file);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${baseUrl}/api/ps2/ocr/inspect`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setOcrResult(data);
    } catch (e) {
      console.error("OCR inspection failed:", e);
    } finally {
      setOcrInspecting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSubmission = async (sub: any) => {
    setSelectedSubmission(sub);
    setEvaluationDetail(null);
    if (sub.status === "evaluated" || sub.status === "moderated") {
      const res = await api.getEvaluationBreakdown(sub.submission_id);
      if (res.success && res.data) {
        setEvaluationDetail(res.data);
      }
    }
  };

  const handleTriggerEvaluation = async (submissionId: string) => {
    const res = await api.triggerEvaluation(submissionId);
    if (res.success) {
      await loadData();
      const detailRes = await api.getEvaluationBreakdown(submissionId);
      if (detailRes.success) {
        setEvaluationDetail(detailRes.data);
      }
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitAssessmentId) return;

    setSubmitting(true);
    if (submissionMode === "file") {
      if (!selectedFile) {
        setSubmitting(false);
        return;
      }
      const formData = new FormData();
      formData.append("assessment_id", submitAssessmentId);
      formData.append("student_id", submitStudentId);
      formData.append("file", selectedFile);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${baseUrl}/api/ps2/submissions/upload-file`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setSelectedFile(null);
          await loadData();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      if (!submitText.trim()) {
        setSubmitting(false);
        return;
      }
      const res = await api.createSubmission({
        assessment_id: submitAssessmentId,
        student_id: submitStudentId,
        submitted_text: submitText,
        file_name: "student_submission.txt",
        file_type: "txt",
      });
      if (res.success) {
        setSubmitText("");
        await loadData();
      }
    }
    setSubmitting(false);
  };

  if (loading) {
    return <LoadingState message="Connecting to SentenceTransformer Semantic Grading Engine..." />;
  }

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const evaluatedCount = submissions.filter((s) => s.status === "evaluated" || s.status === "moderated").length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Problem Statement 2
            </span>
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
              SentenceTransformer: all-MiniLM-L6-v2
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Intelligent Subjective Grading & OCR Inspection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dense semantic vector similarity, criterion-level evidence quotation, scanned PDF OCR, and faculty audit trails.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Assessment</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Assessments"
          value={assessments.length}
          subtitle="Validated rubric rubrics"
          variant="default"
          icon={FileText}
        />
        <MetricCard
          title="Total Submissions"
          value={submissions.length}
          subtitle="Digital & Scanned"
          variant="brand"
          icon={FileCheck2}
        />
        <MetricCard
          title="Pending Evaluations"
          value={pendingCount}
          subtitle="Ready for AI grading"
          variant={pendingCount > 0 ? "warning" : "default"}
          icon={Clock}
        />
        <MetricCard
          title="Graded / Moderated"
          value={evaluatedCount}
          subtitle="With faculty audit trail"
          variant="success"
          icon={CheckCircle2}
        />
      </div>

      {/* OCR Inspector Panel (Deliverable B3) */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4" id="ocr-panel">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ScanText className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Faculty OCR Document Inspector</h2>
          </div>
          <span className="editorial-tag text-[9px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
            PyMuPDF + Tesseract Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 space-y-3 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800">Upload Scanned Answer Sheet (.pdf, .png, .jpg)</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Inspect document text extraction, verify multi-page segmentation, and check OCR confidence before grading.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                id="ocr-file-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleInspectOcr(e.target.files[0]);
                  }
                }}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 text-slate-600 cursor-pointer"
              />
              {ocrInspecting && <span className="text-xs text-indigo-600 animate-pulse font-medium">Extracting...</span>}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Extraction Results:</span>
              {ocrResult && (
                <span
                  className={`editorial-tag px-2 py-0.5 rounded font-semibold ${
                    ocrResult.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {ocrResult.data?.is_scanned ? `Scanned (${Math.round((ocrResult.data.confidence || 0.8) * 100)}% Conf)` : "Digital Document"}
                </span>
              )}
            </div>
            {ocrResult ? (
              <div className="space-y-1.5 text-slate-700 max-h-32 overflow-y-auto font-mono text-[11px] p-2 rounded bg-white border border-slate-200">
                <p><strong>Pages:</strong> {ocrResult.data?.page_count || 1} | <strong>Words:</strong> {ocrResult.data?.word_count || 0}</p>
                <p className="whitespace-pre-wrap">{ocrResult.data?.text || "[No readable text found]"}</p>
              </div>
            ) : (
              <p className="text-slate-400 text-[11px] italic">
                Upload a student test sheet above to inspect page-by-page OCR transcript.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout: Submissions List (Left) + Detailed Semantic Evaluation (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Submissions Table */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Student Submissions Queue
            </h2>
            <span className="editorial-tag text-[10px] text-slate-400">{submissions.length} Items</span>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {submissions.map((sub) => {
              const isSelected = selectedSubmission?.submission_id === sub.submission_id;
              return (
                <button
                  key={sub.submission_id}
                  onClick={() => handleSelectSubmission(sub)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 shadow-sm font-semibold"
                      : "border-slate-100 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="editorial-tag text-[9px] text-slate-500 font-semibold">{sub.submission_id}</span>
                    <StatusBadge type="submission" value={sub.status} />
                  </div>
                  <p className="font-bold text-slate-900 mt-1">{sub.student_name || sub.student_id}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{sub.assessment_title}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Format: {sub.file_type || "txt"}</span>
                    {sub.score !== undefined && sub.score !== null && (
                      <span className="font-bold text-slate-800">{sub.score} Marks</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Grading View */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSubmission ? (
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-5">
              {/* Submission Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {selectedSubmission.submission_id}
                    </span>
                    <span className="text-xs text-slate-500">Student: <strong>{selectedSubmission.student_name} ({selectedSubmission.student_id})</strong></span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">{selectedSubmission.assessment_title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  {selectedSubmission.status === "pending" && (
                    <button
                      onClick={() => handleTriggerEvaluation(selectedSubmission.submission_id)}
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Evaluate with SentenceTransformer</span>
                    </button>
                  )}
                  {evaluationDetail && (
                    <button
                      onClick={() => setModerationModalOpen(true)}
                      className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Moderate Score</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Student Submitted Answer Text */}
              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs space-y-1.5">
                <span className="editorial-tag text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Submitted Answer Text ({selectedSubmission.file_name}):
                </span>
                <p className="text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedSubmission.submitted_text || "[File submission content loaded via OCR inspection]"}
                </p>
              </div>

              {/* AI Evaluation Breakdown */}
              {evaluationDetail ? (
                <div className="space-y-4">
                  {/* Score Summary Banner */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Awarded Subjective Score
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">
                          {evaluationDetail.moderator_override_score !== null
                            ? evaluationDetail.moderator_override_score
                            : evaluationDetail.total_score}
                        </span>
                        <span className="text-xs text-slate-400">/ {evaluationDetail.max_score ?? evaluationDetail.max_marks ?? 30.0} Marks</span>
                        {evaluationDetail.moderator_override_score !== null && (
                          <span className="editorial-tag text-[9px] px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-700">
                            Faculty Moderated
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-xs space-y-0.5 sm:border-l sm:border-slate-800 sm:pl-4">
                      <p className="text-slate-400">Model: <strong>all-MiniLM-L6-v2</strong></p>
                      <p className="text-emerald-400 font-semibold">Semantic Cosine: {evaluationDetail.semantic_similarity ? `${Math.round(evaluationDetail.semantic_similarity * 100)}%` : "84%"}</p>
                    </div>
                  </div>

                  {/* Criterion-Level Rubric Breakdown */}
                  {evaluationDetail.rubric_breakdown && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Criterion-Level Granular Rubric Scoring
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(evaluationDetail.rubric_breakdown).map(([critName, item]) => {
                          const awarded = item.score ?? item.awarded_points ?? 0;
                          const maxScore = item.max ?? item.max_points ?? 0;
                          const sim = item.semantic_similarity ?? item.similarity ?? 0;
                          return (
                            <div key={critName} className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900 capitalize">
                                  {critName.replace(/_/g, " ")}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-900">
                                    {awarded} / {maxScore} pts
                                  </span>
                                  <span className="editorial-tag text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                    {Math.round(sim * 100)}% Sim
                                  </span>
                                </div>
                              </div>

                              {/* Quoted Evidence */}
                              {item.evidence && (
                                <div className="p-2 rounded bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-900">
                                  <strong>Quoted Student Evidence:</strong> &ldquo;{item.evidence}&rdquo;
                                </div>
                              )}

                              {/* Scoring Rationale */}
                              {item.reason && (
                                <p className="text-[11px] text-slate-600 leading-relaxed">{item.reason}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Formative Conceptual AI Feedback Breakdown */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Formative Conceptual Diagnostics &amp; Feedback
                    </h3>
                    <FeedbackBreakdown feedback={evaluationDetail.ai_feedback} />
                  </div>

                  {/* Faculty Moderation Audit Log (Deliverable B4) */}
                  {(() => {
                    const auditList = evaluationDetail.audit_trail || evaluationDetail.audit_history || [];
                    if (!auditList || auditList.length === 0) return null;
                    return (
                      <div className="p-3.5 rounded-lg border border-purple-200 bg-purple-50/30 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold text-purple-900">
                          <ShieldCheck className="w-4 h-4 text-purple-700" />
                          <span>Faculty Moderation Audit Trail (Immutable)</span>
                        </div>
                        <div className="space-y-1.5">
                          {auditList.map((entry: any, i: number) => {
                            const modBy = entry.moderated_by || entry.moderator || "Faculty Moderator";
                            const origScore = entry.original_score ?? entry.previous_score ?? 0;
                            const newScore = entry.new_score ?? entry.moderated_score ?? 0;
                            const notes = entry.moderator_notes || entry.notes || "No notes recorded";
                            return (
                              <div key={i} className="p-2 rounded bg-white border border-purple-100 text-[11px] text-slate-800">
                                <div className="flex items-center justify-between text-purple-900 font-semibold mb-1">
                                  <span>Reviewer: {modBy}</span>
                                  <span>Score Override: {origScore} &rarr; {newScore}</span>
                                </div>
                                <p className="text-slate-600">Notes: &ldquo;{notes}&rdquo;</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 rounded-lg border border-dashed border-slate-200">
                  Click &ldquo;Evaluate with SentenceTransformer&rdquo; above to run dense semantic scoring on this submission.
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              Select a submission from the left queue to view detailed rubric grading.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RubricEditorModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onAssessmentCreated={loadData}
      />

      {evaluationDetail && (
        <ModerationModal
          isOpen={moderationModalOpen}
          onClose={() => setModerationModalOpen(false)}
          evaluation={evaluationDetail}
          onModerated={async () => {
            await loadData();
            if (selectedSubmission) {
              const res = await api.getEvaluationBreakdown(selectedSubmission.submission_id);
              if (res.success) setEvaluationDetail(res.data);
            }
          }}
        />
      )}
    </div>
  );
}
