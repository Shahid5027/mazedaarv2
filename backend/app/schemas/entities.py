from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# ==================== Student & User Schemas ====================

class StudentBase(BaseModel):
    student_id: str
    name: str
    email: str
    department: str
    semester: int = 1
    cgpa: float = 0.0
    attendance_pct: float = 100.0
    status: str = "active"
    avatar_url: Optional[str] = None
    phone: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    cgpa: Optional[float] = None
    attendance_pct: Optional[float] = None
    status: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None

class StudentOut(StudentBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    user_id: str
    username: str
    full_name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    student_id: Optional[str] = None

    class Config:
        from_attributes = True

class CourseOut(BaseModel):
    course_id: str
    code: str
    title: str
    department: str
    credits: int
    instructor_name: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

# ==================== PS1 Schemas ====================

class TopicOut(BaseModel):
    topic_id: str
    course_id: str
    name: str
    difficulty_level: str
    order_index: int
    description: Optional[str] = None
    prerequisites: List[str] = []
    concept_nodes: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

class LearningProgressOut(BaseModel):
    progress_id: str
    student_id: str
    course_id: str
    topic_id: str
    topic_name: str
    mastery_score: float
    status: str
    weak_concepts: List[str] = []
    quiz_attempts_count: int
    last_studied_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RemedialResourceOut(BaseModel):
    resource_id: str
    topic_id: str
    title: str
    resource_type: str
    estimated_minutes: int
    language: str
    content_summary: Optional[str] = None
    url: Optional[str] = None

    class Config:
        from_attributes = True

class QuizQuestion(BaseModel):
    question_id: str
    prompt: str
    options: List[str]
    correct_option_index: int
    explanation: str

class QuizSubmissionRequest(BaseModel):
    student_id: str
    topic_id: str
    course_id: str
    answers: Dict[str, int] # question_id -> chosen option index

# ==================== PS2 Schemas ====================

class AssessmentCreate(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None
    total_marks: float = 100.0
    due_date: Optional[datetime] = None
    created_by: Optional[str] = "Faculty Demo"
    rubric: Dict[str, Any]
    questions: List[Dict[str, Any]]

class AssessmentOut(BaseModel):
    assessment_id: str
    course_id: str
    title: str
    description: Optional[str] = None
    total_marks: float
    due_date: Optional[datetime] = None
    created_by: Optional[str] = None
    rubric: Dict[str, Any]
    questions: List[Dict[str, Any]]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    assessment_id: str
    student_id: str
    submitted_text: str
    file_name: Optional[str] = "submission.txt"
    file_type: Optional[str] = "txt"

class SubmissionOut(BaseModel):
    submission_id: str
    assessment_id: str
    student_id: str
    file_name: Optional[str]
    file_type: str
    submitted_text: str
    status: str
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ModerationOverrideRequest(BaseModel):
    moderator_override_score: float
    moderator_notes: str

class EvaluationOut(BaseModel):
    evaluation_id: str
    submission_id: str
    student_id: str
    total_score: float
    max_score: float
    percentage: float
    rubric_breakdown: Dict[str, Any]
    ai_feedback: Dict[str, Any]
    moderator_override_score: Optional[float] = None
    moderator_notes: Optional[str] = None
    is_moderated: bool = False
    evaluated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==================== PS3 Schemas ====================

class RiskPredictionOut(BaseModel):
    prediction_id: str
    student_id: str
    risk_score: float
    risk_level: str
    confidence: float
    primary_factors: List[Dict[str, Any]]
    historical_trend: List[Dict[str, Any]]
    generated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InterventionCreate(BaseModel):
    student_id: str
    counselor_name: str
    title: str
    intervention_type: str = "academic_tutoring"
    priority: str = "medium"
    notes: Optional[str] = None
    scheduled_date: Optional[datetime] = None

class InterventionUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    scheduled_date: Optional[datetime] = None

class InterventionOut(BaseModel):
    intervention_id: str
    student_id: str
    counselor_name: str
    title: str
    intervention_type: str
    status: str
    priority: str
    notes: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

