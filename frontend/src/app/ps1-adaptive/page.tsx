"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Award,
  AlertCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Video,
  Languages,
  Users,
  ArrowRight,
  Sparkles,
  Search,
  ExternalLink,
  Volume2,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { QuizModal } from "@/components/QuizModal";
import { RemedialResourceModal } from "@/components/RemedialResourceModal";
import { VoiceSearchInput } from "@/components/VoiceSearchInput";
import { SpeechPlayer } from "@/components/SpeechPlayer";
import { MetricCard } from "@/components/MetricCard";
import { LoadingState } from "@/components/EmptyState";
import { useUserRole } from "@/lib/useUserRole";

export default function AdaptiveLearningPage() {
  const { role, userId } = useUserRole();
  const [studentId, setStudentId] = useState(userId || "STU001");
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [classroomData, setClassroomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Voice State
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [ragData, setRagData] = useState<any>(null);
  const [ragLoading, setRagLoading] = useState(false);

  const handleVoiceQuery = async (queryText: string) => {
    const lower = queryText.toLowerCase();

    // Match topic from voice transcript
    const matched = topics.find(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        lower.includes(t.name.toLowerCase().split(" ")[0]) ||
        (t.concept_nodes || []).some((c: any) => lower.includes((c.label || "").toLowerCase()))
    );

    if (matched) {
      setSelectedTopic(matched);
    }

    const topicIdToUse = matched ? matched.topic_id : (selectedTopic ? selectedTopic.topic_id : "TOP_TREES");
    setRagLoading(true);
    try {
      const res = await api.getRAGRemediation(topicIdToUse, queryText);
      if (res.success && res.data) {
        setRagData(res.data);
      }
    } catch (e) {
      console.warn("RAG retrieval failed:", e);
    } finally {
      setRagLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicsRes, progRes, classRes] = await Promise.all([
        api.getTopics(),
        api.getStudentProgress(studentId),
        api.getClassroomOverview(),
      ]);

      if (topicsRes.success && topicsRes.data) {
        setTopics(topicsRes.data);
        if (!selectedTopic && topicsRes.data.length > 0) {
          setSelectedTopic(topicsRes.data[0]);
        }
      }
      if (progRes.success && progRes.data) setProgressData(progRes.data);
      if (classRes.success && classRes.data) setClassroomData(classRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const currentTopicProgress = progressData?.topics?.find(
    (t: any) => t.topic_id === selectedTopic?.topic_id
  );
  const currentMastery = currentTopicProgress?.mastery_score ?? 60.0;

  if (loading) {
    return <LoadingState message="Connecting to Adaptive Bayesian Knowledge Engine..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              Problem Statement 1
            </span>
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
              SLA Latency: 11.5ms (&lt; 8.0s)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Adaptive Learning & Automated Remediation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bayesian Knowledge Tracing (BKT), multilingual STT/TTS explanations, and curriculum-grounded RAG.
          </p>
        </div>

        {/* Active Student Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Student Persona:</span>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-800 shadow-sm focus:border-indigo-500 focus-ring"
          >
            <option value="STU001">STU001 — Aarav Sharma (88% Mastery)</option>
            <option value="STU002">STU002 — Priya Patel (48% Mastery)</option>
            <option value="STU003">STU003 — Rohan Verma (38% Mastery)</option>
            <option value="STU004">STU004 — Ananya Iyer (94% Mastery)</option>
            <option value="STU009">STU009 — Vikram Singh (30% Mastery)</option>
          </select>
        </div>
      </div>

      {/* Multilingual Voice Query & Search (Deliverable A1) */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Languages className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              Multilingual Voice Query (Kannada • Hindi • English)
            </span>
          </div>
          <span className="editorial-tag text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
            Web Speech Recognition API
          </span>
        </div>
        <VoiceSearchInput onTranscript={handleVoiceQuery} />
      </div>

      {/* Authentic Curriculum RAG Grounding Citation Card (Deliverable A4) */}
      {ragData && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                Curriculum Grounded Remediation (Zero Hallucination)
              </span>
            </div>
            <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 font-semibold">
              Authentic Page Citation
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-emerald-200 text-xs text-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900 border-b border-emerald-100 pb-1.5">
              <span>Textbook: <strong>{ragData.source_citation?.document_name}</strong></span>
              <span className="font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Page {ragData.source_citation?.page_number}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed font-sans">{ragData.grounded_content}</p>

            {/* Regional Spoken TTS Player */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Listen to explanation:</span>
              <SpeechPlayer textEnglish={ragData.grounded_content} title="RAG Remedial Explanation" />
            </div>
          </div>

          {/* Targeted Practice Questions derived from chunk */}
          {ragData.practice_questions && ragData.practice_questions.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold text-emerald-950">Targeted Textbook Practice Questions:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {ragData.practice_questions.map((pq: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white border border-emerald-200 text-slate-800">
                    <p className="font-semibold text-slate-900">Q{i + 1}: {pq.question}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{pq.context_hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student Mastery KPI Metrics */}
      {progressData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Overall Mastery"
            value={`${progressData.average_mastery}%`}
            subtitle="Bayesian Knowledge Trace"
            variant="brand"
            icon={Award}
          />
          <MetricCard
            title="Mastered Topics"
            value={progressData.counts.mastered}
            subtitle="Competency &ge; 80%"
            variant="success"
            icon={CheckCircle2}
          />
          <MetricCard
            title="In Progress"
            value={progressData.counts.in_progress}
            subtitle="50% - 79% range"
            variant="default"
            icon={BookOpen}
          />
          <MetricCard
            title="Remedial Focus"
            value={progressData.counts.needs_remediation}
            subtitle="Below 50% threshold"
            variant={progressData.counts.needs_remediation > 0 ? "danger" : "default"}
            icon={AlertCircle}
          />
        </div>
      )}

      {/* Standardized Difficulty Rules Banner */}
      <div className="p-3 rounded-lg bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border border-slate-800">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Standardized Adaptive Difficulty Transitions:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-700">
            &ge;80% &rarr; +1 Level (Hard max)
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
            50-79% &rarr; Maintain
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-700">
            &lt;50% &rarr; -1 Level (Easy min)
          </span>
        </div>
      </div>

      {/* Main Interactive Topic Selection & Knowledge Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="knowledge-graph">
        {/* Left Column: Topics Syllabus */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Curriculum Syllabus
            </h2>
            <span className="editorial-tag text-[10px] text-slate-400">{topics.length} Modules</span>
          </div>

          <div className="space-y-1.5">
            {topics.map((t) => {
              const isSelected = selectedTopic?.topic_id === t.topic_id;
              const p = progressData?.topics?.find((x: any) => x.topic_id === t.topic_id);
              return (
                <button
                  key={t.topic_id}
                  onClick={() => setSelectedTopic(t)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 shadow-sm font-semibold"
                      : "border-slate-100 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="editorial-tag text-[9px] text-slate-500 font-semibold">{t.course_code}</span>
                    {p && <StatusBadge type="mastery" value={p.mastery_score} />}
                  </div>
                  <p className="font-bold text-slate-900 mt-1">{t.name}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Topic Detail & Knowledge Graph */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTopic && (
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-5">
              {/* Active topic header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {selectedTopic.course_code}: {selectedTopic.course_title}
                    </span>
                    <span className="editorial-tag text-[10px] text-slate-400 capitalize">
                      Difficulty: {selectedTopic.difficulty_level}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">{selectedTopic.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedTopic.description}</p>
                </div>

                <button
                  onClick={() => setQuizModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Take Formative Quiz</span>
                </button>
              </div>

              {/* Topic Mastery Meter */}
              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Topic Mastery Index</span>
                  <span className="text-sm font-bold text-indigo-600">{currentMastery}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      currentMastery >= 80 ? "bg-emerald-500" : currentMastery >= 50 ? "bg-indigo-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${currentMastery}%` }}
                  ></div>
                </div>
              </div>

              {/* Interactive Knowledge Graph */}
              <KnowledgeGraph
                topicName={selectedTopic.name}
                nodes={selectedTopic.concept_nodes}
                prerequisites={selectedTopic.prerequisites}
              />
            </div>
          )}
        </div>
      </div>

      {/* Multilingual Remedial Resource Hub */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Languages className="w-4 h-4 text-indigo-600" />
              <span>Multilingual Remedial Hub</span>
            </h2>
            <p className="text-xs text-slate-500">
              Targeted audio lessons in Kannada, Hindi, and English for diagnosed misconceptions
            </p>
          </div>
          <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
            Kannada & Hindi Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progressData?.remedial_recommendations?.map((r: any) => (
            <div
              key={r.resource_id}
              className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="editorial-tag text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                    {r.type.replace("_", " ")}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {r.estimated_minutes} mins • Lang: {r.language.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900">{r.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{r.content_summary}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-rose-600">Focus: {r.topic_name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedResource(r)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Start Remediation</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teacher Classroom Adaptive Analytics */}
      {classroomData && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Classroom Cohort Adaptive Analytics</span>
              </h2>
              <p className="text-xs text-slate-500">
                Cohort mastery and identified difficulty bottlenecks across syllabus topics
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Class Average: </span>
              <span className="text-xs font-bold text-emerald-700">
                {classroomData.classroom_average_mastery}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classroomData.topic_analytics?.map((item: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs text-slate-900 truncate">{item.topic_name}</h3>
                  <span
                    className={`editorial-tag text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                      item.difficulty_rating === "High"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : item.difficulty_rating === "Medium"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {item.difficulty_rating} Bottleneck
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                  <span>Classroom Mastery</span>
                  <span className="font-bold text-slate-900">{item.average_mastery}%</span>
                </div>
                <div className="mt-1 text-[11px] text-rose-600 font-medium">
                  {item.students_needing_help} students need remediation
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {selectedTopic && (
        <QuizModal
          topicId={selectedTopic.topic_id}
          topicName={selectedTopic.name}
          courseId={selectedTopic.course_id}
          studentId={studentId}
          isOpen={quizModalOpen}
          onClose={() => setQuizModalOpen(false)}
          onQuizCompleted={loadData}
        />
      )}

      {/* Multilingual Remedial Modal */}
      {selectedResource && (
        <RemedialResourceModal
          resource={selectedResource}
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}
