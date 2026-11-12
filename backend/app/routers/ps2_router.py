from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import datetime
import uuid

from app.database import get_db
from app.models.entities import Student, Course, Assessment, Submission, Evaluation
from app.schemas.common import APIResponse
from app.schemas.entities import AssessmentCreate, SubmissionCreate, ModerationOverrideRequest
from app.engines.ps2_evaluation_engine import SubjectiveEvaluationEngine
from app.auth import require_role

router = APIRouter(prefix="/api/ps2", tags=["PS2: Subjective Evaluation Engine"])

@router.get("/assessments", response_model=APIResponse[List[dict]])
def list_assessments(course_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Assessment)
    if course_id:
        query = query.filter(Assessment.course_id == course_id)
    assessments = query.order_by(Assessment.created_at.desc()).all()

    data = []
    for a in assessments:
        subs_count = db.query(Submission).filter(Submission.assessment_id == a.assessment_id).count()
        evals_count = db.query(Evaluation).join(Submission).filter(Submission.assessment_id == a.assessment_id).count()
        data.append({
            "assessment_id": a.assessment_id,
            "course_id": a.course_id,
            "title": a.title,
            "description": a.description,
            "total_marks": a.total_marks,
            "due_date": a.due_date,
            "created_by": a.created_by,
            "rubric": a.rubric,
            "questions_count": len(a.questions or []),
            "submissions_count": subs_count,
            "evaluations_count": evals_count,
            "created_at": a.created_at
        })

    return APIResponse(
        success=True,
        module="ps2",
        student_id=None,
        data=data,
        message=f"Retrieved {len(data)} assessments"
    )

