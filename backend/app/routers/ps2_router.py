from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import datetime
import uuid
from pathlib import Path
from fastapi.responses import FileResponse

from app.database import get_db
from app.models.entities import Student, Course, Assessment, Submission, Evaluation
from app.schemas.common import APIResponse
from app.schemas.entities import AssessmentCreate, SubmissionCreate, ModerationOverrideRequest
from app.engines.ps2_evaluation_engine import SubjectiveEvaluationEngine
from app.auth import require_role

router = APIRouter(prefix="/api/ps2", tags=["PS2: Subjective Evaluation Engine"])
UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "submissions"

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

@router.post("/assessments/{assessment_id}/reference-file", response_model=APIResponse[dict])
async def upload_reference_answer_file(
    assessment_id: str,
    file: UploadFile = File(...),
    current_role: str = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db),
):
    """Extract and save a faculty reference answer sheet for an assessment."""
    assessment = db.query(Assessment).filter(Assessment.assessment_id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    content = await file.read()
    extracted = SubjectiveEvaluationEngine.extract_text_from_file(content, file.filename or "reference.txt")
    scanned_reference_text = (extracted.get("text") or "").strip()
    if not scanned_reference_text or not extracted.get("success"):
        return APIResponse(
            success=False, module="ps2", student_id=None, data=extracted,
            message="Could not read enough text from the reference sheet. Use a clearer scan or a text based PDF.",
        )
    reference_text = SubjectiveEvaluationEngine.reference_answers_only(scanned_reference_text)

    questions = list(assessment.questions or [])
    if not questions:
        questions = [{"question_id": "Q1", "prompt": assessment.title, "max_marks": assessment.total_marks}]
    questions[0] = {**questions[0], "reference_answer": reference_text, "reference_file_name": file.filename}
    assessment.questions = questions
    db.commit()
    return APIResponse(
        success=True, module="ps2", student_id=None,
        data={"assessment_id": assessment_id, "file_name": file.filename,
              "word_count": extracted.get("word_count", len(reference_text.split())),
              "reference_preview": reference_text[:240]},
        message=f"Reference answer saved from {file.filename}",
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
    assessment = db.query(Assessment).filter(Assessment.assessment_id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    content_bytes = await file.read()
    extract_result = SubjectiveEvaluationEngine.extract_text_from_file(content_bytes, file.filename)

    if not extract_result["success"] and extract_result.get("page_count", 0) == 0:
        return APIResponse(
            success=False,
            module="ps2",
            student_id=student_id,
            data={"needs_ocr": True, "word_count": extract_result.get("word_count", 0)},
            message=extract_result["message"]
        )

    text_content = extract_result.get("text") or "OCR could not read this scan. Manual page review is required."
    new_sub_id = f"SUB_{uuid.uuid4().hex[:6].upper()}"
    extension = Path(file.filename or "").suffix.lower().lstrip(".")
    if extension not in {"pdf", "png", "jpg", "jpeg", "webp", "bmp"}:
        return APIResponse(success=False, module="ps2", student_id=student_id, data=None,
                           message="Upload a PDF or image file to receive a marked-up answer sheet preview.")
    source_dir = UPLOAD_ROOT / new_sub_id
    source_dir.mkdir(parents=True, exist_ok=True)
    (source_dir / f"source.{extension}").write_bytes(content_bytes)
    submission = Submission(
        submission_id=new_sub_id,
        assessment_id=assessment_id,
        student_id=student_id,
        file_name=file.filename,
        file_type=(file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "file"),
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

@router.get("/submissions/{submission_id}/annotated-pages", response_model=APIResponse[dict])
def get_annotated_submission_pages(submission_id: str, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.submission_id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    page_dir = UPLOAD_ROOT / submission_id / "graded"
    pages = sorted(page_dir.glob("page-*.png"), key=lambda path: int(path.stem.split("-")[-1])) if page_dir.exists() else []
    return APIResponse(
        success=True, module="ps2", student_id=submission.student_id,
        data={"pages": [f"/api/ps2/submissions/{submission_id}/annotated-pages/{index}" for index in range(1, len(pages) + 1)]},
        message=f"Retrieved {len(pages)} annotated page(s)",
    )

@router.get("/submissions/{submission_id}/annotated-pages/{page_number}")
def get_annotated_submission_page(submission_id: str, page_number: int, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.submission_id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    image_path = UPLOAD_ROOT / submission_id / "graded" / f"page-{page_number}.png"
    if page_number < 1 or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Annotated page not found. Run evaluation again to generate it.")
    return FileResponse(image_path, media_type="image/png", filename=image_path.name)

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
    full_reference = " ".join(ref_answers).strip()
    if not full_reference:
        raise HTTPException(status_code=400, detail="Upload a reference answer sheet or add a reference answer before grading.")

    # Execute Hybrid Semantic Grading
    grading_result = SubjectiveEvaluationEngine.evaluate_submission(
        submitted_text=submission.submitted_text,
        reference_answer=full_reference,
        rubric=assessment.rubric or {},
        max_marks=max_marks
    )

    source_dir = UPLOAD_ROOT / submission_id
    annotation_pages = []
    source_files = list(source_dir.glob("source.*")) if source_dir.exists() else []
    if source_files:
        source_file = source_files[0]
        annotated_dir = source_dir / "graded"
        for old_page in annotated_dir.glob("page-*.png") if annotated_dir.exists() else []:
            old_page.unlink()
        annotation_result = SubjectiveEvaluationEngine.create_annotated_pages(
            source_file.read_bytes(), submission.file_name or source_file.name,
            str(annotated_dir), full_reference, max_marks,
        )
        annotation_pages = annotation_result.get("pages", [])
        for page in annotation_pages:
            page.pop("image_path", None)
            page["image_url"] = f"/api/ps2/submissions/{submission_id}/annotated-pages/{page['page_number']}"
        if annotation_pages and any(page.get("boxes") for page in annotation_pages):
            grading_result["total_score"] = annotation_result["total_score"]
            grading_result["max_score"] = max_marks
            grading_result["percentage"] = annotation_result["percentage"]

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
            ai_feedback={**grading_result["ai_feedback"], "answer_regions": annotation_pages},
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
        evaluation.ai_feedback = {**grading_result["ai_feedback"], "answer_regions": annotation_pages}

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
            "annotated_pages": [page["image_url"] for page in annotation_pages],
            "answer_regions": annotation_pages,
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
    annotated_dir = UPLOAD_ROOT / submission_id / "graded"
    annotated_pages = sorted(annotated_dir.glob("page-*.png"), key=lambda path: int(path.stem.split("-")[-1])) if annotated_dir.exists() else []

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
            "annotated_pages": [f"/api/ps2/submissions/{submission_id}/annotated-pages/{i}" for i in range(1, len(annotated_pages) + 1)],
            "answer_regions": (evaluation.ai_feedback or {}).get("answer_regions", []),
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

@router.put("/evaluations/{evaluation_id}/answer-regions", response_model=APIResponse[dict])
def save_answer_region_edits(
    evaluation_id: str,
    payload: Dict[str, Any],
    current_role: str = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db),
):
    evaluation = db.query(Evaluation).filter(Evaluation.evaluation_id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    pages = payload.get("pages")
    if not isinstance(pages, list):
        raise HTTPException(status_code=422, detail="Expected an answer-region page list")

    total_score = 0.0
    for page in pages:
        for region in page.get("boxes", []):
            for coordinate in ("x", "y", "width", "height"):
                value = float(region.get(coordinate, 0))
                if value < 0 or value > 1:
                    raise HTTPException(status_code=422, detail=f"Invalid answer box {coordinate}")
                region[coordinate] = round(value, 5)
            max_marks = max(0.0, float(region.get("max_marks", 0)))
            awarded = float(region.get("awarded", 0))
            if awarded < 0 or awarded > max_marks:
                raise HTTPException(status_code=422, detail="Awarded marks must be between zero and the box maximum")
            region["awarded"] = round(awarded, 2)
            region["max_marks"] = round(max_marks, 2)
            region["status"] = "correct" if max_marks and awarded >= max_marks * 0.8 else ("partial" if awarded > 0 else "wrong")
            total_score += awarded

    feedback = dict(evaluation.ai_feedback or {})
    feedback["answer_regions"] = pages
    evaluation.ai_feedback = feedback
    max_score = evaluation.max_score or 0.0
    evaluation.total_score = round(min(total_score, max_score), 2)
    evaluation.percentage = round(evaluation.total_score / max_score * 100, 1) if max_score else 0.0
    evaluation.moderator_override_score = None
    evaluation.is_moderated = False
    db.commit()
    return APIResponse(
        success=True, module="ps2", student_id=evaluation.student_id,
        data={"total_score": evaluation.total_score, "max_score": max_score, "percentage": evaluation.percentage, "moderator_override_score": None, "is_moderated": False, "answer_regions": pages},
        message="Answer-region edits saved",
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
