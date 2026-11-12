import { APIResponse } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      throw new Error(errorBody?.message || `API error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error(`Fetch failed on ${endpoint}:`, error);
    return {
      success: false,
      module: "system",
      student_id: null,
      data: null as any,
      message: error.message || "Failed to reach EDUCORE AI backend",
    };
  }
}

export const api = {
  // System & Health
  getHealth: () => fetchAPI<any>("/api/health"),
  getCurrentUser: () => fetchAPI<any>("/api/users/current"),
  getRoles: () => fetchAPI<any[]>("/api/users/roles"),
  switchRole: (role: string, studentId?: string) =>
    fetchAPI<any>("/api/users/switch-role", {
      method: "POST",
      body: JSON.stringify({ role, student_id: studentId || "STU001" }),
    }),

  // Shared Students Core
  getStudents: (params?: { department?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.department) q.append("department", params.department);
    if (params?.status) q.append("status", params.status);
    if (params?.search) q.append("search", params.search);
    return fetchAPI<any[]>(`/api/students?${q.toString()}`);
  },
  getStudent360: (studentId: string) => fetchAPI<any>(`/api/students/${studentId}`),
  createStudent: (payload: any) =>
    fetchAPI<any>("/api/students", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // PS1 Adaptive Learning
  getTopics: (courseId?: string) =>
    fetchAPI<any[]>(`/api/ps1/topics${courseId ? `?course_id=${courseId}` : ""}`),
  getStudentProgress: (studentId: string) =>
    fetchAPI<any>(`/api/ps1/progress/${studentId}`),
  getTopicQuiz: (topicId: string) =>
    fetchAPI<any>(`/api/ps1/quiz/${topicId}`),
  submitQuiz: (payload: {
    student_id: string;
    topic_id: string;
    course_id: string;
    answers: Record<string, number>;
  }) =>
    fetchAPI<any>("/api/ps1/quiz/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getClassroomOverview: () => fetchAPI<any>("/api/ps1/classroom-overview"),

  // PS2 Subjective Grading
  getAssessments: (courseId?: string) =>
    fetchAPI<any[]>(`/api/ps2/assessments${courseId ? `?course_id=${courseId}` : ""}`),
  getAssessmentDetails: (assessmentId: string) =>
    fetchAPI<any>(`/api/ps2/assessments/${assessmentId}`),
  createAssessment: (payload: any) =>
    fetchAPI<any>("/api/ps2/assessments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getSubmissions: (params?: { assessment_id?: string; student_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.assessment_id) q.append("assessment_id", params.assessment_id);
    if (params?.student_id) q.append("student_id", params.student_id);
    return fetchAPI<any[]>(`/api/ps2/submissions?${q.toString()}`);
  },
  createSubmission: (payload: {
    assessment_id: string;
    student_id: string;
    submitted_text: string;
    file_name?: string;
    file_type?: string;
  }) =>
    fetchAPI<any>("/api/ps2/submissions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  triggerEvaluation: (submissionId: string) =>
    fetchAPI<any>(`/api/ps2/evaluate/${submissionId}`, { method: "POST" }),
  getEvaluationBreakdown: (submissionId: string) =>
    fetchAPI<any>(`/api/ps2/evaluations/${submissionId}`),
  overrideEvaluation: (
    evaluationId: string,
    payload: { moderator_override_score: number; moderator_notes: string }
  ) =>
    fetchAPI<any>(`/api/ps2/evaluations/${evaluationId}/override`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // PS3 Dropout Prediction
  getRiskOverview: () => fetchAPI<any>("/api/ps3/risk-overview"),
  getRiskStudents: (params?: { risk_level?: string; sort_by?: string }) => {
    const q = new URLSearchParams();
    if (params?.risk_level) q.append("risk_level", params.risk_level);
    if (params?.sort_by) q.append("sort_by", params.sort_by);
    return fetchAPI<any[]>(`/api/ps3/students?${q.toString()}`);
  },
  getExplainability: (studentId: string) =>
    fetchAPI<any>(`/api/ps3/explainability/${studentId}`),
  getInterventions: (params?: { student_id?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.student_id) q.append("student_id", params.student_id);
    if (params?.status) q.append("status", params.status);
    return fetchAPI<any[]>(`/api/ps3/interventions?${q.toString()}`);
  },
  createIntervention: (payload: any) =>
    fetchAPI<any>("/api/ps3/interventions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateIntervention: (interventionId: string, payload: { status?: string; notes?: string }) =>
    fetchAPI<any>(`/api/ps3/interventions/${interventionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getModelMetrics: () => fetchAPI<any>("/api/ps3/metrics"),
  retrainModel: () => fetchAPI<any>("/api/ps3/retrain", { method: "POST" }),

  // Phase 3 Advanced Endpoints
  getStudentShap: (studentId: string) => fetchAPI<any>(`/api/ps3/shap/${studentId}`),
  getLongitudinalTrend: (studentId: string) => fetchAPI<any>(`/api/ps3/longitudinal/${studentId}`),
  getRiskHeatmap: () => fetchAPI<any>("/api/ps3/analytics/heatmap"),
  getGradingEngineInfo: () => fetchAPI<any>("/api/ps2/engine-info"),
  getRAGRemediation: (topicId: string, weakConcept: string) =>
    fetchAPI<any>(`/api/ps1/curriculum/remedial-rag?topic_id=${topicId}&weak_concept=${encodeURIComponent(weakConcept)}`),
};

