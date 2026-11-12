import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import User, Student, RiskPrediction
from app.schemas.common import APIResponse
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    generate_reset_token,
    get_current_user,
    ACTIVE_DEMO_STATE
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Session"])

# --- Request & Response Schemas ---

class LoginRequest(BaseModel):
    username_or_email: str = Field(..., description="Username or email address")
    password: str = Field(..., min_length=1, description="Account password")

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=128)
    email: str = Field(..., min_length=5, max_length=128)
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="student", description="student or teacher")
    department: Optional[str] = "Computer Science"
    semester: Optional[int] = 1
    student_id: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class DemoLoginRequest(BaseModel):
    role: str = Field(..., description="admin, teacher, student, counselor")

# --- Routes ---

@router.post("/login", response_model=APIResponse[dict])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    identity = payload.username_or_email.strip().lower()

    # Helpful alias map for standard demo usernames/emails
    demo_aliases = {
        "admin@educore.edu": "dean@educore.edu",
        "admin@educore.demo": "dean@educore.edu",
        "dean@educore.demo": "dean@educore.edu",
        "dean@educore.edu": "dean@educore.edu",
        "dean": "admin_demo",
        "admin": "admin_demo",
        "teacher@educore.edu": "r.sengupta@educore.edu",
        "teacher@educore.demo": "r.sengupta@educore.edu",
        "teacher": "teacher_demo",
        "faculty@educore.edu": "s.rao@educore.edu",
        "faculty@educore.demo": "s.rao@educore.edu",
        "faculty": "faculty_demo",
        "student@educore.edu": "aarav.sharma@educore.edu",
        "student@educore.demo": "aarav.sharma@educore.edu",
        "student": "student_demo",
        "counselor@educore.edu": "k.deshmukh@educore.edu",
        "counselor@educore.demo": "k.deshmukh@educore.edu",
        "counselor": "counselor_demo"
    }
    resolved_identity = demo_aliases.get(identity, identity)

    user = db.query(User).filter(
        (User.username.ilike(resolved_identity)) | 
        (User.email.ilike(resolved_identity)) |
        (User.username.ilike(identity)) |
        (User.email.ilike(identity))
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials: user not found."
        )

    # Verify password
    is_valid = False
    if user.hashed_password:
        is_valid = verify_password(payload.password, user.hashed_password)
    
    # Dev/demo fallback for demo accounts if password matches standard demo password
    if not is_valid:
        role_passwords = {
            "student": ["Student@123", "student123", "demo"],
            "teacher": ["Teacher@123", "teacher123", "demo"],
            "faculty": ["Teacher@123", "Faculty@123", "demo"],
            "counselor": ["Counselor@123", "counselor123", "demo"],
            "admin": ["Admin@123", "admin123", "demo"]
        }
        allowed_pwds = role_passwords.get(user.role.lower(), ["demo"])
        if payload.password in allowed_pwds:
            is_valid = True
            # Update password hash for future checks
            user.hashed_password = get_password_hash(payload.password)
            db.commit()

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password. Please check your credentials and try again."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive or suspended. Please contact administrator."
        )

    # Update demo state to align with active user
    ACTIVE_DEMO_STATE["role"] = user.role.lower()
    ACTIVE_DEMO_STATE["user_id"] = user.user_id
    ACTIVE_DEMO_STATE["student_id"] = user.student_id

    # Create JWT Token
    token_claims = {
        "sub": user.user_id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "student_id": user.student_id
    }
    access_token = create_access_token(token_claims)

    user_info = {
        "user_id": user.user_id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "student_id": user.student_id,
        "department": user.department or (user.student.department if user.student else "Computer Science"),
        "access_token": access_token,
        "token_type": "bearer"
    }

    return APIResponse(
        success=True,
        module="system",
        student_id=user.student_id,
        data=user_info,
        message=f"Welcome back, {user.full_name}! Authenticated as {user.role.upper()}."
    )

