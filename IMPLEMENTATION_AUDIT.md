# EDUCORE AI — Technical Architecture & Implementation Audit
**Document Version:** 1.0.0  
**Date:** November 12, 2026  
**Auditor:** Senior Full-Stack Engineer & AI/ML Systems Architect  
**Project:** CodeSpark 2026 — EDUCORE AI Platform

---

## 1. Executive Summary & Architecture Ground Truth

An extensive architectural audit of the repository (`masedar chek bp`) was performed covering database models, backend API routes, frontend components, authentication mechanisms, OCR pipelines, ML models, and security boundaries.

### Verified Architecture Stack:
- **Database Engine**: **SQLite 3** (`educore.db`), accessed via **SQLAlchemy 2.0 ORM** with session pooling. No Supabase or external PostgreSQL cluster is used.
- **Backend Application**: **FastAPI 0.110+** running under Uvicorn with standard CORS middleware, standard HTTP exception handlers, and role-based dependencies.
- **Frontend Application**: **Next.js 14.2.35 (App Router)** with **React 18.3**, **Tailwind CSS 3.4**, **Lucide React**, and **Recharts 2.12**.
- **OCR Engine Stack**:
  - Digital native PDF extraction: **PyMuPDF (fitz)**.
  - Scanned / Image document OCR: **Surya OCR (`surya-ocr 0.23.0`)** utilizing `surya.detection.DetectionPredictor` for PyTorch text detection, polygon extraction, and layout reading order; accompanied by Tesseract/RapidOCR fallback where CPU execution requires lightweight character rasterization.
- **Subjective Grading Engine**: **SentenceTransformer (`all-MiniLM-L6-v2`)** for dense embedding semantic similarity, coupled with criterion-level rubric weighting, concept coverage penalty, and faculty override auditing.
- **Retention & Dropout Predictor**: **Scikit-learn Random Forest Pipeline (`dropout_rf_pipeline.joblib`)** paired with local **SHAP TreeExplainer** feature attribution vectors.

---

## 2. Component & Workflow Audit Matrix

| System Area | Current Implementation State | Identified Gaps / Required Improvements | Action Plan |
|---|---|---|---|
| **Authentication & RBAC** | Bcrypt hashing + JWT HS256 tokens in `/api/auth/login`. Four roles: `admin`, `teacher`, `student`, `counselor`. | Login credentials only allowed `.edu` domains; prompt requires `.demo` domain support (`student@educore.demo`, `teacher@educore.demo`, `counselor@educore.demo`, `dean@educore.demo`). | Add alias mapping for `@educore.demo` and `dean` in `auth_router.py` and seed data. |
| **Student Dashboard** | Currently renders topic mastery bar chart and quiz performance line chart in `page.tsx`. | **MANDATORY**: Master prompt explicitly requires removing all graphs/charts from the student dashboard only. | Redesign student dashboard into an action-oriented SaaS hub (welcome summary, active courses, progress bars, weak concepts, pending tasks, attendance stat). |
| **PS1 Voice Tutor** | Basic audio player component exists (`SpeechPlayer.tsx`), and multilingual test endpoint. | Must be a true conversational voice-to-voice tutor supporting Kannada (`kn-IN`), Hindi (`hi-IN`), and English, with interactive mic control, speech recognition, LLM conceptual response, and speech output. | Build `/api/ps1/voice-tutor` backend endpoint + complete interactive voice tutor component with mic controls, transcripts, speech synthesis, and text fallback. |
| **PS2 Surya OCR** | RapidOCR/Tesseract previously used in `ps2_evaluation_engine.py`. `surya-ocr 0.23.0` installed. | Surya OCR must be the primary engine for scanned/image pages. Page routing, image deskew/contrast preprocessing, OCR correction split-view, and teacher text confirmation needed. | Implement `SuryaOCREngine` with `DetectionPredictor`, page classification, OCR correction interface with split-view PDF preview, and save confirmed text. |
| **PS2 React Error** | React object-rendering error reported on rubric breakdown. | React throws `Objects are not valid as a React child` if `correct_concepts` or `missing_concepts` contain dicts or objects instead of strings. | Add safe rendering helper in `FeedbackBreakdown.tsx` and `ps2-grading/page.tsx` normalizing objects to strings. |
| **PS3 Retention & Copilot** | SHAP explanations and retention copilot tasks functional. | Counselor task workflow needs full status cycle (planned, in progress, completed, dismissed with reason). Heatmap filterable by department and semester. | Verify heatmap interactive filtering and task notes/completion persistence. |
| **Dean Controls & Attendance** | Basic user management table in admin view. | Dean needs attendance record audit & recalculation: `(Present / Total) * 100`, plus manual override auditing with author/timestamp/reason. | Implement attendance audit & correction API and UI in admin workspace. |
| **UI Aesthetics** | Contains some heavy gradients and colorful tags ("vibe-coded"). | Needs clean institutional SaaS design (subtle borders, refined typography, slate/indigo palette, clean tables). | Polish UI across Navbar, Sidebar, Dashboards, and Forms. |

---

## 3. Database Schema Verification (`SQLite`)

All core tables reside in `educore.db`:
1. `users`: Stores user identity, bcrypt `hashed_password`, `role`, `department`, `student_id`, `is_active`, `reset_token`, and timestamps.
2. `students`: Shared student identity (`student_id`, `name`, `email`, `department`, `semester`, `cgpa`, `attendance_pct`, `status`).
3. `courses` & `topics`: Curriculum hierarchy, prerequisites, concept nodes for knowledge tracing.
4. `learning_progress`: Tracks student topic mastery score (0-100), status, and `weak_concepts`.
5. `remedial_resources`: Targeted multilingual learning materials.
6. `assessments`: Faculty assessments, questions, and JSON rubrics.
7. `submissions`: Student subjective submissions (text, scanned PDF path, status).
8. `evaluations`: AI score, rubric breakdown, AI feedback, `moderator_override_score`, `moderator_notes`, and audit history.
9. `risk_predictions`: ML dropout prediction risk score, probability, risk level, confidence, and primary factors.
10. `activity_snapshots`: Behavioral time-series data (LMS logins, forum posts, attendance).
11. `interventions`: Counselor action task list with priority, status, and scheduled dates.

---

## 4. Next Implementation Actions

1. Update `backend/app/routers/auth_router.py` to support `@educore.demo` aliases for judge evaluations.
2. Build `SuryaOCREngine` in `backend/app/engines/ps2_evaluation_engine.py` using `surya-ocr 0.23.0` `DetectionPredictor` as primary scanned page engine.
3. Fix React object-rendering error in `FeedbackBreakdown.tsx`.
4. Implement Dean attendance record inspection & formula-driven calculation: `Attendance % = (Present / Total) * 100`.
5. Redesign Student Dashboard in `page.tsx` to completely remove graphs and focus on action-oriented learning.
6. Build Multilingual Voice-to-Voice AI Tutor in PS1 with Kannada, Hindi, and English.
7. Generate all 8 comprehensive reports.
