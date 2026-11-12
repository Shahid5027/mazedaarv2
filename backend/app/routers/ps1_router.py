from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import datetime
import uuid

from app.database import get_db
from app.models.entities import Student, Course, Topic, LearningProgress, RemedialResource, RemediationLog
from app.schemas.common import APIResponse
from app.schemas.entities import QuizSubmissionRequest
from app.engines.ps1_adaptive_engine import AdaptiveLearningEngine, TOPIC_QUESTION_BANK
from app.engines.ps1_rag_engine import CurriculumRAGEngine

router = APIRouter(prefix="/api/ps1", tags=["PS1: Adaptive Learning Engine"])

@router.get("/topics", response_model=APIResponse[List[dict]])
def get_curriculum_topics(course_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Topic)
    if course_id:
        query = query.filter(Topic.course_id == course_id)
    topics = query.order_by(Topic.order_index).all()

    data = []
    for t in topics:
        course = db.query(Course).filter(Course.course_id == t.course_id).first()
        data.append({
            "topic_id": t.topic_id,
            "course_id": t.course_id,
            "course_code": course.code if course else "",
            "course_title": course.title if course else "",
            "name": t.name,
            "difficulty_level": t.difficulty_level,
            "order_index": t.order_index,
            "description": t.description,
            "prerequisites": t.prerequisites or [],
            "concept_nodes": t.concept_nodes or []
        })

    return APIResponse(
        success=True,
        module="ps1",
        student_id=None,
        data=data,
        message=f"Retrieved {len(data)} curriculum topics"
    )