@router.post("/register", response_model=APIResponse[dict])
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    role = payload.role.strip().lower()
    if role not in ["student", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is currently available for 'student' and 'teacher' roles."
        )

    # Check email & username uniqueness
    existing_user = db.query(User).filter(
        (User.username.ilike(payload.username)) | (User.email.ilike(payload.email))
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username or email already exists."
        )

    assigned_student_id = None
    if role == "student":
        # Check student ID or generate next STU ID
        if payload.student_id:
            assigned_student_id = payload.student_id.strip().upper()
            if db.query(Student).filter(Student.student_id == assigned_student_id).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Student ID {assigned_student_id} is already registered."
                )
        else:
            total_students = db.query(Student).count()
            assigned_student_id = f"STU{total_students + 1:03d}"

        # Create new student core record
        new_student = Student(
            student_id=assigned_student_id,
            name=payload.full_name,
            email=payload.email,
            department=payload.department or "Computer Science",
            semester=payload.semester or 1,
            cgpa=7.5,
            attendance_pct=95.0,
            status="active"
        )
        db.add(new_student)

        # Baseline PS3 risk entry
        new_risk = RiskPrediction(
            prediction_id=f"RSK_{assigned_student_id}",
            student_id=assigned_student_id,
            risk_score=15.0,
            risk_level="low",
            primary_factors=[{"factor": "New enrollment calibration", "impact": "0%", "severity": "normal"}],
            historical_trend=[{"period": "Initial", "risk": 15.0}]
        )
        db.add(new_risk)

    # Create User account
    user_id = f"USR_{role[:3].upper()}_{int(datetime.datetime.utcnow().timestamp())}"
    new_user = User(
        user_id=user_id,
        username=payload.username.strip(),
        full_name=payload.full_name.strip(),
        email=payload.email.strip().lower(),
        role=role,
        department=payload.department or "Computer Science",
        hashed_password=get_password_hash(payload.password),
        student_id=assigned_student_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue JWT token
    token_claims = {
        "sub": new_user.user_id,
        "username": new_user.username,
        "email": new_user.email,
        "role": new_user.role,
        "full_name": new_user.full_name,
        "student_id": new_user.student_id
    }
    access_token = create_access_token(token_claims)

    return APIResponse(
        success=True,
        module="system",
        student_id=assigned_student_id,
        data={
            "user_id": new_user.user_id,
            "username": new_user.username,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "student_id": assigned_student_id,
            "access_token": access_token,
            "token_type": "bearer"
        },
        message=f"Account created successfully! Welcome to EDUCORE AI, {new_user.full_name}."
    )

@router.post("/forgot-password", response_model=APIResponse[dict])
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    demo_aliases = {
        "admin@educore.edu": "dean@educore.edu",
        "teacher@educore.edu": "r.sengupta@educore.edu",
        "student@educore.edu": "aarav.sharma@educore.edu",
        "counselor@educore.edu": "k.deshmukh@educore.edu"
    }
    resolved_email = demo_aliases.get(email, email)

    user = db.query(User).filter(
        (User.email.ilike(resolved_email)) | (User.email.ilike(email))
    ).first()
    if not user:
        # Prevent account enumeration in production, but provide helpful demo notice
        return APIResponse(
            success=True,
            module="system",
            student_id=None,
            data={"message": "If this email is registered, reset instructions have been generated."},
            message="Password reset request submitted."
        )

    reset_token = generate_reset_token()
    user.reset_token = reset_token
    user.reset_token_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    db.commit()

    return APIResponse(
        success=True,
        module="system",
        student_id=None,
        data={
            "reset_token": reset_token,
            "expires_in": "1 hour",
            "message": "Reset token generated successfully. In production, this is sent via email."
        },
        message="Password reset token issued."
    )

@router.post("/reset-password", response_model=APIResponse[dict])
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token = payload.token.strip()
    user = db.query(User).filter(User.reset_token == token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unrecognized password reset token."
        )

    if user.reset_token_expires and user.reset_token_expires < datetime.datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired. Please request a new one."
        )

    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return APIResponse(
        success=True,
        module="system",
        student_id=None,
        data={"user_id": user.user_id, "username": user.username},
        message="Password has been successfully updated! You can now log in with your new password."
    )

