from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.entities import User
from app.schemas.common import APIResponse

router = APIRouter(prefix="/api/users", tags=["Users & Roles"])

# In-memory active demo role tracker for seamless switching
ACTIVE_DEMO_STATE = {
    "role": "student",
    "user_id": "USR_STU1",
    "student_id": "STU001"
}

class RoleSwitchRequest(BaseModel):
    role: str # student, teacher, faculty, counselor, admin
    student_id: Optional[str] = "STU001"

@router.get("/current", response_model=APIResponse[dict])
def get_current_user(db: Session = Depends(get_db)):
    role = ACTIVE_DEMO_STATE["role"]
    user = db.query(User).filter(User.role == role).first()
    
    user_info = {
        "user_id": user.user_id if user else f"USR_{role.upper()}",
        "username": user.username if user else f"{role}_demo",
        "full_name": user.full_name if user else f"Demo {role.capitalize()}",
        "role": role,
        "email": user.email if user else f"{role}@educore.edu",
        "active_student_id": ACTIVE_DEMO_STATE.get("student_id") if role == "student" else None
    }

    return APIResponse(
        success=True,
        module="system",
        student_id=ACTIVE_DEMO_STATE.get("student_id") if role == "student" else None,
        data=user_info,
        message=f"Current active session: {role.upper()}"
    )

@router.get("/roles", response_model=APIResponse[List[dict]])
def get_available_roles():
    roles = [
        {"role": "student", "label": "Student (Aarav Sharma - STU001)", "description": "Adaptive learning, formative quizzes, submission view"},
        {"role": "teacher", "label": "Teacher / Faculty (Prof. Rajesh Sengupta)", "description": "Curriculum overview, rubric designer, AI subjective grading"},
        {"role": "counselor", "label": "Counselor (Kavita Deshmukh)", "description": "Student risk dashboard, explainability drivers, retention tasks"},
        {"role": "admin", "label": "Dean / Academic Admin", "description": "Institutional analytics, retention trends, department audits"}
    ]
    return APIResponse(
        success=True,
        module="system",
        student_id=None,
        data=roles,
        message="Demo roles retrieved"
    )

@router.post("/switch-role", response_model=APIResponse[dict])
def switch_demo_role(payload: RoleSwitchRequest, db: Session = Depends(get_db)):
    valid_roles = ["student", "teacher", "faculty", "counselor", "admin"]
    if payload.role.lower() not in valid_roles:
        return APIResponse(
            success=False,
            module="system",
            student_id=None,
            data=None,
            message=f"Invalid role '{payload.role}'. Must be one of: {valid_roles}"
        )

    ACTIVE_DEMO_STATE["role"] = payload.role.lower()
    if payload.role.lower() == "student":
        ACTIVE_DEMO_STATE["student_id"] = payload.student_id or "STU001"
    else:
        ACTIVE_DEMO_STATE["student_id"] = None

    return APIResponse(
        success=True,
        module="system",
        student_id=ACTIVE_DEMO_STATE.get("student_id"),
        data=ACTIVE_DEMO_STATE,
        message=f"Switched active demo context to '{payload.role}'"
    )

