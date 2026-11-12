from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.entities import Student, LearningProgress, Submission, Evaluation, RiskPrediction, Intervention, ActivitySnapshot, RemediationLog
from app.schemas.common import APIResponse
from app.schemas.entities import StudentCreate, StudentUpdate, StudentOut
from app.engines.ps3_dropout_engine import DropoutPredictionEngine

router = APIRouter(prefix="/api/students", tags=["Shared Student Core"])

@router.get("", response_model=APIResponse[List[dict]])
def list_students(
    department: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Student)
    if department:
        query = query.filter(Student.department == department)
    if status:
        query = query.filter(Student.status == status)
    if search:
        query = query.filter((Student.name.ilike(f"%{search}%")) | (Student.student_id.ilike(f"%{search}%")))

    students = query.order_by(Student.student_id).all()
    
    # Enrich with latest risk level and learning progress count for seamless dashboard consumption
    result = []
    for s in students:
        risk = db.query(RiskPrediction).filter(RiskPrediction.student_id == s.student_id).first()
        result.append({
            "student_id": s.student_id,
            "name": s.name,
            "email": s.email,
            "department": s.department,
            "semester": s.semester,
            "cgpa": s.cgpa,
            "attendance_pct": s.attendance_pct,
            "status": s.status,
            "risk_level": risk.risk_level if risk else "unknown",
            "risk_score": risk.risk_score if risk else 0.0
        })

    return APIResponse(
        success=True,
        module="system",
        student_id=None,
        data=result,
        message=f"Retrieved {len(result)} students"
    )

