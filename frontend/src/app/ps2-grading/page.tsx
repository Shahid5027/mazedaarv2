"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  FileText,
  Clock,
  ScanText,
} from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { RubricEditorModal } from "@/components/RubricEditorModal";
import { MetricCard } from "@/components/MetricCard";
import { LoadingState } from "@/components/EmptyState";
import { PS2EvaluationDetail } from "@/lib/types";

export default function SubjectiveGradingPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [evaluationDetail, setEvaluationDetail] = useState<PS2EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [engineInfo, setEngineInfo] = useState<any>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrInspecting, setOcrInspecting] = useState(false);
  const [evaluationMessage, setEvaluationMessage] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Submission form state
  const [submitAssessmentId, setSubmitAssessmentId] = useState("");
  const [submitStudentId, setSubmitStudentId] = useState("STU001");
  const [submitText, setSubmitText] = useState("");
  const [submissionMode] = useState<"text" | "file">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [selectedPageNumber, setSelectedPageNumber] = useState(1);
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [savingRegions, setSavingRegions] = useState(false);
  const [regionMessage, setRegionMessage] = useState("");
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(false);

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
        setSelectedPageNumber(1);
        setSelectedRegionId(res.data.answer_regions?.[0]?.boxes?.[0]?.id || "");
      }
    }
  };

  const handleTriggerEvaluation = async (submissionId: string) => {
    setEvaluationMessage("");
    setEvaluatingSubmission(true);
    try {
      const res = await api.triggerEvaluation(submissionId);
      if (res.success) {
        await loadData();
        const detailRes = await api.getEvaluationBreakdown(submissionId);
        if (detailRes.success) {
          setEvaluationDetail(detailRes.data);
          setSelectedPageNumber(1);
          setSelectedRegionId(detailRes.data.answer_regions?.[0]?.boxes?.[0]?.id || "");
        }
      } else {
        setEvaluationMessage(res.message || "Evaluation could not be completed. Check that a readable reference sheet is saved for this assessment.");
      }
    } finally {
      setEvaluatingSubmission(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitAssessmentId) return;

    setSubmitting(true);
    setUploadMessage("");
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
          setUploadMessage("Student answer sheet uploaded and added to the grading queue.");
          await loadData();
        } else {
          setUploadMessage(data.message || "Could not read this answer sheet. Check the scan and try again.");
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

  const handleUploadReference = async () => {
    if (!submitAssessmentId || !referenceFile) return;
    setReferenceUploading(true);
    setUploadMessage("");
    const formData = new FormData();
    formData.append("file", referenceFile);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("educore_token");
      const res = await fetch(`${baseUrl}/api/ps2/assessments/${submitAssessmentId}/reference-file`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setReferenceFile(null);
        setUploadMessage(`Reference sheet saved (${data.data?.word_count ?? 0} words). Student answers for this assessment can now be graded.`);
      } else {
        setUploadMessage(data.message || "Could not read the reference sheet. Try a clearer scan or text based PDF.");
      }
    } catch {
      setUploadMessage("Reference sheet upload failed. Check that the grading service is running and try again.");
    } finally {
      setReferenceUploading(false);
    }
  };

  const updateAnswerRegion = (pageIndex: number, regionId: string, changes: Record<string, any>) => {
    setEvaluationDetail((current) => {
      if (!current?.answer_regions) return current;
      const pages = current.answer_regions.map((page, index) => index !== pageIndex ? page : {
        ...page,
        boxes: page.boxes.map((box) => {
          if (box.id !== regionId) return box;
          const updated = { ...box, ...changes };
          const ratio = updated.max_marks > 0 ? updated.awarded / updated.max_marks : 0;
          updated.status = ratio >= 0.8 ? "correct" : ratio > 0 ? "partial" : "wrong";
          return updated;
        }),
      });
      const regions = pages.flatMap((page) => page.boxes);
      const total = regions.reduce((sum, box) => sum + Number(box.awarded || 0), 0);
      const max = Number(current.max_score || 0);
      return { ...current, answer_regions: pages, total_score: Number(Math.min(total, max).toFixed(2)), percentage: max ? Number((Math.min(total, max) / max * 100).toFixed(1)) : 0 };
    });
  };

  const saveAnswerRegions = async () => {
    if (!evaluationDetail) return false;
    setSavingRegions(true);
    setRegionMessage("");
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("educore_token");
      const res = await fetch(`${baseUrl}/api/ps2/evaluations/${evaluationDetail.evaluation_id}/answer-regions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ pages: evaluationDetail.answer_regions || [] }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Could not save answer corrections.");
      setEvaluationDetail((current) => current ? { ...current, ...data.data } : current);
      setRegionMessage("Answer boxes and marks saved.");
      return true;
    } catch (error: any) {
      setRegionMessage(error.message || "Could not save answer corrections.");
      return false;
    } finally {
      setSavingRegions(false);
    }
  };

  const handleApproveEvaluation = async () => {
    if (!evaluationDetail) return;
    const saved = await saveAnswerRegions();
    if (!saved) return;
    const refreshed = await api.getEvaluationBreakdown(evaluationDetail.submission_id);
    if (!refreshed.success || !refreshed.data) {
      setRegionMessage("Corrections were saved, but the latest score could not be loaded for approval.");
      return;
    }
    setEvaluationDetail(refreshed.data);
    const result = await api.overrideEvaluation(evaluationDetail.evaluation_id, {
      moderator_override_score: refreshed.data.total_score,
      moderator_notes: "Approved after reviewing the answer sheet regions.",
    });
    if (result.success && selectedSubmission) {
      const detail = await api.getEvaluationBreakdown(selectedSubmission.submission_id);
      if (detail.success) setEvaluationDetail(detail.data);
      setRegionMessage("Evaluation approved.");
    } else {
      setRegionMessage(result.message || "Could not approve the evaluation.");
    }
  };

  const handleReviewLater = async () => {
    const saved = await saveAnswerRegions();
    if (saved) {
      setEvaluationDetail(null);
      setSelectedSubmission(null);
    }
  };

  const addAnswerRegion = () => {
    if (!evaluationDetail?.answer_regions?.length) return;
    const pageIndex = selectedPageNumber - 1;
    const page = evaluationDetail.answer_regions[pageIndex];
    if (!page) return;
    const nextId = `p${selectedPageNumber}-manual-${Date.now()}`;
    const region = { id: nextId, label: `Part ${page.boxes.length + 1}`, x: 0.15, y: 0.15, width: 0.45, height: 0.12, status: "wrong" as const, awarded: 0, max_marks: 0, text: "Manually added region", similarity: 0 };
    setEvaluationDetail({ ...evaluationDetail, answer_regions: evaluationDetail.answer_regions.map((entry, index) => index === pageIndex ? { ...entry, boxes: [...entry.boxes, region] } : entry) });
    setSelectedRegionId(nextId);
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

      {/* Reference and student sheet upload workflow */}
      <section className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Upload answer sheets</h2>
          <p className="mt-1 text-xs text-slate-500">Choose an assessment, upload its reference answer sheet, then add student sheets to the grading queue.</p>
        </div>
        {assessments.length > 0 ? (
          <>
            <label className="block max-w-md text-xs font-semibold text-slate-700">Assessment
              <select value={submitAssessmentId} onChange={(e) => setSubmitAssessmentId(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800">
                {assessments.map((assessment) => <option key={assessment.assessment_id} value={assessment.assessment_id}>{assessment.title}</option>)}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
                <div><p className="text-xs font-bold text-slate-800">1. Reference paper (questions + model answers)</p><p className="mt-1 text-[11px] text-slate-500">Upload the reference PDF or scan containing the questions and expected answers.</p></div>
                <input type="file" accept=".pdf,.txt,.png,.jpg,.jpeg" onChange={(e) => setReferenceFile(e.target.files?.[0] || null)} className="block w-full text-xs text-slate-600" />
                <button type="button" disabled={!referenceFile || referenceUploading} onClick={handleUploadReference} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{referenceUploading ? "Reading reference…" : "Save reference sheet"}</button>
              </div>
              <form onSubmit={handleSubmitAnswer} className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4 space-y-3">
                <div><p className="text-xs font-bold text-slate-800">2. Student answer sheet</p><p className="mt-1 text-[11px] text-slate-500">Upload the student’s scanned answer paper (.pdf, .png, .jpg).</p></div>
                <label className="block text-[11px] font-medium text-slate-600">Student ID
                  <input value={submitStudentId} onChange={(e) => setSubmitStudentId(e.target.value)} required className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs" placeholder="e.g. STU001" />
                </label>
                <input type="file" required accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="block w-full text-xs text-slate-600" />
                <button type="submit" disabled={!selectedFile || submitting} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{submitting ? "Uploading…" : "Add student sheet"}</button>
              </form>
            </div>
            {uploadMessage && <p role="status" className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{uploadMessage}</p>}
          </>
        ) : <p className="text-xs text-amber-700">Create an assessment first so the reference and student sheets have a rubric to grade against.</p>}
      </section>

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
      <div className={`grid grid-cols-1 gap-6 ${evaluationDetail ? "" : "lg:grid-cols-3"}`}>
        {/* Left Column: Submissions Table */}
        {!evaluationDetail && <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
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
        </div>}

        {/* Right Column: Detailed Grading View */}
        <div role={evaluationDetail ? "dialog" : undefined} aria-modal={evaluationDetail ? true : undefined} className={evaluationDetail ? "fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-2 sm:p-5" : "lg:col-span-2 space-y-6"} onClick={evaluationDetail ? () => { setEvaluationDetail(null); setSelectedSubmission(null); } : undefined}>
          {selectedSubmission ? (
            <div onClick={evaluationDetail ? (event) => event.stopPropagation() : undefined} className={`w-full rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ${evaluationDetail ? "max-h-[96vh] max-w-[1500px] overflow-y-auto" : "space-y-5"}`}>
              {/* Student and score header */}
              <div className="grid gap-3 border-b border-slate-100 pb-4 md:grid-cols-[1.2fr_1.2fr_auto_auto] md:items-end">
                <div><label className="block text-[10px] font-semibold text-slate-500">Student Name</label><div className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">{selectedSubmission.student_name || "Student"}</div></div>
                <div><label className="block text-[10px] font-semibold text-slate-500">Student Roll No.</label><div className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">{selectedSubmission.student_id}</div></div>
                <div><label className="block text-[10px] font-semibold text-slate-500">Current score</label><div className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900">{evaluationDetail ? `${evaluationDetail.moderator_override_score ?? evaluationDetail.total_score} / ${evaluationDetail.max_score} · ${(((evaluationDetail.moderator_override_score ?? evaluationDetail.total_score) / (evaluationDetail.max_score || 1)) * 100).toFixed(1)}%` : "Not evaluated"}</div></div>
                <div className="flex items-center gap-2 md:justify-end">
                  {evaluationDetail ? <>
                    <button onClick={() => { setEvaluationDetail(null); setSelectedSubmission(null); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Close</button>
                    <button onClick={handleReviewLater} disabled={savingRegions} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"><Clock className="h-3.5 w-3.5" />Review later</button>
                    <button onClick={handleApproveEvaluation} disabled={savingRegions} className="rounded-lg bg-purple-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Approve</button>
                  </> : null}
                </div>
                <div className="text-[10px] text-slate-500 md:col-span-4">{selectedSubmission.assessment_title} · {selectedSubmission.submission_id} · {selectedSubmission.file_name}</div>
              </div>

              {!evaluationDetail && <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div className="max-w-md">
                  <FileText className="mx-auto h-9 w-9 text-indigo-500" />
                  <h3 className="mt-3 text-base font-bold text-slate-900">Answer sheet ready for correction</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">Open correction to evaluate this paper and review its marked pages in a centered faculty workspace.</p>
                  {selectedSubmission.status === "pending" && <button onClick={() => handleTriggerEvaluation(selectedSubmission.submission_id)} disabled={evaluatingSubmission} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{evaluatingSubmission ? "Evaluating answer sheet…" : "Open correction"}</button>}
                </div>
              </div>}

              {/* AI Evaluation Breakdown */}
              {evaluationMessage && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{evaluationMessage}</p>}
              {evaluationDetail ? (
                <div className="space-y-4">
                  {/* Screenshot-style answer sheet review */}
                  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Corrected answer sheet</h3>
                        <p className="text-[11px] text-slate-500">Select a marked answer to edit its box or marks.</p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold">
                        <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">Correct</span>
                        <span className="rounded bg-amber-100 px-2 py-1 text-amber-800">Partial</span>
                        <span className="rounded bg-red-100 px-2 py-1 text-red-800">Wrong</span>
                      </div>
                    </div>

                    {evaluationDetail.answer_regions && evaluationDetail.answer_regions.length > 0 ? (
                      <div className="grid min-h-[650px] grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)]">
                        <aside className="border-b border-slate-200 bg-slate-50 p-3 lg:border-b-0 lg:border-r">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-800">Pages</h4>
                            <span className="text-[10px] text-slate-500">{selectedPageNumber} of {evaluationDetail.answer_regions.length}</span>
                          </div>
                          <div className="mb-4 flex items-center gap-1 overflow-x-auto">
                            {evaluationDetail.answer_regions.map((page) => (
                              <button key={page.page_number} onClick={() => setSelectedPageNumber(page.page_number)} className={`rounded-md border px-3 py-1.5 text-[11px] font-bold ${selectedPageNumber === page.page_number ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}>P{page.page_number}</button>
                            ))}
                            <button onClick={addAnswerRegion} title="Add a marking box" className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700"><Plus className="h-4 w-4" /></button>
                          </div>
                          <h4 className="mb-2 text-xs font-bold text-slate-800">Answers on this page</h4>
                          <div className="space-y-2">
                            {(() => {
                              const boxes = evaluationDetail.answer_regions[selectedPageNumber - 1]?.boxes || [];
                              const grouped = boxes.reduce<Record<string, typeof boxes>>((all, box) => {
                                const question = box.label.split(" · Part")[0] || "Answers";
                                (all[question] ||= []).push(box);
                                return all;
                              }, {});
                              return Object.entries(grouped).map(([question, questionBoxes]) => (
                                <div key={question} className="space-y-1.5">
                                  <div className="flex items-center justify-between rounded-md bg-slate-100 px-2.5 py-2 text-[11px]">
                                    <span className="font-bold text-slate-900">{question}</span>
                                    <span className="font-semibold text-slate-700">Total: {questionBoxes.reduce((sum, box) => sum + box.awarded, 0).toFixed(2)} / {questionBoxes.reduce((sum, box) => sum + box.max_marks, 0).toFixed(2)}</span>
                                  </div>
                                  {questionBoxes.map((box) => {
                                    const colorClass = box.status === "correct" ? "border-emerald-500" : box.status === "partial" ? "border-amber-500" : "border-red-500";
                                    const badgeClass = box.status === "correct" ? "bg-emerald-600" : box.status === "partial" ? "bg-amber-500" : "bg-red-600";
                                    return (
                                      <button key={box.id} onClick={() => setSelectedRegionId(box.id)} className={`w-full rounded-lg border-2 bg-white p-2.5 text-left ${selectedRegionId === box.id ? colorClass : "border-slate-300"}`}>
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs font-bold text-slate-900">{box.label}</span>
                                          <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase text-white ${badgeClass}`}>{box.status}</span>
                                        </div>
                                        <div className="mt-2 text-sm font-bold text-slate-800">{box.awarded} / {box.max_marks}</div>
                                        <p className="mt-1 line-clamp-2 text-[10px] text-slate-500">{box.text}</p>
                                      </button>
                                    );
                                  })}
                                </div>
                              ));
                            })()}
                            {!(evaluationDetail.answer_regions[selectedPageNumber - 1]?.boxes || []).length && <p className="rounded border border-dashed border-slate-300 bg-white p-3 text-[11px] text-slate-500">No answer regions detected on this page.</p>}
                          </div>
                          {(() => {
                            const pageIndex = selectedPageNumber - 1;
                            const page = evaluationDetail.answer_regions?.[pageIndex];
                            const box = page?.boxes.find((entry) => entry.id === selectedRegionId);
                            if (!page || !box) return null;
                            return (
                              <div className="mt-4 space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3">
                                <h5 className="text-[11px] font-bold text-indigo-950">Adjust selected box</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  {(["x", "y", "width", "height"] as const).map((coordinate) => (
                                    <label key={coordinate} className="text-[10px] font-medium uppercase text-slate-600">{coordinate} %
                                      <input type="number" min="0" max="100" step="1" value={Math.round(box[coordinate] * 100)} onChange={(event) => updateAnswerRegion(pageIndex, box.id, { [coordinate]: Math.max(0, Math.min(100, Number(event.target.value))) / 100 })} className="mt-1 block w-full rounded border border-slate-300 bg-white p-1.5 text-xs" />
                                    </label>
                                  ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="text-[10px] font-medium text-slate-600">Awarded
                                    <input type="number" min="0" max={box.max_marks} step="0.25" value={box.awarded} onChange={(event) => updateAnswerRegion(pageIndex, box.id, { awarded: Math.max(0, Math.min(box.max_marks, Number(event.target.value))) })} className="mt-1 block w-full rounded border border-slate-300 bg-white p-1.5 text-xs" />
                                  </label>
                                  <label className="text-[10px] font-medium text-slate-600">Maximum
                                    <input type="number" min="0" step="0.25" value={box.max_marks} onChange={(event) => updateAnswerRegion(pageIndex, box.id, { max_marks: Math.max(0, Number(event.target.value)), awarded: Math.min(box.awarded, Math.max(0, Number(event.target.value))) })} className="mt-1 block w-full rounded border border-slate-300 bg-white p-1.5 text-xs" />
                                  </label>
                                </div>
                              </div>
                            );
                          })()}
                        </aside>

                        <div className="min-w-0 bg-slate-200/70 p-3 sm:p-5">
                          {(() => {
                            const page = evaluationDetail.answer_regions?.[selectedPageNumber - 1];
                            if (!page) return null;
                            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                            return (
                              <div className="relative mx-auto w-full max-w-5xl overflow-hidden bg-white shadow-md">
                                <img src={`${baseUrl}${page.image_url}`} alt={`Student answer sheet page ${page.page_number}`} className="block h-auto w-full" />
                                {page.boxes.map((box) => {
                                  const tone = box.status === "correct" ? "border-emerald-500 bg-emerald-500/5 text-emerald-700" : box.status === "partial" ? "border-amber-500 bg-amber-400/5 text-amber-700" : "border-red-500 bg-red-500/5 text-red-700";
                                  const tag = box.status === "correct" ? "bg-emerald-600" : box.status === "partial" ? "bg-amber-500" : "bg-red-600";
                                  return (
                                    <button key={box.id} onClick={() => setSelectedRegionId(box.id)} style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` }} className={`absolute border-2 ${tone} ${selectedRegionId === box.id ? "z-20 ring-2 ring-white/80" : "z-10"}`}>
                                      <span className={`absolute -top-5 right-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold text-white shadow ${tag}`}>{box.awarded} / {box.max_marks}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 text-center text-xs text-amber-800">No answer regions were detected. Check OCR or review the uploaded page before grading.</div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
                      <div className="text-xs text-slate-600">{savingRegions ? "Saving corrections…" : "Select a box to review its marks and adjust its position on the page."}</div>
                    </div>
                    {regionMessage && <p role="status" className="border-t border-slate-100 px-4 py-2 text-xs text-slate-600">{regionMessage}</p>}
                  </section>

                </div>
              ) : null}
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

    </div>
  );
}
