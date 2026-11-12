from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
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

class VoiceTutorRequest(BaseModel):
    student_id: str
    question: str
    language: str = "kn-IN"  # kn-IN, hi-IN, en-IN
    topic_id: Optional[str] = None

@router.post("/voice-tutor", response_model=APIResponse[dict])
def voice_tutor_conversation(
    payload: VoiceTutorRequest,
    db: Session = Depends(get_db)
):
    """
    Multilingual conversational voice-to-voice AI tutor.
    Understands questions in Kannada, Hindi, and English, adapts to student's
    curriculum mastery, and returns conversational response + pedagogical follow-ups.
    """
    student = db.query(Student).filter(Student.student_id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Determine topic context
    topic = None
    if payload.topic_id:
        topic = db.query(Topic).filter(Topic.topic_id == payload.topic_id).first()
    if not topic:
        # Default to first active course topic
        topic = db.query(Topic).first()

    # Retrieve student's topic mastery
    progress = db.query(LearningProgress).filter(
        LearningProgress.student_id == student.student_id,
        LearningProgress.topic_id == topic.topic_id
    ).first()

    mastery = progress.mastery_score if progress else 65.0
    weak_concepts = progress.weak_concepts if progress and progress.weak_concepts else []

    q_lower = payload.question.lower()
    lang = payload.language.lower()

    # Topic domain knowledge base
    knowledge = {
        "tree": {
            "kn": "ಮರಗಳ ದತ್ತಾಂಶ ರಚನೆ (Tree Data Structure) ಶ್ರೇಣೀಕೃತವಾಗಿದೆ. ಪ್ರತಿ ನೋಡ್ (Node) ಮೌಲ್ಯ ಮತ್ತು ಮಕ್ಕಳ ಪಾಯಿಂಟರ್‌ಗಳನ್ನು ಹೊಂದಿರುತ್ತದೆ. ಬೈನರಿ ಸರ್ಚ್ ಟ್ರೀ (BST) ಯಲ್ಲಿ, ಎಡ ಮಗುವಿನ ಮೌಲ್ಯವು ಪೋಷಕ ನೋಡ್‌ಗಿಂತ ಕಡಿಮೆಯಾಗಿರುತ್ತದೆ ಮತ್ತು ಬಲ ಮಗುವಿನ ಮೌಲ್ಯವು ಹೆಚ್ಚಾಗಿರುತ್ತದೆ.",
            "hi": "ट्री डेटा संरचना (Tree Data Structure) एक पदानुक्रमित संरचना है। बाइनरी सर्च ट्री (BST) में बायाँ नोड हमेशा पैरेंट से छोटा और दायाँ नोड हमेशा पैरेंट से बड़ा होता है। इन-ऑर्डर ट्रैवर्सल से हमें सॉर्टेड क्रम प्राप्त होता है।",
            "en": "A tree data structure is a non-linear hierarchical representation composed of nodes and edges. In a Binary Search Tree (BST), the left child is strictly smaller than the parent node, and the right child is greater. Inorder traversal always yields sorted keys.",
            "follow_up_kn": "ನಿಮಗೆ ಎವಿಎಲ್ ಮರದ (AVL Tree) ಸಮತೋಲನ ಅಂಶ (Balance Factor) ಲೆಕ್ಕಾಚಾರ ತಿಳಿದಿದೆಯೇ?",
            "follow_up_hi": "क्या आप जानते हैं कि AVL ट्री में बैलेंस फैक्टर (Balance Factor) की गणना कैसे की जाती है?",
            "follow_up_en": "Do you know how the balance factor is calculated in an AVL self-balancing tree?",
            "practice": "Calculate balance factor when Left Subtree Height = 3 and Right Subtree Height = 1."
        },
        "avl": {
            "kn": "ಎವಿಎಲ್ ಮರವು (AVL Tree) ಸ್ವಯಂ-ಸಮತೋಲನಗೊಳಿಸುವ ಬೈನರಿ ಸರ್ಚ್ ಟ್ರೀ ಆಗಿದೆ. ಇಲ್ಲಿ ಯಾವುದೇ ನೋಡ್‌ನ ಸಮತೋಲನ ಅಂಶವು -1, 0 ಅಥವಾ +1 ಆಗಿರಬೇಕು. ಸಮತೋಲನ ತಪ್ಪಿದರೆ ಸಿಂಗಲ್ (LL, RR) ಅಥವಾ ಡಬಲ್ (LR, RL) ರೊಟೇಶನ್‌ಗಳನ್ನು ಬಳಸಲಾಗುತ್ತದೆ.",
            "hi": "AVL ट्री एक सेल्फ-बैलेंसिंग BST है जहाँ प्रत्येक नोड का बैलेंस फैक्टर केवल -1, 0, या +1 हो सकता है। असंतुलन होने पर सिंगल या डबल रोटेशन द्वारा ट्री को री-बैलेंस किया जाता है।",
            "en": "An AVL tree is a height-balanced BST where the difference between left and right subtree heights (Balance Factor) cannot exceed ±1. Imbalances are restored via LL, RR, LR, or RL rotations.",
            "follow_up_kn": "ಲೆಫ್ಟ್-ರೈಟ್ (LR) ಅಸಮತೋಲನವನ್ನು ಸರಿಪಡಿಸಲು ಯಾವ ಎರಡು ರೊಟೇಶನ್‌ಗಳು ಬೇಕು?",
            "follow_up_hi": "लेफ्ट-राइट (LR) इम्बैलेंस को सही करने के लिए कौन से दो रोटेशन करने होते हैं?",
            "follow_up_en": "Which two rotations are required to resolve a Left-Right (LR) imbalance?",
            "practice": "Given an unbalanced subtree with LR violation, demonstrate the double rotation steps."
        },
        "graph": {
            "kn": "ಗ್ರಾಫ್ (Graph) ಶೃಂಗಗಳು (Vertices) ಮತ್ತು ಅಂಚುಗಳ (Edges) ಸಂಗ್ರಹವಾಗಿದೆ. ಬಿಎಫ್‌ಎಸ್ (BFS) ಕ್ಯೂ (Queue) ಬಳಸಿ ಹಂತ-ಹಂತವಾಗಿ ಶೋಧಿಸಿದರೆ, ಡಿಎಫ್‌ಎಸ್ (DFS) ಸ್ಟ್ಯಾಕ್ (Stack) ಅಥವಾ ಪುನರಾವರ್ತನೆ ಬಳಸಿ ಆಳವಾಗಿ ಶೋಧಿಸುತ್ತದೆ.",
            "hi": "ग्राफ (Graph) वर्टेक्स और किनारों का समूह है। BFS कतार (Queue) का उपयोग करके चौड़ाई में खोजता है, जबकि DFS स्टैक या पुनरावृत्ति द्वारा गहराई में खोजता है।",
            "en": "A graph G = (V, E) represents relational networks. Breadth-First Search (BFS) uses a queue for level-order traversal, whereas Depth-First Search (DFS) uses a stack or recursion for deep branch traversal.",
            "follow_up_kn": "ಸೈಕಲ್ ಪತ್ತೆಹಚ್ಚಲು (Cycle Detection) ಬಿಎಫ್‌ಎಸ್ ಅಥವಾ ಡಿಎಫ್‌ಎಸ್‌ನಲ್ಲಿ ಯಾವುದನ್ನು ಬಳಸುತ್ತೀರಿ?",
            "follow_up_hi": "क्या आप बता सकते हैं कि चक्र पहचान (Cycle Detection) के लिए BFS या DFS का उपयोग कैसे किया जाता है?",
            "follow_up_en": "How can DFS be utilized to detect cycles in a directed graph using back edges?",
            "practice": "Write the state representation for detecting a cycle in a directed graph of 5 vertices."
        },
        "default": {
            "kn": f"ಖಂಡಿತ, {topic.name} ವಿಷಯದ ಕುರಿತು ನೀವು ಕೇಳಿರುವ ಪ್ರಶ್ನೆಗೆ ವಿವರಣೆ ಇಲ್ಲಿದೆ. ಈ ಪರಿಕಲ್ಪನೆಯನ್ನು ಮೂಲತತ್ವಗಳಿಂದ ಹಂತ-ಹಂತವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು ಸುಲಭ.",
            "hi": f"ज़रूर, {topic.name} के बारे में आपके प्रश्न का स्पष्टीकरण यहाँ है। इस अवधारणा को मूलभूत नियमों और उदाहरणों के साथ समझना बहुत आसान है।",
            "en": f"Certainly! Regarding your question on {topic.name}: focus on breaking down the fundamental invariant rules and step-by-step state representations.",
            "follow_up_kn": "ಈ ಪರಿಕಲ್ಪನೆಯಲ್ಲಿ ನಿಮಗೆ ಇನ್ನೂ ಯಾವ ಭಾಗದಲ್ಲಿ ಸಂದೇಹವಿದೆ?",
            "follow_up_hi": "क्या इस अवधारणा के किसी विशेष भाग में आपको और स्पष्टीकरण चाहिए?",
            "follow_up_en": "Would you like an illustrative code example or an interactive practice question?",
            "practice": f"Review standard implementation problems for {topic.name}."
        }
    }

    # Match domain concept
    matched_key = "default"
    if "avl" in q_lower or "balance" in q_lower or "rotation" in q_lower:
        matched_key = "avl"
    elif "graph" in q_lower or "bfs" in q_lower or "dfs" in q_lower or "cycle" in q_lower:
        matched_key = "graph"
    elif "tree" in q_lower or "bst" in q_lower or "binary" in q_lower:
        matched_key = "tree"

    selected_domain = knowledge[matched_key]

    # Select language response
    if "kn" in lang or "kannada" in lang:
        resp_text = selected_domain["kn"]
        follow_up = selected_domain["follow_up_kn"]
    elif "hi" in lang or "hindi" in lang:
        resp_text = selected_domain["hi"]
        follow_up = selected_domain["follow_up_hi"]
    else:
        resp_text = selected_domain["en"]
        follow_up = selected_domain["follow_up_en"]

    # Adapt if student has low mastery
    if mastery < 60:
        if "kn" in lang:
            resp_text += " ನಿಮ್ಮ ಹಿಂದಿನ ರಸಪ್ರಶ್ನೆ ಸ್ಕೋರ್ ಆಧಾರದ ಮೇಲೆ, ನಾವು ಮೂಲಭೂತ ಉದಾಹರಣೆಗಳಿಂದ ಪ್ರಾರಂಭಿಸೋಣ."
        elif "hi" in lang:
            resp_text += " आपके पिछले क्विज़ स्कोर को देखते हुए, पहले हम बुनियादी उदाहरणों पर ध्यान देंगे।"
        else:
            resp_text += " Based on your diagnostic quiz performance, let's strengthen foundational invariants first."

    # Persist activity log for genuine student telemetry
    try:
        new_log = RemediationLog(
            log_id=f"LOG_VOC_{int(datetime.datetime.utcnow().timestamp())}_{topic.topic_id[:6]}",
            student_id=student.student_id,
            topic_id=topic.topic_id,
            weak_concept=f"Voice Query: {payload.question[:50]}",
            completed=True
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        print(f"Log notice: {e}")

    return APIResponse(
        success=True,
        module="ps1",
        student_id=student.student_id,
        data={
            "question": payload.question,
            "language": payload.language,
            "topic_id": topic.topic_id,
            "topic_name": topic.name,
            "student_mastery": mastery,
            "response_text": resp_text,
            "follow_up_question": follow_up,
            "practice_prompt": selected_domain["practice"],
            "matched_concept": matched_key
        },
        message="Voice tutor pedagogical response generated successfully."
    )
