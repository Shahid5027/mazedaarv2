import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.entities import User, Student
from app.schemas.common import APIResponse
from app.auth import get_password_hash, require_role, ACTIVE_DEMO_STATE

router = APIRouter(prefix="/api/users", tags=["Users & Administration"])

class RoleSwitchRequest(BaseModel):
    role: str # student, teacher, faculty, counselor, admin
    student_id: Optional[str] = "STU001"

class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3)
    full_name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    role: str = Field(..., description="admin, teacher, counselor, student")
    password: str = Field(..., min_length=6)
    department: Optional[str] = "Computer Science"
    student_id: Optional[str] = None

class UpdateUserStatusRequest(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    department: Optional[str] = None

@router.get("", response_model=APIResponse[List[dict]])
def list_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin", "teacher"]))
):
    """Admin/Staff view of all institutional accounts."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.lower())
    
    users = query.order_by(User.created_at.desc()).all()
    user_list = [
        {
            "user_id": u.user_id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "department": u.department or ("Computer Science" if u.student else "Administration"),
            "student_id": u.student_id,
            "is_active": getattr(u, "is_active", True),
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]

    return APIResponse(
        success=True,
        module="system",
        student_id=None,
        data=user_list,
        message=f"Retrieved {len(user_list)} institutional users."
    )

@router.post("", response_model=APIResponse[dict])
def admin_create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    """Admin-only user creation."""
    existing = db.query(User).filter(
        (User.username.ilike(payload.username)) | (User.email.ilike(payload.email))
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists.")

    new_user_id = f"USR_{payload.role[:3].upper()}_{int(datetime.datetime.utcnow().timestamp())}"
    user = User(
        user_id=new_user_id,
        username=payload.username.strip(),
        full_name=payload.full_name.strip(),
        email=payload.email.strip().lower(),
        role=payload.role.strip().lower(),
        department=payload.department,
        student_id=payload.student_id,
        hashed_password=get_password_hash(payload.password),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return APIResponse(
        success=True,
        module="system",
        student_id=user.student_id,
        data={"user_id": user.user_id, "username": user.username, "role": user.role},
        message=f"User {user.username} created successfully."
    )

@router.patch("/{user_id}", response_model=APIResponse[dict])
def admin_update_user(
    user_id: str,
    payload: UpdateUserStatusRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    """Admin-only modification of user account status or role."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found.")

    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.role is not None:
        user.role = payload.role.lower()
    if payload.department is not None:
        user.department = payload.department

    db.commit()

    return APIResponse(
        success=True,
        module="system",
        student_id=user.student_id,
        data={"user_id": user.user_id, "role": user.role, "is_active": user.is_active},
        message=f"User {user_id} updated successfully."
    )

@router.get("/current", response_model=APIResponse[dict])
def get_current_user_info(db: Session = Depends(get_db)):
    role = ACTIVE_DEMO_STATE["role"]
    user = db.query(User).filter(User.role.in_([role, "faculty" if role == "teacher" else role])).first()
    
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

    role = payload.role.lower()
    ACTIVE_DEMO_STATE["role"] = role
    if role == "student":
        ACTIVE_DEMO_STATE["student_id"] = payload.student_id or "STU001"
    else:
        ACTIVE_DEMO_STATE["student_id"] = None

    user = db.query(User).filter(User.role.in_([role, "faculty" if role == "teacher" else role])).first()
    if user:
        ACTIVE_DEMO_STATE["user_id"] = user.user_id

    return APIResponse(
        success=True,
        module="system",
        student_id=ACTIVE_DEMO_STATE.get("student_id"),
        data=ACTIVE_DEMO_STATE,
        message=f"Switched active demo context to '{payload.role}'"
    )