@router.get("/assessments/{assessment_id}", response_model=APIResponse[dict])
def get_assessment_details(assessment_id: str, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.assessment_id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    course = db.query(Course).filter(Course.course_id == assessment.course_id).first()

    return APIResponse(
        success=True,
        module="ps2",
        student_id=None,
        data={
            "assessment_id": assessment.assessment_id,
            "course_id": assessment.course_id,
            "course_code": course.code if course else "",
            "course_title": course.title if course else "",
            "title": assessment.title,
            "description": assessment.description,
            "total_marks": assessment.total_marks,
            "due_date": assessment.due_date,
            "created_by": assessment.created_by,
            "rubric": assessment.rubric,
            "questions": assessment.questions or []
        },
        message="Assessment details loaded"
    )

@router.get("/engine-info", response_model=APIResponse[dict])
def get_grading_engine_info():
    """
    Exposes active SentenceTransformer embeddings model status and OCR capabilities.
    """
    info = SubjectiveEvaluationEngine.get_model_info()
    return APIResponse(
        success=True,
        module="ps2",
        student_id=None,
        data=info,
        message="Subjective grading and OCR engine information loaded"
    )

@router.post("/ocr/inspect", response_model=APIResponse[dict])
async def inspect_document_ocr(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Inspects and runs OCR extraction on uploaded PDF or Image submissions (.pdf, .png, .jpg),
    returning page references, extracted text, confidence, and scanned flags for faculty review.
    """
    file_bytes = await file.read()
    extract_result = SubjectiveEvaluationEngine.extract_text_from_file(file_bytes, file.filename)
    return APIResponse(
        success=extract_result["success"],
        module="ps2",
        student_id=None,
        data=extract_result,
        message=extract_result["message"]
    )

@router.post("/assessments", response_model=APIResponse[dict])
def create_assessment(
    payload: AssessmentCreate,
    current_role: str = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Rubric mathematical validation
    is_valid, validation_msg = SubjectiveEvaluationEngine.validate_rubric(payload.total_marks, payload.rubric)
    if not is_valid:
        return APIResponse(
            success=False,
            module="ps2",
            student_id=None,
            data=None,
            message=validation_msg
        )

    new_id = f"ASM_{uuid.uuid4().hex[:6].upper()}"
    assessment = Assessment(
        assessment_id=new_id,
        course_id=payload.course_id,
        title=payload.title,
        description=payload.description,
        total_marks=payload.total_marks,
        due_date=payload.due_date or (datetime.datetime.utcnow() + datetime.timedelta(days=14)),
        created_by=payload.created_by,
        rubric=payload.rubric,
        questions=payload.questions
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return APIResponse(
        success=True,
        module="ps2",
        student_id=None,
        data={"assessment_id": assessment.assessment_id, "title": assessment.title},
        message="New assessment and validated rubric created successfully"
    )

@router.get("/submissions", response_model=APIResponse[List[dict]])
def list_submissions(assessment_id: Optional[str] = None, student_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Submission)
    if assessment_id:
        query = query.filter(Submission.assessment_id == assessment_id)
    if student_id:
        query = query.filter(Submission.student_id == student_id)
    
    subs = query.order_by(Submission.submitted_at.desc()).all()
    data = []
    for s in subs:
        evaluation = db.query(Evaluation).filter(Evaluation.submission_id == s.submission_id).first()
        student = db.query(Student).filter(Student.student_id == s.student_id).first()
        assessment = db.query(Assessment).filter(Assessment.assessment_id == s.assessment_id).first()
        data.append({
            "submission_id": s.submission_id,
            "assessment_id": s.assessment_id,
            "assessment_title": assessment.title if assessment else "",
            "student_id": s.student_id,
            "student_name": student.name if student else "",
            "file_name": s.file_name,
            "file_type": s.file_type,
            "submitted_text": s.submitted_text,
            "status": s.status,
            "submitted_at": s.submitted_at,
            "evaluation": {
                "evaluation_id": evaluation.evaluation_id,
                "total_score": evaluation.total_score,
                "max_score": evaluation.max_score,
                "percentage": evaluation.percentage,
                "original_ai_score": getattr(evaluation, "original_ai_score", evaluation.total_score),
                "is_moderated": evaluation.is_moderated,
                "moderator_override_score": evaluation.moderator_override_score
            } if evaluation else None
        })

    return APIResponse(
        success=True,
        module="ps2",
        student_id=student_id,
        data=data,
        message=f"Retrieved {len(data)} submissions"
    )

@router.post("/submissions", response_model=APIResponse[dict])
def submit_answer(payload: SubmissionCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {payload.student_id} not found")

    new_sub_id = f"SUB_{uuid.uuid4().hex[:6].upper()}"
    submission = Submission(
        submission_id=new_sub_id,
        assessment_id=payload.assessment_id,
        student_id=payload.student_id,
        file_name=payload.file_name or "text_submission.txt",
        file_type=payload.file_type or "txt",
        submitted_text=payload.submitted_text,
        status="pending"
    )
    db.add(submission)
    db.commit()

    return APIResponse(
        success=True,
        module="ps2",
        student_id=payload.student_id,
        data={"submission_id": submission.submission_id, "status": "pending"},
        message="Submission recorded successfully. Ready for evaluation."
    )

@router.post("/submissions/upload-file", response_model=APIResponse[dict])
async def upload_submission_file(
    assessment_id: str = Form(...),
    student_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    content_bytes = await file.read()
    extract_result = SubjectiveEvaluationEngine.extract_text_from_file(content_bytes, file.filename)

    if not extract_result["success"] and extract_result.get("is_scanned"):
        # Explicit error reporting for scanned documents
        return APIResponse(
            success=False,
            module="ps2",
            student_id=student_id,
            data={"needs_ocr": True, "word_count": extract_result.get("word_count", 0)},
            message=extract_result["message"]
        )

    text_content = extract_result["text"]
    new_sub_id = f"SUB_{uuid.uuid4().hex[:6].upper()}"
    submission = Submission(
        submission_id=new_sub_id,
        assessment_id=assessment_id,
        student_id=student_id,
        file_name=file.filename,
        file_type="pdf" if file.filename.lower().endswith(".pdf") else "txt",
        submitted_text=text_content,
        status="pending"
    )
    db.add(submission)
    db.commit()

    return APIResponse(
        success=True,
        module="ps2",
        student_id=student_id,
        data={
            "submission_id": submission.submission_id,
            "file_name": file.filename,
            "word_count": extract_result.get("word_count", len(text_content.split())),
            "extracted_preview": text_content[:200]
        },
        message=f"Uploaded & extracted {file.filename} ({extract_result.get('word_count', 0)} words)"
    )

@router.post("/evaluate/{submission_id}", response_model=APIResponse[dict])
def trigger_formative_evaluation(submission_id: str, db: Session = Depends(get_db)):
    """
    Automated formative assessment & rubric-based semantic grading assistant.
    """
    submission = db.query(Submission).filter(Submission.submission_id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    assessment = db.query(Assessment).filter(Assessment.assessment_id == submission.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Associated assessment not found")

    max_marks = assessment.total_marks or 50.0

    # Build reference answer from assessment questions
    ref_answers = []
    for q in (assessment.questions or []):
        if isinstance(q, dict) and "reference_answer" in q:
            ref_answers.append(q["reference_answer"])
    full_reference = " ".join(ref_answers) if ref_answers else "AVL balancing and Dijkstra greedy proofs."

    # Execute Hybrid Semantic Grading
    grading_result = SubjectiveEvaluationEngine.evaluate_submission(
        submitted_text=submission.submitted_text,
        reference_answer=full_reference,
        rubric=assessment.rubric or {},
        max_marks=max_marks
    )

    evaluation = db.query(Evaluation).filter(Evaluation.submission_id == submission_id).first()
    if not evaluation:
        evaluation = Evaluation(
            evaluation_id=f"EVL_{uuid.uuid4().hex[:6].upper()}",
            submission_id=submission_id,
            student_id=submission.student_id,
            total_score=grading_result["total_score"],
            max_score=max_marks,
            percentage=grading_result["percentage"],
            rubric_breakdown=grading_result["rubric_breakdown"],
            ai_feedback=grading_result["ai_feedback"],
            original_ai_score=grading_result["total_score"],
            is_moderated=False,
            audit_history=[]
        )
        db.add(evaluation)
    else:
        evaluation.total_score = grading_result["total_score"]
        evaluation.percentage = grading_result["percentage"]
        evaluation.original_ai_score = grading_result["total_score"]
        evaluation.rubric_breakdown = grading_result["rubric_breakdown"]
        evaluation.ai_feedback = grading_result["ai_feedback"]

    submission.status = "evaluated"
    db.commit()

    return APIResponse(
        success=True,
        module="ps2",
        student_id=submission.student_id,
        data={
            "evaluation_id": evaluation.evaluation_id,
            "total_score": evaluation.total_score,
            "max_score": evaluation.max_score,
            "percentage": evaluation.percentage,
            "original_ai_score": evaluation.original_ai_score,
            "rubric_breakdown": evaluation.rubric_breakdown,
            "ai_feedback": evaluation.ai_feedback
        },
        message="Semantic subjective evaluation completed"
    )

@router.get("/evaluations/{submission_id}", response_model=APIResponse[dict])
def get_evaluation_breakdown(submission_id: str, db: Session = Depends(get_db)):
    evaluation = db.query(Evaluation).filter(Evaluation.submission_id == submission_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found for this submission")

    submission = db.query(Submission).filter(Submission.submission_id == submission_id).first()
    student = db.query(Student).filter(Student.student_id == evaluation.student_id).first()
    assessment = db.query(Assessment).filter(Assessment.assessment_id == submission.assessment_id).first() if submission else None

    return APIResponse(
        success=True,
        module="ps2",
        student_id=evaluation.student_id,
        data={
            "evaluation_id": evaluation.evaluation_id,
            "submission_id": evaluation.submission_id,
            "student_id": evaluation.student_id,
            "student_name": student.name if student else "",
            "assessment_title": assessment.title if assessment else "",
            "submitted_text": submission.submitted_text if submission else "",
            "total_score": evaluation.total_score,
            "max_score": evaluation.max_score,
            "percentage": evaluation.percentage,
            "original_ai_score": getattr(evaluation, "original_ai_score", evaluation.total_score),
            "rubric_breakdown": evaluation.rubric_breakdown,
            "ai_feedback": evaluation.ai_feedback,
            "is_moderated": evaluation.is_moderated,
            "moderator_override_score": evaluation.moderator_override_score,
            "moderator_notes": evaluation.moderator_notes,
            "moderator_name": getattr(evaluation, "moderator_name", None),
            "audit_history": getattr(evaluation, "audit_history", []) or [],
            "evaluated_at": evaluation.evaluated_at
        },
        message="Evaluation breakdown retrieved"
    )

@router.post("/evaluations/{evaluation_id}/override", response_model=APIResponse[dict])
def faculty_moderation_override(
    evaluation_id: str,
    payload: ModerationOverrideRequest,
    moderator_name: Optional[str] = "Prof. Rajesh Sengupta",
    current_role: str = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    evaluation = db.query(Evaluation).filter(Evaluation.evaluation_id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    # Enforce score boundary constraints
    if not (0.0 <= payload.moderator_override_score <= evaluation.max_score):
        return APIResponse(
            success=False,
            module="ps2",
            student_id=evaluation.student_id,
            data=None,
            message=f"Override score must be between 0 and {evaluation.max_score}"
        )

    # Preserve original AI score before override if not already saved
    if getattr(evaluation, "original_ai_score", None) is None:
        evaluation.original_ai_score = evaluation.total_score

    prev_score = evaluation.total_score
    evaluation.moderator_override_score = payload.moderator_override_score
    evaluation.moderator_notes = payload.moderator_notes
    evaluation.moderator_name = moderator_name
    evaluation.is_moderated = True
    evaluation.total_score = payload.moderator_override_score
    evaluation.percentage = round((payload.moderator_override_score / evaluation.max_score) * 100.0, 1)

    # Append to permanent audit trail
    audit_entry = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "previous_score": prev_score,
        "moderated_score": payload.moderator_override_score,
        "moderator": moderator_name,
        "notes": payload.moderator_notes
    }
    history = list(getattr(evaluation, "audit_history", []) or [])
    history.append(audit_entry)
    evaluation.audit_history = history

    submission = db.query(Submission).filter(Submission.submission_id == evaluation.submission_id).first()
    if submission:
        submission.status = "moderated"

    db.commit()

    return APIResponse(
        success=True,
        module="ps2",
        student_id=evaluation.student_id,
        data={
            "evaluation_id": evaluation.evaluation_id,
            "original_ai_score": evaluation.original_ai_score,
            "new_score": evaluation.total_score,
            "is_moderated": True,
            "moderator_name": moderator_name,
            "moderator_notes": evaluation.moderator_notes,
            "audit_trail": history
        },
        message="Faculty score override and audit history recorded"
    )