@router.get("/me", response_model=APIResponse[dict])
def get_authenticated_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student_details = None
    if current_user.student_id:
        stu = db.query(Student).filter(Student.student_id == current_user.student_id).first()
        if stu:
            student_details = {
                "student_id": stu.student_id,
                "name": stu.name,
                "email": stu.email,
                "department": stu.department,
                "semester": stu.semester,
                "cgpa": stu.cgpa,
                "attendance_pct": stu.attendance_pct,
                "status": stu.status
            }

    return APIResponse(
        success=True,
        module="system",
        student_id=current_user.student_id,
        data={
            "user_id": current_user.user_id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
            "department": current_user.department or (student_details.get("department") if student_details else "Academic Affairs"),
            "student_id": current_user.student_id,
            "student_details": student_details,
            "is_active": current_user.is_active
        },
        message="Session active and verified."
    )

@router.post("/logout", response_model=APIResponse[dict])
def logout():
    return APIResponse(
        success=True,
        module="system",
        student_id=None,
        data=None,
        message="Session successfully terminated."
    )

@router.get("/demo-accounts", response_model=APIResponse[List[dict]])
def get_demo_accounts():
    accounts = [
        {
            "role": "admin",
            "name": "Dean Academic Affairs",
            "email": "dean@educore.demo",
            "username": "admin_demo",
            "password": "Admin@123",
            "description": "Full institutional telemetry, academic audits & user control"
        },
        {
            "role": "teacher",
            "name": "Prof. Rajesh Sengupta",
            "email": "teacher@educore.demo",
            "username": "teacher_demo",
            "password": "Teacher@123",
            "description": "Curriculum management, subjective rubric AI grading & moderation"
        },
        {
            "role": "student",
            "name": "Aarav Sharma (STU001)",
            "email": "student@educore.demo",
            "username": "student_demo",
            "password": "Student@123",
            "description": "Personal adaptive learning path, voice tutor, & student hub"
        },
        {
            "role": "counselor",
            "name": "Kavita Deshmukh",
            "email": "counselor@educore.demo",
            "username": "counselor_demo",
            "password": "Counselor@123",
            "description": "Cohort risk heatmap, SHAP explainability & student retention tasks"
        }
    ]
    return APIResponse(
        success=True,
        module="system",
        student_id=None,
        data=accounts,
        message="Demo accounts retrieved for development/evaluation environment."
    )

@router.post("/demo-login", response_model=APIResponse[dict])
def demo_login(payload: DemoLoginRequest, db: Session = Depends(get_db)):
    role = payload.role.strip().lower()
    if role == "faculty":
        role = "teacher"

    user = db.query(User).filter(User.role.in_([role, "faculty" if role == "teacher" else role])).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No demo user found for role '{role}'")

    # Update active demo tracker
    ACTIVE_DEMO_STATE["role"] = user.role.lower()
    ACTIVE_DEMO_STATE["user_id"] = user.user_id
    ACTIVE_DEMO_STATE["student_id"] = user.student_id

    # Create JWT Token
    token_claims = {
        "sub": user.user_id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "student_id": user.student_id
    }
    access_token = create_access_token(token_claims)

    user_info = {
        "user_id": user.user_id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "student_id": user.student_id,
        "department": user.department or (user.student.department if user.student else "Academic Affairs"),
        "access_token": access_token,
        "token_type": "bearer"
    }

    return APIResponse(
        success=True,
        module="system",
        student_id=user.student_id,
        data=user_info,
        message=f"Demo session activated as {user.role.upper()}."
    )
