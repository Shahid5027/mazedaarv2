# EDUCORE AI — Demo Access & Role Login Guide

**Platform**: EDUCORE AI (CodeSpark 2026 Submission)  
**Login Portal URL**: `http://localhost:3000/login`  
**Authentication Standard**: JWT Bearer Tokens, Bcrypt Hashed Passwords, Role-Based Access Control  
**Date**: November 2026  

---

## 1. Quick One-Click Demo Access

On the login page (`/login`), click any role badge in the **"Demo Access (One-Click Testing)"** panel to automatically populate valid credentials, or use the verified accounts below. Both `@educore.demo` and standard institutional `@educore.edu` email aliases are seeded.

---

## 2. Seeded Demo Accounts Table

| Role | Demo Email Alias | Alternate Institutional Email | Demo Password | Default Redirect Route |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `student@educore.demo` | `student@educore.edu` | `DemoPass123!` | `/` (Main Student Dashboard) |
| **Teacher / Faculty** | `teacher@educore.demo` | `teacher@educore.edu` | `DemoPass123!` | `/` (Faculty Dashboard & PS2) |
| **Counselor** | `counselor@educore.demo` | `counselor@educore.edu` | `DemoPass123!` | `/ps3-dropout` (Retention Copilot) |
| **Dean / Administrator** | `dean@educore.demo` | `admin@educore.edu` | `DemoPass123!` | `/` (Executive Dean Analytics) |

---

## 3. Recommended Judge Evaluation Walkthroughs

### Walkthrough A: Student Experience (`student@educore.demo`)
1. Sign in with the Student credentials.
2. Observe the **clean, graph-free Student Dashboard**: enrolled courses, progress bars, pending assessment results, weak concepts diagnosed via quizzes, and upcoming academic tasks.
3. Click **"Adaptive Learning (PS1)"** or **"Launch Conversational Voice Tutor"**.
4. Select your preferred language: **Kannada (kn-IN)**, **Hindi (hi-IN)**, or **English (en-IN)**.
5. Click the microphone button and ask a subject question. Observe live transcription and the spoken audio response.

### Walkthrough B: Teacher / Faculty Experience (`teacher@educore.demo`)
1. Sign in with the Teacher credentials.
2. Review class performance analytics, topic mastery distributions, and students requiring remediation.
3. Open **"Assessment Grading (PS2)"**.
4. Test the **Split-View OCR Document Correction** interface; see extracted student text, fix OCR ambiguities, and submit for formative rubric grading.
5. View criterion-level scores and test the faculty moderation override.

### Walkthrough C: Counselor Experience (`counselor@educore.demo`)
1. Sign in with the Counselor credentials.
2. Access the **PS3 Dropout Risk Intelligence** dashboard.
3. Review the **Department × Semester Risk Heatmap Matrix** and student-level SHAP explainability factors.
4. Schedule an intervention task using the **Retention Copilot**.

### Walkthrough D: Dean / Academic Administrator Experience (`dean@educore.demo`)
1. Sign in with the Dean credentials.
2. Review institution-wide academic performance, department comparisons, and risk distributions.
3. Open the **Student Directory (`/students`)** and select any student (e.g., `STU001`) to view their complete **Student 360° Profile** integrating PS1, PS2, and PS3 data.
4. Verify the administrative attendance audit recalculation feature applying:
   $$\text{Attendance \%} = \left(\frac{\text{Present Days}}{\text{Total Working Days}}\right) \times 100$$
