export interface APIResponse<T> {
  success: boolean;
  module: "system" | "ps1" | "ps2" | "ps3";
  student_id: string | null;
  data: T;
  message: string;
}

export interface StudentSummary {
  student_id: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  cgpa: number;
  attendance_pct: number;
  status: "active" | "at_risk" | "graduated" | "on_leave";
  risk_level?: "low" | "medium" | "high" | "unknown";
  risk_score?: number;
}

export interface Student360Profile {
  core: {
    student_id: string;
    name: string;
    email: string;
    department: string;
    semester: number;
    cgpa: number;
    attendance_pct: number;
    status: string;
    avatar_url?: string;
    phone?: string;
  };
  ps1_adaptive_learning: {
    average_mastery: number;
    topics_tracked: number;
    progress_list: Array<{
      topic_id: string;
      topic_name: string;
      mastery_score: number;
      status: string;
      weak_concepts: string[];
      quiz_attempts_count: number;
    }>;
  };
  ps2_evaluations: {
    total_submissions: number;
    evaluations: Array<{
      evaluation_id: string;
      submission_id: string;
      total_score: number;
      max_score: number;
      percentage: number;
      rubric_breakdown: Record<string, { score: number; max: number; comment?: string }>;
      ai_feedback: {
        strengths: string[];
        weaknesses: string[];
        suggestions: string[];
      };
      is_moderated: boolean;
      moderator_override_score?: number;
    }>;
  };
  ps3_retention_risk: {
    risk_score: number;
    risk_level: "low" | "medium" | "high";
    confidence: number;
    primary_factors: Array<{
      factor: string;
      impact: string;
      severity: string;
      category: string;
    }>;
    historical_trend: Array<{
      period: string;
      risk: number;
    }>;
    interventions: Array<{
      intervention_id: string;
      title: string;
      type: string;
      priority: string;
      status: string;
      counselor: string;
      scheduled_date?: string;
    }>;
    activity_metrics: {
      lms_logins: number;
      forum_posts: number;
      quiz_attempts: number;
      assignment_delays: number;
    };
  };
}

export interface DemoUser {
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  role: "student" | "teacher" | "faculty" | "counselor" | "admin";
  active_student_id?: string | null;
}

export interface DemoRoleOption {
  role: string;
  label: string;
  description: string;
}

export interface PS1Topic {
  topic_id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  name: string;
  difficulty_level: string;
  order_index: number;
  description: string;
  prerequisites: string[];
  concept_nodes: Array<{ id: string; label: string; type: string; status: string }>;
}

export interface PS1QuizQuestion {
  question_id: string;
  prompt: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

export interface PS2Assessment {
  assessment_id: string;
  course_id: string;
  title: string;
  description: string;
  total_marks: number;
  due_date: string;
  created_by: string;
  rubric: {
    criteria: Array<{
      name: string;
      max_points: number;
      description: string;
    }>;
  };
  questions_count: number;
  submissions_count: number;
  evaluations_count: number;
  created_at: string;
}

export interface PS2SubmissionItem {
  submission_id: string;
  assessment_id: string;
  assessment_title: string;
  student_id: string;
  student_name: string;
  file_name: string;
  file_type: string;
  submitted_text: string;
  status: "pending" | "evaluated" | "moderated";
  submitted_at: string;
  evaluation?: {
    evaluation_id: string;
    total_score: number;
    max_score: number;
    percentage: number;
    is_moderated: boolean;
    moderator_override_score?: number;
  } | null;
}

export interface PS3RiskOverview {
  total_monitored_students: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  average_retention_risk_score: number;
  active_counselor_interventions: number;
  distribution_percentage: {
    high: number;
    medium: number;
    low: number;
  };
  top_institution_risk_drivers: Array<{
    factor: string;
    affected_students: number;
  }>;
}

export interface PS3InterventionItem {
  intervention_id: string;
  student_id: string;
  student_name: string;
  department: string;
  counselor_name: string;
  title: string;
  intervention_type: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  notes?: string;
  scheduled_date?: string;
  created_at: string;
}

export interface StructuredAIFeedback {
  correct_concepts?: string[];
  missing_concepts?: string[];
  incorrect_concepts?: string[];
  suggestions?: string[];
}

export type AIFeedbackPayload = string | StructuredAIFeedback | null | undefined;

export interface RubricCriterionResult {
  score?: number;
  awarded_points?: number;
  max?: number;
  max_points?: number;
  similarity?: number;
  semantic_similarity?: number;
  evidence?: string;
  missing_concepts?: string[];
  incorrect_concepts?: string[];
  reason?: string;
}

export interface PS2EvaluationDetail {
  evaluation_id: string;
  submission_id: string;
  student_id: string;
  student_name?: string;
  assessment_title?: string;
  submitted_text?: string;
  total_score: number;
  max_score: number;
  max_marks?: number;
  percentage: number;
  original_ai_score?: number;
  rubric_breakdown?: Record<string, RubricCriterionResult>;
  ai_feedback?: AIFeedbackPayload;
  semantic_similarity?: number;
  is_moderated?: boolean;
  moderator_override_score?: number | null;
  moderator_notes?: string | null;
  moderator_name?: string | null;
  audit_trail?: any[];
  audit_history?: Array<{
    timestamp: string;
    previous_score?: number;
    original_score?: number;
    moderated_score?: number;
    new_score?: number;
    moderator?: string;
    moderated_by?: string;
    notes?: string;
    moderator_notes?: string;
  }>;
  evaluated_at?: string;
}