@router.get("/{student_id}", response_model=APIResponse[dict])
def get_student_360_profile(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    # PS1 Data: Learning Progress & Mastery
    progresses = db.query(LearningProgress).filter(LearningProgress.student_id == student_id).all()
    avg_mastery = round(sum(p.mastery_score for p in progresses) / len(progresses), 1) if progresses else 0.0

    # PS2 Data: Submissions & Evaluations
    submissions = db.query(Submission).filter(Submission.student_id == student_id).all()
    evaluations = db.query(Evaluation).filter(Evaluation.student_id == student_id).all()

    # PS3 Data: Risk Prediction & Interventions
    risk = db.query(RiskPrediction).filter(RiskPrediction.student_id == student_id).first()
    interventions = db.query(Intervention).filter(Intervention.student_id == student_id).all()
    snapshot = db.query(ActivitySnapshot).filter(ActivitySnapshot.student_id == student_id).first()
    remediations = db.query(RemediationLog).filter(RemediationLog.student_id == student_id).order_by(RemediationLog.created_at.desc()).all()

    shap_features = {
        "attendance_rate": student.attendance_pct,
        "average_grade": student.cgpa * 10.0,
        "late_assignments": snapshot.assignment_delays if snapshot else 0,
        "missing_assignments": 2 if student.status == "at_risk" else 0,
        "lms_logins_30d": snapshot.lms_logins if snapshot else 18,
        "engagement_change_pct": -15.0 if student.status == "at_risk" else 4.0,
        "previous_failure_count": 1 if student.cgpa < 5.5 else 0
    }
    try:
        shap_res = DropoutPredictionEngine.compute_shap_explanation(shap_features, student.student_id)
    except Exception:
        shap_res = None

    profile = {
        "core": {
            "student_id": student.student_id,
            "name": student.name,
            "email": student.email,
            "department": student.department,
            "semester": student.semester,
            "cgpa": student.cgpa,
            "attendance_pct": student.attendance_pct,
            "status": student.status,
            "avatar_url": student.avatar_url,
            "phone": student.phone
        },
        "ps1_adaptive_learning": {
            "average_mastery": avg_mastery,
            "topics_tracked": len(progresses),
            "progress_list": [
                {
                    "topic_id": p.topic_id,
                    "topic_name": p.topic_name,
                    "mastery_score": p.mastery_score,
                    "status": p.status,
                    "weak_concepts": p.weak_concepts,
                    "quiz_attempts_count": p.quiz_attempts_count,
                    "questions_attempted": getattr(p, "questions_attempted", 0) or 0,
                    "correct_answers": getattr(p, "correct_answers", 0) or 0
                } for p in progresses
            ],
            "remediation_history": [
                {
                    "log_id": r.log_id,
                    "topic_id": r.topic_id,
                    "weak_concept": r.weak_concept,
                    "completed": r.completed,
                    "created_at": r.created_at
                } for r in remediations
            ]
        },
        "ps2_evaluations": {
            "total_submissions": len(submissions),
            "evaluations": [
                {
                    "evaluation_id": e.evaluation_id,
                    "submission_id": e.submission_id,
                    "total_score": e.total_score,
                    "max_score": e.max_score,
                    "percentage": e.percentage,
                    "original_ai_score": getattr(e, "original_ai_score", e.total_score),
                    "rubric_breakdown": e.rubric_breakdown,
                    "ai_feedback": e.ai_feedback,
                    "is_moderated": e.is_moderated,
                    "moderator_override_score": e.moderator_override_score,
                    "moderator_name": getattr(e, "moderator_name", None),
                    "audit_history": getattr(e, "audit_history", []) or []
                } for e in evaluations
            ]
        },
        "ps3_retention_risk": {
            "risk_score": risk.risk_score if risk else 0.0,
            "risk_probability": getattr(risk, "risk_probability", round((risk.risk_score if risk else 0) / 100.0, 3)),
            "risk_level": risk.risk_level if risk else "unknown",
            "confidence": risk.confidence if risk else 0.0,
            "model_version": getattr(risk, "model_version", "v1.2-rf-baseline"),
            "primary_factors": risk.primary_factors if risk else [],
            "historical_trend": risk.historical_trend if risk else [],
            "shap_explanation": shap_res,
            "interventions": [
                {
                    "intervention_id": i.intervention_id,
                    "title": i.title,
                    "type": i.intervention_type,
                    "priority": i.priority,
                    "status": i.status,
                    "counselor": i.counselor_name,
                    "scheduled_date": i.scheduled_date
                } for i in interventions
            ],
            "activity_metrics": {
                "lms_logins": snapshot.lms_logins if snapshot else 0,
                "forum_posts": snapshot.forum_posts if snapshot else 0,
                "quiz_attempts": snapshot.quiz_attempts if snapshot else 0,
                "assignment_delays": snapshot.assignment_delays if snapshot else 0
            }
        }
    }

    return APIResponse(
        success=True,
        module="system",
        student_id=student.student_id,
        data=profile,
        message=f"360-degree student profile loaded for {student.student_id}"
    )

@router.post("", response_model=APIResponse[dict])
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.student_id == payload.student_id).first()
    if existing:
        return APIResponse(
            success=False,
            module="system",
            student_id=payload.student_id,
            data=None,
            message=f"Student {payload.student_id} already exists"
        )
    student = Student(**payload.dict())
    db.add(student)

    # Initialize PS3 risk prediction baseline
    risk_score = 75.0 if payload.attendance_pct < 65 or payload.cgpa < 6.0 else (45.0 if payload.attendance_pct < 75 else 15.0)
    risk_level = "high" if risk_score > 60 else ("medium" if risk_score > 30 else "low")
    risk = RiskPrediction(
        prediction_id=f"RSK_{payload.student_id}",
        student_id=payload.student_id,
        risk_score=risk_score,
        risk_level=risk_level,
        primary_factors=[{"factor": "Baseline enrollment calibration", "impact": "0%", "severity": "normal", "category": "system"}],
        historical_trend=[{"period": "Initial", "risk": risk_score}]
    )
    db.add(risk)

    db.commit()
    db.refresh(student)

    return APIResponse(
        success=True,
        module="system",
        student_id=student.student_id,
        data={"student_id": student.student_id, "name": student.name},
        message="Student created successfully across all modules"
    )

