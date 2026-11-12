import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Index
    ,UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

# ==========================================
# 1. SHARED IDENTITY & ACADEMIC CORE
# ==========================================

class Student(Base):
    """Core shared student identity referenced across PS1, PS2, and PS3."""
    __tablename__ = "students"

    student_id = Column(String(32), primary_key=True, index=True) # e.g. "STU001"
    name = Column(String(128), nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=False, index=True)
    department = Column(String(64), nullable=False, index=True)
    semester = Column(Integer, default=1)
    cgpa = Column(Float, default=0.0)
    attendance_pct = Column(Float, default=100.0)
    status = Column(String(32), default="active") # active, at_risk, graduated, on_leave
    avatar_url = Column(String(255), nullable=True)
    phone = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Cross-module relationships
    user = relationship("User", back_populates="student", uselist=False)
    learning_progresses = relationship("LearningProgress", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="student", cascade="all, delete-orphan")
    activity_snapshots = relationship("ActivitySnapshot", back_populates="student", cascade="all, delete-orphan")
    risk_predictions = relationship("RiskPrediction", back_populates="student", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="student", cascade="all, delete-orphan")
    remediation_logs = relationship("RemediationLog", back_populates="student", cascade="all, delete-orphan")


class User(Base):
    """User and role model supporting student, teacher, faculty, counselor, and admin demo roles."""
    __tablename__ = "users"

    user_id = Column(String(64), primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    full_name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, nullable=False)
    role = Column(String(32), nullable=False, index=True) # student, teacher, faculty, counselor, admin
    avatar_url = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    department = Column(String(64), nullable=True)
    student_id = Column(String(32), ForeignKey("students.student_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="user")


class Course(Base):
    """Academic course entity."""
    __tablename__ = "courses"

    course_id = Column(String(32), primary_key=True, index=True)
    code = Column(String(32), unique=True, nullable=False, index=True) # e.g. "CS201"
    title = Column(String(128), nullable=False)
    department = Column(String(64), nullable=False)
    credits = Column(Integer, default=3)
    instructor_name = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    topics = relationship("Topic", back_populates="course", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="course", cascade="all, delete-orphan")


# ==========================================
# 2. PS1 MODULE — ADAPTIVE LEARNING
# ==========================================

class Topic(Base):
    """Curriculum topics with concept relationships for knowledge graph."""
    __tablename__ = "topics"

    topic_id = Column(String(64), primary_key=True, index=True)
    course_id = Column(String(32), ForeignKey("courses.course_id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    difficulty_level = Column(String(32), default="intermediate") # beginner, intermediate, advanced
    order_index = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    prerequisites = Column(JSON, default=list) # list of prerequisite topic_ids
    concept_nodes = Column(JSON, default=list) # sample sub-concepts for knowledge graph visualization
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="topics")
    remedial_resources = relationship("RemedialResource", back_populates="topic", cascade="all, delete-orphan")


class LearningProgress(Base):
    """Student topic mastery & remediation tracking."""
    __tablename__ = "learning_progress"

    progress_id = Column(String(64), primary_key=True, index=True)
    student_id = Column(String(32), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(32), ForeignKey("courses.course_id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(64), ForeignKey("topics.topic_id", ondelete="CASCADE"), nullable=False, index=True)
    topic_name = Column(String(128), nullable=False)
    mastery_score = Column(Float, default=0.0) # 0 to 100
    status = Column(String(32), default="in_progress") # mastered (>=80), in_progress (50-79), needs_remediation (<50)
    weak_concepts = Column(JSON, default=list) # list of specific strings
    quiz_attempts_count = Column(Integer, default=0)
    questions_attempted = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    last_studied_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="learning_progresses")

    __table_args__ = (
        Index("idx_student_topic_progress", "student_id", "topic_id"),
    )


class RemedialResource(Base):
    """Targeted learning resources for weak areas."""
    __tablename__ = "remedial_resources"

    resource_id = Column(String(64), primary_key=True, index=True)
    topic_id = Column(String(64), ForeignKey("topics.topic_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    resource_type = Column(String(32), default="interactive_doc") # video, interactive_doc, practice_quiz, concept_map
    estimated_minutes = Column(Integer, default=15)
    language = Column(String(32), default="en") # en, hi, ta, te, etc.
    content_summary = Column(Text, nullable=True)
    url = Column(String(255), nullable=True)

    topic = relationship("Topic", back_populates="remedial_resources")


# ==========================================
# 3. PS2 MODULE — SUBJECTIVE EVALUATION
# ==========================================

class Assessment(Base):
    """Faculty assessment with questions, reference answers, and grading rubrics."""
    __tablename__ = "assessments"

    assessment_id = Column(String(64), primary_key=True, index=True)
    course_id = Column(String(32), ForeignKey("courses.course_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    total_marks = Column(Float, default=100.0)
    due_date = Column(DateTime, nullable=True)
    created_by = Column(String(128), nullable=True) # faculty name
    rubric = Column(JSON, default=dict) # criteria: name, weight, max_points, descriptors
    questions = Column(JSON, default=list) # list of {question_id, prompt, max_marks, reference_answer}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="assessments")
    submissions = relationship("Submission", back_populates="assessment", cascade="all, delete-orphan")


class Submission(Base):
    """Student submission of subjective assessment."""
    __tablename__ = "submissions"

    submission_id = Column(String(64), primary_key=True, index=True)
    assessment_id = Column(String(64), ForeignKey("assessments.assessment_id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(32), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(32), default="txt") # pdf, txt, inline
    submitted_text = Column(Text, nullable=False)
    status = Column(String(32), default="pending") # pending, evaluated, moderated
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="submissions")
    assessment = relationship("Assessment", back_populates="submissions")
    evaluation = relationship("Evaluation", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    pages = relationship("SubmissionPage", back_populates="submission", cascade="all, delete-orphan", order_by="SubmissionPage.page_number")


class SubmissionPage(Base):
    """Page-level source OCR and teacher-confirmed text for an answer submission."""
    __tablename__ = "submission_pages"
    __table_args__ = (UniqueConstraint("submission_id", "page_number", name="uq_submission_page_number"),)

    page_id = Column(String(64), primary_key=True, index=True)
    submission_id = Column(String(64), ForeignKey("submissions.submission_id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    original_image_path = Column(String(512), nullable=True)
    extraction_method = Column(String(64), nullable=False, default="unknown")
    raw_ocr_text = Column(Text, nullable=False, default="")
    corrected_text = Column(Text, nullable=False, default="")
    confidence = Column(Float, nullable=True)
    warnings = Column(JSON, default=list)
    review_status = Column(String(32), nullable=False, default="needs_review")
    reviewed_by = Column(String(128), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    submission = relationship("Submission", back_populates="pages")


class Evaluation(Base):
    """Evaluation result with AI subjective grading breakdown and faculty moderation override."""
    __tablename__ = "evaluations"

    evaluation_id = Column(String(64), primary_key=True, index=True)
    submission_id = Column(String(64), ForeignKey("submissions.submission_id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    student_id = Column(String(32), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False, index=True)
    total_score = Column(Float, default=0.0)
    max_score = Column(Float, default=100.0)
    percentage = Column(Float, default=0.0)
    rubric_breakdown = Column(JSON, default=dict) # scores per criteria
    ai_feedback = Column(JSON, default=dict) # {strengths: [], weaknesses: [], suggestions: []}
    original_ai_score = Column(Float, nullable=True) # Preserved before any moderation override
    moderator_override_score = Column(Float, nullable=True)
    moderator_notes = Column(Text, nullable=True)
    moderator_name = Column(String(128), nullable=True)
    audit_history = Column(JSON, default=list) # [{timestamp, previous_score, new_score, moderator, notes}]
    is_moderated = Column(Boolean, default=False)
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="evaluations")
    submission = relationship("Submission", back_populates="evaluation")


# ==========================================
# 4. PS3 MODULE — DROPOUT PREDICTION
# ==========================================

class RiskPrediction(Base):
    """ML-ready student retention risk profile with explainability drivers."""
    __tablename__ = "risk_predictions"

    prediction_id = Column(String(64), primary_key=True, index=True)
    student_id = Column(String(32), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False, index=True)
    risk_score = Column(Float, nullable=False) # 0 to 100
    risk_probability = Column(Float, default=0.0) # 0.0 to 1.0
    risk_level = Column(String(32), nullable=False, index=True) # low, medium, high
    confidence = Column(Float, default=0.88)
    model_version = Column(String(64), default="v1.2-rf-baseline")
    primary_factors = Column(JSON, default=list) # [{factor: "Low LMS Login", impact: "+24%", severity: "high"}]
    historical_trend = Column(JSON, default=list) # [{period: "W1", risk: 20}, {period: "W2", risk: 45}]
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="risk_predictions")


class ActivitySnapshot(Base):
    """Behavioral and academic time-series activity snapshot."""
    __tablename__ = "activity_snapshots"

    snapshot_id = Column(String(64), primary_key=True, index=True)
    student_id = Column(String(32), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    lms_logins = Column(Integer, default=0)
    forum_posts = Column(Integer, default=0)
    quiz_attempts = Column(Integer, default=0)
    assignment_delays = Column(Integer, default=0) # days delayed
    attendance_rate = Column(Float, default=100.0)

    student = relationship("Student", back_populates="activity_snapshots")


class RemediationLog(Base):
    """Tracks student remedial interventions and review completions."""
    __tablename__ = "remediation_logs"

    log_id = Column(String(64), primary_key=True, index=True)
    student_id = Column(String(32), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(64), ForeignKey("topics.topic_id", ondelete="CASCADE"), nullable=False, index=True)
    weak_concept = Column(String(128), nullable=False)
    resource_id = Column(String(64), nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="remediation_logs")


class Intervention(Base):
    """Counselor retention action task list."""
    __tablename__ = "interventions"

    intervention_id = Column(String(64), primary_key=True, index=True)
    student_id = Column(String(32), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False, index=True)
    counselor_name = Column(String(128), nullable=False)
    title = Column(String(255), nullable=False)
    intervention_type = Column(String(64), default="academic_tutoring") # academic_tutoring, financial_aid, mental_health, attendance_warning
    status = Column(String(32), default="planned") # planned, in_progress, completed, cancelled
    priority = Column(String(32), default="medium") # low, medium, high, urgent
    notes = Column(Text, nullable=True)
    scheduled_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="interventions")