@router.get("/progress/{student_id}", response_model=APIResponse[dict])
def get_student_learning_progress(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    progress_list = db.query(LearningProgress).filter(LearningProgress.student_id == student_id).all()
    avg_mastery = round(sum(p.mastery_score for p in progress_list) / len(progress_list), 1) if progress_list else 0.0

    mastered = [p for p in progress_list if p.mastery_score >= 80]
    in_progress = [p for p in progress_list if 50 <= p.mastery_score < 80]
    remedial_needed = [p for p in progress_list if p.mastery_score < 50]

    remedial_recommendations = []
    for p in remedial_needed:
        resources = db.query(RemedialResource).filter(RemedialResource.topic_id == p.topic_id).all()
        for r in resources:
            remedial_recommendations.append({
                "resource_id": r.resource_id,
                "topic_id": r.topic_id,
                "topic_name": p.topic_name,
                "title": r.title,
                "type": r.resource_type,
                "estimated_minutes": r.estimated_minutes,
                "language": r.language,
                "content_summary": r.content_summary,
                "url": r.url
            })

    # Fetch recent remediation logs
    remediation_history = db.query(RemediationLog).filter(RemediationLog.student_id == student_id).order_by(RemediationLog.created_at.desc()).limit(10).all()

    data = {
        "student_id": student.student_id,
        "student_name": student.name,
        "average_mastery": avg_mastery,
        "total_topics_tracked": len(progress_list),
        "counts": {
            "mastered": len(mastered),
            "in_progress": len(in_progress),
            "needs_remediation": len(remedial_needed)
        },
        "topics": [
            {
                "progress_id": p.progress_id,
                "topic_id": p.topic_id,
                "topic_name": p.topic_name,
                "course_id": p.course_id,
                "mastery_score": p.mastery_score,
                "status": p.status,
                "weak_concepts": p.weak_concepts or [],
                "quiz_attempts_count": p.quiz_attempts_count,
                "questions_attempted": getattr(p, "questions_attempted", 0) or 0,
                "correct_answers": getattr(p, "correct_answers", 0) or 0,
                "last_studied_at": p.last_studied_at
            } for p in progress_list
        ],
        "remedial_recommendations": remedial_recommendations,
        "remediation_history": [
            {
                "log_id": rh.log_id,
                "topic_id": rh.topic_id,
                "weak_concept": rh.weak_concept,
                "completed": rh.completed,
                "created_at": rh.created_at
            } for rh in remediation_history
        ]
    }

    return APIResponse(
        success=True,
        module="ps1",
        student_id=student_id,
        data=data,
        message="Adaptive learning progress and mastery tracked"
    )

@router.get("/quiz/{topic_id}", response_model=APIResponse[dict])
def get_adaptive_quiz(
    topic_id: str,
    student_id: Optional[str] = "STU001",
    preferred_difficulty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.topic_id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Determine difficulty level from student's historical mastery on this topic
    difficulty = preferred_difficulty or "medium"
    progress = db.query(LearningProgress).filter(
        LearningProgress.student_id == student_id,
        LearningProgress.topic_id == topic_id
    ).first()

    if progress and not preferred_difficulty:
        if progress.mastery_score >= 80:
            difficulty = "hard"
        elif progress.mastery_score >= 50:
            difficulty = "medium"
        else:
            difficulty = "easy"

    questions = AdaptiveLearningEngine.get_adaptive_questions(topic_id, difficulty=difficulty, count=3)

    return APIResponse(
        success=True,
        module="ps1",
        student_id=student_id,
        data={
            "topic_id": topic.topic_id,
            "topic_name": topic.name,
            "selected_difficulty": difficulty,
            "questions": questions
        },
        message=f"Adaptive quiz generated at '{difficulty.upper()}' difficulty"
    )

@router.post("/quiz/submit", response_model=APIResponse[dict])
def submit_adaptive_quiz(payload: QuizSubmissionRequest, db: Session = Depends(get_db)):
    """
    Evaluates quiz answers, updates mastery with transparent formula,
    determines next question difficulty, and saves remediation logs.
    """
    # 1. Correctness evaluation & weak concept diagnosis
    correct_count, total_count, score_pct, weak_concepts = AdaptiveLearningEngine.diagnose_weaknesses(
        payload.topic_id, payload.answers
    )

    # 2. Retrieve or create learning progress
    progress = db.query(LearningProgress).filter(
        LearningProgress.student_id == payload.student_id,
        LearningProgress.topic_id == payload.topic_id
    ).first()

    current_mastery = progress.mastery_score if progress else 50.0
    attempts_count = progress.quiz_attempts_count if progress else 0

    # 3. Transparent Bayesian/EMA mastery update formula
    new_mastery, new_status = AdaptiveLearningEngine.calculate_new_mastery(
        current_mastery=current_mastery,
        quiz_score_pct=score_pct,
        previous_attempts=attempts_count
    )

    # 4. Adaptive difficulty transition for next quiz
    # Standardized progression thresholds:
    # - Accuracy >= 80%: increase difficulty by one level (bounded at hard)
    # - Accuracy >= 50% and < 80%: maintain difficulty
    # - Accuracy < 50%: decrease difficulty by one level (bounded at easy)
    current_diff = "medium"
    topic_bank = TOPIC_QUESTION_BANK.get(payload.topic_id, {})
    found_diff = None
    for diff, q_list in topic_bank.items():
        if any(q.get("question_id") in payload.answers for q in q_list):
            found_diff = diff
            break
    if found_diff:
        current_diff = found_diff
    elif current_mastery >= 80.0:
        current_diff = "hard"
    elif current_mastery < 50.0:
        current_diff = "easy"

    next_diff = AdaptiveLearningEngine.select_next_difficulty(
        current_difficulty=current_diff,
        recent_score_pct=score_pct
    )

    if score_pct >= 80.0:
        adjustment_rule = "Accuracy >= 80%: increased difficulty by one level"
    elif score_pct < 50.0:
        adjustment_rule = "Accuracy < 50%: decreased difficulty by one level"
    else:
        adjustment_rule = "Accuracy >= 50% and < 80%: maintained current difficulty"

    topic = db.query(Topic).filter(Topic.topic_id == payload.topic_id).first()
    topic_name = topic.name if topic else payload.topic_id

    if not progress:
        progress = LearningProgress(
            progress_id=f"PRG_{payload.student_id}_{payload.topic_id}",
            student_id=payload.student_id,
            course_id=payload.course_id,
            topic_id=payload.topic_id,
            topic_name=topic_name,
            mastery_score=new_mastery,
            status=new_status,
            weak_concepts=weak_concepts,
            quiz_attempts_count=1,
            questions_attempted=total_count,
            correct_answers=correct_count,
            last_studied_at=datetime.datetime.utcnow()
        )
        db.add(progress)
    else:
        progress.mastery_score = new_mastery
        progress.status = new_status
        progress.quiz_attempts_count += 1
        progress.questions_attempted = (getattr(progress, "questions_attempted", 0) or 0) + total_count
        progress.correct_answers = (getattr(progress, "correct_answers", 0) or 0) + correct_count
        progress.last_studied_at = datetime.datetime.utcnow()
        if new_mastery >= 80:
            progress.weak_concepts = []
        elif weak_concepts:
            existing = set(progress.weak_concepts or [])
            existing.update(weak_concepts)
            progress.weak_concepts = list(existing)

    # 5. Log remediation if student struggled
    remediation_lessons = []
    for concept in weak_concepts:
        lesson = AdaptiveLearningEngine.generate_remediation_lesson(payload.topic_id, concept)
        remediation_lessons.append(lesson)
        log = RemediationLog(
            log_id=f"REM_LOG_{uuid.uuid4().hex[:6].upper()}",
            student_id=payload.student_id,
            topic_id=payload.topic_id,
            weak_concept=concept,
            completed=False
        )
        db.add(log)

    db.commit()

    return APIResponse(
        success=True,
        module="ps1",
        student_id=payload.student_id,
        data={
            "correct_answers": correct_count,
            "total_questions": total_count,
            "quiz_score_pct": score_pct,
            "previous_mastery": current_mastery,
            "new_topic_mastery": progress.mastery_score,
            "mastery_status": progress.status,
            "adaptive_difficulty_progression": {
                "previous_difficulty": current_diff,
                "next_recommended_difficulty": next_diff,
                "adjustment_rule": adjustment_rule,
                "accuracy_pct": score_pct,
                "thresholds": {
                    "increase_threshold": ">= 80%",
                    "maintain_threshold": ">= 50% and < 80%",
                    "decrease_threshold": "< 50%"
                }
            },
            "diagnosed_weak_concepts": weak_concepts,
            "remediation_lessons": remediation_lessons
        },
        message=f"Adaptive evaluation completed: scored {score_pct}%. Updated mastery to {progress.mastery_score}% ({next_diff.upper()} next)."
    )

@router.get("/classroom-overview", response_model=APIResponse[dict])
def get_teacher_classroom_overview(db: Session = Depends(get_db)):
    progress_all = db.query(LearningProgress).all()
    total_records = len(progress_all)
    if total_records == 0:
        return APIResponse(success=True, module="ps1", student_id=None, data={}, message="No progress records")

    avg_mastery = round(sum(p.mastery_score for p in progress_all) / total_records, 1)
    weak_records = [p for p in progress_all if p.mastery_score < 50]
    mastered_records = [p for p in progress_all if p.mastery_score >= 80]

    topic_map = {}
    for p in progress_all:
        if p.topic_name not in topic_map:
            topic_map[p.topic_name] = {"scores": [], "weak_students": [], "weak_concepts": set()}
        topic_map[p.topic_name]["scores"].append(p.mastery_score)
        if p.mastery_score < 50:
            topic_map[p.topic_name]["weak_students"].append(p.student_id)
        if p.weak_concepts:
            topic_map[p.topic_name]["weak_concepts"].update(p.weak_concepts)

    topic_summary = []
    for name, item in topic_map.items():
        avg = round(sum(item["scores"]) / len(item["scores"]), 1)
        topic_summary.append({
            "topic_name": name,
            "average_mastery": avg,
            "students_needing_help": len(item["weak_students"]),
            "weakest_concepts": list(item["weak_concepts"]),
            "difficulty_rating": "High" if avg < 55 else ("Medium" if avg < 75 else "Low")
        })

    return APIResponse(
        success=True,
        module="ps1",
        student_id=None,
        data={
            "total_assessments_tracked": total_records,
            "classroom_average_mastery": avg_mastery,
            "students_mastered_count": len(mastered_records),
            "students_needing_remediation_count": len(weak_records),
            "topic_analytics": topic_summary,
            "recommended_remedial_topics": [t["topic_name"] for t in topic_summary if t["difficulty_rating"] == "High"]
        },
        message="Classroom adaptive overview & difficulty analytics retrieved"
    )

@router.post("/curriculum/upload", response_model=APIResponse[dict])
async def upload_curriculum_document(file: UploadFile = File(...)):
    """
    Uploads and indexes curriculum syllabus PDF into RAG chunks with page citations.
    """
    file_bytes = await file.read()
    result = CurriculumRAGEngine.index_pdf_document(file_bytes, file.filename)
    return APIResponse(
        success=result["success"],
        module="ps1",
        student_id=None,
        data=result,
        message=result["message"]
    )

@router.get("/curriculum/remedial-rag", response_model=APIResponse[dict])
def get_grounded_remedial_rag(
    topic_id: str = Query(..., description="Curriculum topic ID"),
    weak_concept: str = Query(..., description="Diagnosed weak concept")
):
    """
    Retrieves grounded textbook citations and targeted practice questions
    for student remediation with zero hallucination.
    """
    rag_data = CurriculumRAGEngine.retrieve_grounded_remediation(topic_id, weak_concept)
    return APIResponse(
        success=True,
        module="ps1",
        student_id=None,
        data=rag_data,
        message=f"Retrieved authentic curriculum chunk for '{weak_concept}' with page citation."
    )
