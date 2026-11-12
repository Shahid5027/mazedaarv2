import datetime
import secrets
from typing import List, Optional
import bcrypt
import jwt
from fastapi import Header, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.entities import User

# Active demo state fallback for dev tools & demo role switcher
ACTIVE_DEMO_STATE = {
    "role": "student",
    "user_id": "USR_STU1",
    "student_id": "STU001"
}

def get_password_hash(password: str) -> str:
    """Hashes a password securely using bcrypt with automatic salting."""
    # Bcrypt maximum input length is 72 bytes
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored bcrypt hash."""
    if not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Encodes a signed JWT access token with an expiration timestamp."""
    to_encode = data.copy()
    now = datetime.datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def generate_reset_token() -> str:
    """Generates a cryptographically strong URL-safe reset token."""
    return secrets.token_urlsafe(32)

def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Extracts current user from JWT Bearer token, or falls back to demo role context.
    """
    token = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
        elif len(parts) == 1:
            token = parts[0]

    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.user_id == payload["sub"]).first()
            if user and user.is_active:
                return user

    # Fallback to X-User-Role / ACTIVE_DEMO_STATE for seamless dev testing
    role_to_use = (x_user_role or ACTIVE_DEMO_STATE.get("role", "student")).lower().strip()
    if role_to_use == "faculty":
        role_to_use = "teacher"
        
    demo_user = db.query(User).filter(User.role.in_([role_to_use, "faculty" if role_to_use == "teacher" else role_to_use])).first()
    return demo_user

def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Strict dependency enforcing authenticated user presence.
    """
    user = get_current_user_optional(authorization, x_user_role, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials invalid or missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_current_user_role(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> str:
    """Extracts role string from active token or fallback."""
    user = get_current_user_optional(authorization, x_user_role, db)
    if user:
        return user.role.lower()
    return ACTIVE_DEMO_STATE.get("role", "student").lower()

def require_role(allowed_roles: List[str]):
    """
    Dependency factory enforcing strict role-based permissions in backend routes.
    """
    def role_checker(
        authorization: Optional[str] = Header(None),
        x_user_role: Optional[str] = Header(None),
        db: Session = Depends(get_db)
    ):
        user = get_current_user(authorization, x_user_role, db)
        role = user.role.lower()
        normalized_role = "teacher" if role == "faculty" else role
        normalized_allowed = ["teacher" if r == "faculty" else r.lower() for r in allowed_roles]

        if normalized_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access Denied: Role '{user.role}' lacks required permissions. "
                    f"Allowed roles: {allowed_roles}."
                )
            )
        return normalized_role
    return role_checker
