# EDUCORE AI — Granular Role-Based Access Control (RBAC) Matrix

**Platform**: EDUCORE AI  
**Security Standard**: Least Privilege Principle, Backend Token Verification, Record-Level Data Isolation  
**Date**: November 2026  

---

## 1. Role Definitions

EDUCORE AI enforces four discrete roles throughout both the FastAPI backend dependencies and the Next.js frontend route interceptors:

1. **Student (`student`)**: Learner accessing personalized mastery maps, adaptive quizzes, multilingual voice tutoring, assessment feedback, and self-profile.
2. **Teacher / Faculty (`teacher` / `faculty`)**: Academic educator managing courses, authoring rubrics, viewing class mastery analytics, grading submissions, and performing human-in-the-loop grade moderation.
3. **Counselor (`counselor`)**: Student welfare officer monitoring dropout indicators, reviewing SHAP feature attributions, managing the risk heatmap, and scheduling Retention Copilot interventions.
4. **Dean / Administrator (`admin` / `dean`)**: Institutional executive overseeing cross-departmental analytics, user lifecycles, and academic records (including attendance recalculation audits).

---

## 2. API Endpoint & Permission Matrix

| Endpoint | Method | Permitted Roles | Authorization Mechanism | Description |
| :--- | :---: | :--- | :--- | :--- |
| `/api/auth/login` | POST | Public | Open | Authenticates credentials; returns JWT |
| `/api/auth/register` | POST | Public / Self | Open | Registers new Student or Faculty accounts |
| `/api/auth/demo-accounts` | GET | Public | Open | Supplies verified seeded credentials |
| `/api/auth/me` | GET | Authenticated | `get_current_user` | Returns identity of active token bearer |
| `/api/students` | GET | All Authenticated | JWT Bearer | Lists enrolled student directory |
| `/api/students/{id}` | GET | Student (Self), Teacher, Counselor, Admin | Record Ownership Check | Retrieves 360° profile. If caller is Student and ID != token ID -> **403 Forbidden** |
| `/api/students` | POST | Teacher, Admin | `require_role(["teacher", "admin"])` | Registers a new student in the database |
| `/api/analytics/institution` | GET | Admin, Dean | `require_role(["admin", "dean"])` | Executive institution-level dashboard stats |
| `/api/analytics/teacher` | GET | Teacher, Admin | `require_role(["teacher", "admin"])` | Class performance & weak concept stats |
| `/api/analytics/counselor` | GET | Counselor, Admin | `require_role(["counselor", "admin"])` | Risk distribution, heatmap & urgent alerts |
| `/api/analytics/student/{id}` | GET | Student (Self), Teacher, Admin | Ownership / Role Check | Student personal mastery trends |
| `/api/analytics/recalculate-attendance` | POST | Admin, Dean | `require_role(["admin", "dean"])` | Recalculates attendance formula with audit |
| `/api/ps1/topics` | GET | All Roles | Open / Read-only | Retrieves curriculum hierarchy |
| `/api/ps1/quiz/submit` | POST | Student, Admin | JWT Bearer | Submits answers and updates mastery score |
| `/api/ps1/voice-tutor` | POST | All Authenticated | JWT Bearer | Real-time multilingual voice query |
| `/api/ps2/assessments` | GET | All Roles | JWT Bearer | Lists available assessments |
| `/api/ps2/assessments` | POST | Teacher, Admin | `require_role(["teacher", "admin"])` | Authors assessment & rubric criteria |
| `/api/ps2/submissions` | POST | Student, Teacher, Admin | JWT Bearer | Submits answer script (scanned/digital) |
| `/api/ps2/evaluate/{id}` | POST | Teacher, Admin | `require_role(["teacher", "admin"])` | Triggers Surya OCR + semantic grading |
| `/api/ps2/moderation-override` | POST | Teacher, Admin | `require_role(["teacher", "admin"])` | Overrides AI score with human audit trail |
| `/api/ps3/risk-assessment` | GET | Counselor, Teacher, Admin | Role Check | Retrieves cohort risk predictions |
| `/api/ps3/interventions` | POST | Counselor, Admin | `require_role(["counselor", "admin"])` | Schedules intervention task for at-risk student |

---

## 3. Record-Level Security Enforcement

```python
# Verified implementation in backend/app/routers/students.py
if current_user and current_user.role.lower() == "student":
    if current_user.student_id and current_user.student_id != student_id:
        raise HTTPException(
            status_code=403,
            detail=f"Access Denied: Student account ({current_user.student_id}) cannot access records belonging to {student_id}."
        )
```

This prevents IDOR (Insecure Direct Object Reference) vulnerabilities, guaranteeing that a student authenticated as `STU001` cannot read the grades, attendance records, or risk flags of `STU002`.
