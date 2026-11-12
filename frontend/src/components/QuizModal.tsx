"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, HelpCircle, ArrowRight, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { PS1QuizQuestion } from "@/lib/types";

interface QuizModalProps {
  topicId: string;
  topicName: string;
  courseId: string;
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onQuizCompleted: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  topicId,
  topicName,
  courseId,
  studentId,
  isOpen,
  onClose,
  onQuizCompleted,
}) => {
  const [questions, setQuestions] = useState<PS1QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && topicId) {
      setLoading(true);
      setSubmitted(false);
      setAnswers({});
      setResult(null);
      api.getTopicQuiz(topicId).then((res) => {
        if (res.success && res.data) {
          setQuestions(res.data.questions || []);
        }
        setLoading(false);
      });
    }
  }, [isOpen, topicId]);

  if (!isOpen) return null;

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await api.submitQuiz({
      student_id: studentId,
      topic_id: topicId,
      course_id: courseId,
      answers,
    });
    if (res.success) {
      setResult(res.data);
      setSubmitted(true);
      onQuizCompleted();
    }
    setSubmitting(false);
  };

  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/30 text-indigo-100 border border-indigo-400/40">
                Formative Assessment
              </span>
              <span className="text-xs text-indigo-200">PS1 Adaptive Learning</span>
            </div>
            <h3 className="text-lg font-bold mt-1">{topicName}</h3>
            <p className="text-xs text-indigo-200">Evaluating conceptual mastery for {studentId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-sm">Generating adaptive quiz questions...</p>
            </div>
          ) : (
            <>
              {submitted && result && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm">Adaptive Quiz Results</h4>
                      <p className="text-xs text-emerald-700">
                        Answered {result.correct_answers} of {result.total_questions} questions correctly.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-700">{result.quiz_score_pct}%</span>
                      <p className="text-[11px] font-medium text-emerald-600">
                        Topic Mastery: {result.new_topic_mastery}% ({result.mastery_status})
                      </p>
                    </div>
                  </div>

                  {result.adaptive_difficulty_progression && (
                    <div className="p-3 rounded-lg bg-white/90 border border-emerald-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-950 font-bold">Difficulty Progression:</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="uppercase text-slate-500 font-mono text-[11px]">{result.adaptive_difficulty_progression.previous_difficulty}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[11px]">
                            {result.adaptive_difficulty_progression.next_recommended_difficulty}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {result.adaptive_difficulty_progression.adjustment_rule ||
                          (result.quiz_score_pct >= 80
                            ? "Accuracy >= 80%: increased difficulty by one level"
                            : result.quiz_score_pct < 50
                            ? "Accuracy < 50%: decreased difficulty by one level"
                            : "Accuracy >= 50% and < 80%: maintained difficulty")}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Rule: ≥80% (+1 level, max hard) | 50%–79% (maintain) | &lt;50% (-1 level, min easy)
                      </p>
                    </div>
                  )}

                  {result.diagnosed_weak_concepts && result.diagnosed_weak_concepts.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900">
                      <span className="font-bold">Diagnosed Weak Concepts: </span>
                      <span>{result.diagnosed_weak_concepts.join(", ")}</span>
                    </div>
                  )}
                </div>
              )}

              {questions.map((q, idx) => {
                const selectedOption = answers[q.question_id];
                return (
                  <div key={q.question_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Question {idx + 1}
                      </p>
                      {(q as any).difficulty && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {(q as any).difficulty}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-3">{(q as any).question_text || q.prompt}</p>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = selectedOption === optIdx;
                        let optionStyle = "border-slate-200 bg-white hover:border-indigo-300 text-slate-700";
                        if (submitted) {
                          if (optIdx === q.correct_option_index) {
                            optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                          } else if (isChosen) {
                            optionStyle = "border-rose-500 bg-rose-50 text-rose-900";
                          }
                        } else if (isChosen) {
                          optionStyle = "border-indigo-600 bg-indigo-50/80 text-indigo-900 font-medium";
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={submitted}
                            onClick={() => handleSelectOption(q.question_id, optIdx)}
                            className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {submitted && optIdx === q.correct_option_index && (
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {submitted && (
                      <div className="mt-3 p-2.5 rounded bg-white border border-slate-200 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">Concept Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
          >
            {submitted ? "Done" : "Cancel"}
          </button>

          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className={`px-5 py-2 text-xs font-bold rounded-lg text-white transition flex items-center gap-1.5 ${
                allAnswered && !submitting
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30"
                  : "bg-slate-300 cursor-not-allowed text-slate-500"
              }`}
            >
              {submitting ? "Grading..." : "Submit Answers"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md shadow-indigo-600/30"
            >
              Close and Review Mastery
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

