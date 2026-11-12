# EDUCORE AI — Intelligent Student Success & Academic Management System
## Phase 1: Integrated Technical Foundation

EDUCORE AI is an integrated academic platform developed as an independent backup implementation covering all three official **CodeSpark 2026 Education** problem statements:

- **PS1**: AI-Powered Multilingual Adaptive Learning & Automated Remediation Platform
- **PS2**: Automated Formative Assessment and Intelligent Subjective Grading Assistant
- **PS3**: AI-Driven Early Dropout Prediction and Student Retention Copilot

---

## 1. What Was Implemented

### System Core & Main Dashboard
- **EDUCORE AI Branding**: Polished branding with responsive layout, responsive sidebar navigation, operational status badges for PS1, PS2, and PS3, and a modern header.
- **Main Executive Overview Dashboard**: Displays total students (10), active students (6), average learning mastery (68.4%), pending evaluations (1), and at-risk students (4), alongside interactive Recharts distributions and an integrated activity stream.
- **Demo Role Switcher**: Instant switching between simulated personas (**Student** `STU001 Aarav Sharma`, **Teacher / Faculty** `Prof. Rajesh Sengupta`, **Retention Counselor** `Kavita Deshmukh`, and **Academic Dean / Admin`).
- **Shared Student Directory**: Full table of all 10 students with search, department filtering, and links to unified 360° student profiles.

### PS1: Multilingual Adaptive Learning Module
- **Curriculum Syllabus & Topics Selection**: Topics mapped across courses (Binary Trees, Graphs, Dynamic Programming, Neural Networks, Regression).
- **Topic Mastery Meters**: Visual percentage indicators with color-coded competency bands (Mastered $\ge 80\%$, In Progress $50-79\%$, Needs Remediation $< 50\%$).
- **Interactive Concept Knowledge Graph**: Real concept prerequisite dependency flow with interactive node inspection.
- **Formative Micro-Quiz Modal**: Interactive 3-question adaptive quiz validation that updates student topic mastery in real time upon submission.
- **Multilingual Remedial Hub**: Targeted video and interactive doc remediation in both **English and Hindi**.
- **Teacher Classroom Overview**: Aggregated difficulty ratings, class average mastery, and remediation counts.

### PS2: Formative Subjective Grading Module
- **Faculty Assessment Dashboard**: Active assessment list with due dates, maximum marks, and course associations.
- **Assessment & Rubric Architect Modal**: Create subjective assessments with custom questions, faculty benchmark reference answers, and multi-criterion rubrics (Technical Accuracy, Conceptual Depth, Edge Cases, Clarity).
- **Student Submission Upload Portal**: Text editor and file input supporting `.txt` and `.pdf` formats.
- **Evaluation Results Table**: Status tracking across `Pending`, `AI Evaluated`, and `Faculty Moderated`.
- **Evaluation Review Drawer**: Breakdown of scores by rubric criteria, AI diagnostic strengths, and constructive suggestions.
- **Faculty Moderation Modal**: Human-in-the-loop score override with required faculty audit notes and permanent audit trail.

### PS3: Early Dropout Prediction & Retention Copilot
- **Institution Risk Overview**: Cohort risk breakdown across High, Medium, and Low risk tiers with average retention index.
- **Student Risk Table**: Sortable and filterable by risk level, attendance %, and CGPA.
- **Explainability Panel (SHAP-Style)**: Individual student factor impacts (Attendance dips, late LMS engagement, low formative quiz scores).
- **Time-Series Risk Trajectory Chart**: Interactive Recharts progression curve across academic milestones.
- **Batch CSV Ingestion Modal**: Drag-and-drop CSV parser with sample template download and instant cohort updates.
- **Counselor Retention Task Queue**: Actionable intervention scheduler with one-click status advancement (`planned` $\to$ `in_progress` $\to$ `completed`).

### Unified 360° Student Profile
- Accessible at `/students/[id]`, uniting core demographics, PS1 adaptive topic masteries, PS2 subjective grading history, and PS3 retention risk factors using the shared stable identifier `student_id`.

---

## 2. Directory Structure

```
masedar chek bp/
├── p1.md                           # Phase 1 Specification Prompt
├── README.md                       # Complete Documentation & Completion Report
├── .env.example                    # Global environment configuration template
├── backend/
│   ├── .env.example                # Backend environment configuration
│   ├── requirements.txt            # Python dependencies
│   ├── main.py                     # FastAPI application & router mounting
│   ├── test_api.py                 # Automated backend test suite
│   └── app/
│       ├── config.py               # Pydantic environment settings
│       ├── database.py             # SQLAlchemy session & SQLite/PostgreSQL engine
│       ├── seed_data.py            # Synthetic dataset seeding STU001 - STU010
│       ├── models/
│       │   ├── __init__.py
│       │   └── entities.py         # SQLAlchemy models for all 3 modules
│       ├── schemas/
│       │   ├── __init__.py
│       │   ├── common.py           # Standardized APIResponse envelope
│       │   └── entities.py         # Typed Pydantic request/response schemas
│       └── routers/
│           ├── __init__.py
│           ├── health.py           # GET /api/health
│           ├── students.py         # Shared student CRUD & 360° profile
│           ├── users.py            # Demo roles & active persona switcher
│           ├── ps1_router.py       # PS1 Adaptive Learning endpoints
│           ├── ps2_router.py       # PS2 Subjective Grading & Moderation
│           └── ps3_router.py       # PS3 Dropout Risk & Interventions
└── frontend/
    ├── package.json                # Next.js 14, React 18, Tailwind, Lucide, Recharts
    ├── tsconfig.json               # TypeScript compiler config
    ├── tailwind.config.ts          # Tailwind CSS theme configuration
    ├── postcss.config.js           # PostCSS setup
    ├── next.config.mjs             # Next.js configuration
    ├── .env.example                # Frontend environment template
    ├── .env.local                  # Local frontend environment
    └── src/
        ├── app/
        │   ├── layout.tsx          # Root layout with Navbar & Sidebar
        │   ├── page.tsx            # Main Integrated Executive Dashboard
        │   ├── globals.css         # Tailwind global styles
        │   ├── ps1-adaptive/
        │   │   └── page.tsx        # PS1 Adaptive Learning Module Page
        │   ├── ps2-grading/
        │   │   └── page.tsx        # PS2 Subjective Grading Module Page
        │   ├── ps3-dropout/
        │   │   └── page.tsx        # PS3 Retention Risk Module Page
        │   └── students/
        │       ├── page.tsx        # Shared Student Directory
        │       └── [id]/
        │           └── page.tsx    # Unified 360° Cross-Module Student Profile
        ├── components/
        │   ├── Navbar.tsx          # Branding & module status indicators
        │   ├── Sidebar.tsx         # Integrated sidebar navigation
        │   ├── RoleSwitcher.tsx    # Dynamic demo persona switcher
        │   ├── StatusBadge.tsx     # Standardized color-coded status badges
        │   ├── KnowledgeGraph.tsx  # Concept node-link dependency visualizer
        │   ├── QuizModal.tsx       # PS1 Formative quiz runner
        │   ├── RubricEditorModal.tsx # PS2 Rubric & assessment designer
        │   ├── ModerationModal.tsx # PS2 Human-in-the-loop score override
        │   ├── CsvUploadModal.tsx  # PS3 CSV batch student ingestion
        │   └── InterventionModal.tsx # PS3 Counselor retention task scheduler
        └── lib/
            ├── api.ts              # Typed client API integration
            ├── types.ts            # Shared TypeScript interfaces
            └── utils.ts            # Tailwind class merger
```

---

## 3. Database Tables and Relationships

All tables reside within a single database and enforce relational integrity via foreign keys:

| Table | Primary Key | Foreign Keys | Key Columns |
|---|---|---|---|
| `students` | `student_id` (VARCHAR) | — | `name`, `email`, `department`, `semester`, `cgpa`, `attendance_pct`, `status` |
| `users` | `user_id` | `student_id` $\to$ `students.student_id` | `username`, `full_name`, `email`, `role` |
| `courses` | `course_id` | — | `code`, `title`, `department`, `credits`, `instructor_name` |
| `topics` | `topic_id` | `course_id` $\to$ `courses.course_id` | `name`, `difficulty_level`, `prerequisites`, `concept_nodes` |
| `learning_progress` | `progress_id` | `student_id` $\to$ `students.student_id`, `topic_id` $\to$ `topics.topic_id` | `mastery_score`, `status`, `weak_concepts`, `quiz_attempts_count` |
| `remedial_resources` | `resource_id` | `topic_id` $\to$ `topics.topic_id` | `title`, `resource_type`, `language`, `estimated_minutes`, `url` |
| `assessments` | `assessment_id` | `course_id` $\to$ `courses.course_id` | `title`, `total_marks`, `rubric`, `questions` |
| `submissions` | `submission_id` | `assessment_id` $\to$ `assessments.assessment_id`, `student_id` $\to$ `students.student_id` | `file_name`, `submitted_text`, `status` |
| `evaluations` | `evaluation_id` | `submission_id` $\to$ `submissions.submission_id`, `student_id` $\to$ `students.student_id` | `total_score`, `rubric_breakdown`, `ai_feedback`, `moderator_override_score`, `is_moderated` |
| `risk_predictions` | `prediction_id` | `student_id` $\to$ `students.student_id` | `risk_score`, `risk_level`, `confidence`, `primary_factors`, `historical_trend` |
| `activity_snapshots` | `snapshot_id` | `student_id` $\to$ `students.student_id` | `lms_logins`, `forum_posts`, `quiz_attempts`, `assignment_delays` |
| `interventions` | `intervention_id` | `student_id` $\to$ `students.student_id` | `counselor_name`, `title`, `intervention_type`, `priority`, `status`, `notes` |

---

## 4. Available REST API Endpoints

All endpoints return a standardized JSON envelope:
```json
{
  "success": true,
  "module": "ps1",
  "student_id": "STU001",
  "data": {},
  "message": "Operation completed"
}
```

### System & Roles
- `GET /api/health` — System uptime and database connectivity check.
- `GET /api/users/current` — Active demo user session.
- `GET /api/users/roles` — Available demo personas.
- `POST /api/users/switch-role` — Switch active demo role.

### Shared Students Core
- `GET /api/students` — List students with department and status filters.
- `GET /api/students/{student_id}` — Unified 360° profile uniting PS1, PS2, and PS3.
- `POST /api/students` — Register a student into the unified model.

### PS1: Adaptive Learning
- `GET /api/ps1/topics` — Curriculum topics and concept graphs.
- `GET /api/ps1/progress/{student_id}` — Student topic mastery and remedial recommendations.
- `GET /api/ps1/quiz/{topic_id}` — Formative quiz questions for a concept.
- `POST /api/ps1/quiz/submit` — Submit quiz answers, recompute mastery score, and update records.
- `GET /api/ps1/classroom-overview` — Classroom-level aggregated difficulty analytics.

### PS2: Subjective Grading
- `GET /api/ps2/assessments` — List active assessments and rubrics.
- `GET /api/ps2/assessments/{assessment_id}` — Assessment details and scoring criteria.
- `POST /api/ps2/assessments` — Create assessment with rubric criteria and reference answers.
- `GET /api/ps2/submissions` — List submissions with evaluation status.
- `POST /api/ps2/submissions` — Submit subjective student text answer.
- `POST /api/ps2/submissions/upload-file` — Upload document (`.txt`, `.pdf`).
- `POST /api/ps2/evaluate/{submission_id}` — Trigger automated rubric-based grading assistant.
- `GET /api/ps2/evaluations/{submission_id}` — Get rubric score breakdown and AI feedback.
- `POST /api/ps2/evaluations/{evaluation_id}/override` — Apply faculty moderation score override with notes.

### PS3: Dropout Prediction & Retention
- `GET /api/ps3/risk-overview` — Cohort risk breakdown and key drivers.
- `GET /api/ps3/students` — Student risk table (sortable by score, attendance, or CGPA).
- `GET /api/ps3/explainability/{student_id}` — Explainability drivers and risk progression curve.
- `POST /api/ps3/upload-csv` — Batch ingest synthetic student academic CSV.
- `GET /api/ps3/interventions` — Counselor retention intervention task list.
- `POST /api/ps3/interventions` — Schedule new counselor intervention.
- `PATCH /api/ps3/interventions/{intervention_id}` — Advance intervention status (`planned`, `in_progress`, `completed`).

---

## 5. Exact Commands to Run

### 1. Start Backend (Terminal 1)
```powershell
# In project root:
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\python backend\main.py
```
Backend will start on **`http://localhost:8000`**.  
Interactive Swagger REST Docs available at **`http://localhost:8000/docs`**.

### 2. Start Frontend (Terminal 2)
```powershell
# In project root:
npm --prefix frontend run dev
```
Frontend will start on **`http://localhost:3000`**.

### 3. Run Backend Automated Test Suite
```powershell
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\python backend\test_api.py
```

---

## 6. Environment Variables Required

### Root `.env.example`
```env
BACKEND_PORT=8000
DATABASE_URL=sqlite:///./educore.db
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend `backend/.env.example`
```env
APP_ENV=development
PORT=8000
DATABASE_URL=sqlite:///./educore.db
# For Supabase PostgreSQL production:
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Frontend `frontend/.env.example`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 7. Features Tested and Results

| Test Category | Test Case | Status |
|---|---|---|
| Health Check | `GET /api/health` returns healthy database status | **PASSED** |
| Shared Identity | 10 students seeded with unique, stable `student_id` | **PASSED** |
| 360° Profile | `GET /api/students/STU001` aggregates PS1, PS2, and PS3 data | **PASSED** |
| Demo Role Switcher | Persona switches seamlessly between Student, Teacher, Counselor, Admin | **PASSED** |
| PS1 Quiz Flow | `POST /api/ps1/quiz/submit` recomputes mastery and updates status | **PASSED** |
| PS2 Grading | `POST /api/ps2/evaluate/{id}` grades against rubrics with strengths/suggestions | **PASSED** |
| PS2 Moderation | `POST /api/ps2/evaluations/{id}/override` saves score override and notes | **PASSED** |
| PS3 Risk Model | `GET /api/ps3/risk-overview` calculates High/Med/Low risk breakdown | **PASSED** |
| PS3 Interventions | `POST /api/ps3/interventions` and `PATCH` status updates succeed | **PASSED** |
| Frontend Build | `npm run build` completes with 0 errors across all routes | **PASSED** |

---

## 8. Known Limitations & Planned for Phase 2

- **Adaptive Engine (PS1)**: Formative quiz scoring and concept graph dependencies are statically seeded; Phase 2 will incorporate real LLM-driven multilingual translation and generative knowledge graphs.
- **Subjective Grading (PS2)**: Grading simulation uses rubric heuristics; Phase 2 will connect Gemini/DeepSeek embeddings and semantic similarity evaluation for free-form responses.
- **Dropout Model (PS3)**: Risk scores are calibrated synthetic baseline heuristics; Phase 2 will load trained XGBoost/LightGBM ML models with true SHAP tree explainers.

---

## 9. Confirmation of Shared `student_id` Integration

All three modules strictly reference the same `student_id` key:
- **PS1 `learning_progress.student_id`** $\to$ `STU001` - `STU010`
- **PS2 `submissions.student_id` & `evaluations.student_id`** $\to$ `STU001` - `STU010`
- **PS3 `risk_predictions.student_id` & `interventions.student_id`** $\to$ `STU001` - `STU010`

No duplicate student registries exist anywhere in the application.

