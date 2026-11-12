from fastapi import Header, HTTPException, Depends
from typing import List, Optional
from app.routers.users import ACTIVE_DEMO_STATE

def get_current_user_role(x_user_role: Optional[str] = Header(None)) -> str:
    """
    Extracts active user role from X-User-Role request header,
    falling back to ACTIVE_DEMO_STATE for seamless demo switching.
    Valid roles: student, teacher, counselor, admin
    """
    if x_user_role:
        return x_user_role.lower().strip()
    return ACTIVE_DEMO_STATE.get("role", "student").lower().strip()

def require_role(allowed_roles: List[str]):
    """
    Dependency factory enforcing role-based permissions in backend routes.
    """
    def role_checker(role: str = Depends(get_current_user_role)):
        # Normalize teacher/faculty
        normalized_role = "teacher" if role == "faculty" else role
        normalized_allowed = ["teacher" if r == "faculty" else r for r in allowed_roles]

        if normalized_role not in normalized_allowed:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Access Denied: Role '{role}' does not possess required privileges. "
                    f"Required roles: {allowed_roles}."
                )
            )
        return normalized_role
    return role_checker

