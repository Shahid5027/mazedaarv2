# EDUCORE AI — FINAL HACKATHON WINNING-QUALITY TRANSFORMATION

You are operating as a senior full-stack engineer, AI/ML architect, UI/UX designer, QA engineer, and hackathon product strategist.

Your mission is to transform the EXISTING EDUCORE AI codebase into a polished, reliable, fully working, judge-ready product for CodeSpark 2026.

This is not a request to create another prototype, redesign only the landing page, or generate mock functionality.

You must inspect the entire existing repository, understand the current architecture, identify weaknesses, and IMPLEMENT the improvements directly.

## 1. PRODUCT VISION

EDUCORE AI is an integrated intelligent student success platform combining three problem statements:

- PS1: AI-Powered Multilingual Adaptive Learning & Automated Remediation.
- PS2: Automated Formative Assessment and Intelligent Subjective Grading.
- PS3: AI-Driven Early Dropout Prediction and Student Retention Copilot.

The central concept:

LEARN → EVALUATE → SUPPORT

All three modules must work together through a unified Student 360° profile and consistent student identity.

The platform must feel like one cohesive enterprise-grade educational product.

## 2. FIRST: COMPLETE CODEBASE AUDIT

Before modifying anything:

1. Inspect the complete frontend and backend.
2. Identify all existing routes, pages, components, APIs, database models, AI services, and integrations.
3. Identify broken workflows, runtime errors, incomplete buttons, dummy data, inconsistent API responses, and disconnected modules.
4. Identify existing functionality that must be preserved.
5. Check database configuration and actual persistence. Do not assume Supabase or PostgreSQL is active if the application actually uses SQLite.
6. Check authentication, roles, authorization, and data isolation.
7. Check frontend responsiveness and browser console errors.
8. Check backend logs and API failures.

Create `FINAL_AUDIT.md` with:
- Existing functionality.
- Broken functionality.
- Missing functionality.
- Critical bugs.
- Security and reliability issues.
- Prioritized implementation plan.

Do not stop after writing the audit. Continue implementing.

## 3. UI/UX — MAKE THIS LOOK LIKE A REAL PRODUCT

The UI must be exceptionally polished and consistent.

Design direction:
- Modern premium SaaS education platform.
- Clean, professional, sophisticated visual hierarchy.
- Consistent typography, spacing, colors, borders, shadows, and iconography.
- Smooth but restrained animations.
- Excellent charts, dashboards, data tables, cards, and empty states.
- Responsive desktop, tablet, and mobile layouts.
- Professional loading, error, success, and confirmation states.

Improve:
- Landing page.
- Authentication screens.
- Main dashboard.
- Sidebar and navigation.
- Student portal.
- Teacher portal.
- Counselor portal.
- Admin portal.
- PS1 learning experience.
- PS2 grading experience.
- PS3 retention dashboard.
- Student 360° profile.
- Settings and account screens.

Do not make every page look identical. Each module should have a distinct visual identity while retaining a shared design system.

Every visible control must work.

No decorative buttons that do nothing.
No dead navigation links.
No fake progress indicators.
No broken charts.
No overflowing layouts.
No placeholder text in the final experience.

## 4. PS1 — ADAPTIVE LEARNING

Verify and improve:

- Student learning dashboard.
- Subject and topic selection.
- Adaptive quizzes.
- Difficulty adjustment based on mastery.
- Concept-wise mastery tracking.
- Interactive knowledge graph.
- Weak-concept identification.
- Automated remedial suggestions.
- Multilingual interface and voice input/output.
- Kannada and Hindi speech demonstrations.
- Teacher classroom analytics.
- Offline content caching and quiz synchronization.

Ensure that:
- Quiz submissions update actual mastery records.
- Difficulty changes follow the implemented mastery rules.
- Knowledge graph changes reflect real student progress.
- Remediation recommendations relate to identified weak concepts.
- Curriculum answers show available source and page references.
- Voice features have clear fallbacks when browser language support is unavailable.
- Offline functionality does not falsely claim successful synchronization.

Measure actual user-facing response times. Do not present backend processing averages as complete end-to-end latency.

## 5. PS2 — INTELLIGENT SUBJECTIVE GRADING

This module is extremely important.

Verify and fix the entire assessment workflow:

1. Faculty creates an assessment.
2. Faculty uploads answer key and rubric.
3. Faculty uploads student submissions.
4. System extracts digital or scanned content.
5. OCR processes supported scanned documents.
6. Grading engine evaluates answers.
7. Concept-wise scores and evidence are generated.
8. Students receive constructive feedback.
9. Faculty reviews and moderates scores.
10. Overrides are recorded in audit logs.

Critical requirements:

- Fix all React rendering errors involving object-valued feedback.
- Render correct concepts, missing concepts, incorrect concepts, and suggestions separately.
- Use actual semantic similarity where the configured embedding model is available.
- Do not award marks merely because trigger words appear.
- Respect criterion weights and maximum marks.
- Prevent scores from exceeding rubric limits.
- Show evidence supporting marks awarded.
- Clearly distinguish automatic grading from faculty-approved grading.
- Preserve original marks after faculty overrides.
- Display OCR confidence and require review when extraction is uncertain.
- Provide meaningful empty, loading, error, and success states.

Benchmark grading against human-graded answers.

Investigate why the reported Phase 3 MAE increased to 5.02/30 compared with the previous 2.84/30 benchmark. Do not hide this regression or fabricate better results.

Improve the grading logic only when justified by measurable evaluation.

## 6. PS3 — EARLY DROPOUT PREDICTION

Verify and improve:

- Institution-wide analytics.
- Risk distribution.
- Student risk heatmap.
- Individual student profiles.
- Longitudinal risk trends.
- Explainable AI using SHAP where implemented.
- Retention intervention recommendations.
- Counselor task assignment.
- Deadlines, status updates, notes, and dismissal.
- Role-based data access.

Requirements:

- Risk scores must originate from the actual model or explicitly identified fallback logic.
- Explain why a student is flagged.
- Show relevant contributing factors.
- Never imply that correlation proves causation.
- Never present synthetic-data evaluation as real institutional validation.
- Keep counselor decisions under human control.
- Ensure role restrictions are enforced by the backend, not just hidden in the UI.

## 7. STUDENT 360° — THE CORE DIFFERENTIATOR

Make this the central integration feature.

A student profile must bring together:

- Student identity.
- Learning progress.
- Topic mastery.
- Assessment performance.
- Grading feedback.
- Attendance and engagement data.
- Dropout-risk assessment.
- Explainability.
- Intervention history.

All modules must use the same student identifier and consistent records.

Demonstrate the complete journey:

A student struggles with a concept in PS1.

Their learning progress and assessment results become visible in Student 360°.

PS3 displays relevant risk indicators when supported by the actual model and available data.

A counselor can review the student and assign an intervention.

A later update must be reflected in the profile.

Do not invent automatic causal relationships between modules.

## 8. FUNCTIONALITY AND INTEGRATION

Test every important workflow from the actual user interface.

Verify:
- Authentication and logout.
- Role-specific dashboards.
- Navigation.
- Form validation.
- File upload and processing.
- API requests and responses.
- Database persistence.
- Student identity consistency.
- Charts and filters.
- Search and pagination where present.
- Score moderation.
- Intervention management.
- Exports.
- Error recovery.

Fix inconsistent API contracts and TypeScript errors.

Do not replace real backend functionality with hardcoded frontend examples.

Where demo data is necessary, clearly label it as demo or synthetic data.

## 9. PERFORMANCE, SECURITY AND RELIABILITY

Check:
- API response handling.
- Unhandled exceptions.
- Duplicate React keys.
- Hydration errors.
- Excessive rerenders.
- Broken image and asset paths.
- Slow page loading.
- Database persistence.
- File validation.
- Authentication and authorization.
- Sensitive student data exposure.
- Environment variable handling.

Do not expose API keys or secrets.

Do not silently weaken security to make the demo work.

## 10. JUDGE-READY DEMONSTRATION

Create a complete, reliable demonstration journey.

Prepare:
- A demo administrator.
- A demo teacher.
- A demo student.
- A demo counselor.

Use clearly identified synthetic records.

The demonstration should showcase:

1. Teacher creates or selects a learning activity.
2. Student completes an adaptive quiz.
3. Mastery and knowledge graph update.
4. Student submits an assessment.
5. PS2 evaluates it and generates feedback.
6. Faculty moderates the result.
7. Student 360° reflects the updated records.
8. PS3 displays explainable risk information.
9. Counselor assigns an intervention.
10. Dashboard reflects the updated state.

All demo credentials must be documented safely. Never hardcode production credentials.

## 11. OFFICIAL DELIVERABLE VERIFICATION

Use the official CodeSpark problem statement requirements as the acceptance checklist.

PS1:
- Responsive multi-user prototype with student and teacher portals.
- Adaptive quiz with real-time knowledge graph/mastery updates.
- Voice-to-text and text-to-voice in at least two Indian languages.
- Teacher dashboard with classroom analytics and remedial suggestions.
- Measured latency report against the under-eight-second requirement.

PS2:
- Web application for answer keys, rubrics, and batch submissions.
- Evaluation against a human-graded baseline.
- Concept-wise scoring and constructive feedback.
- Faculty moderation with overrides and audit logs.

PS3:
- Institution retention dashboard and risk heatmaps.
- Individual risk curves and explainable diagnostics.
- Retention Copilot with intervention task lists.
- Evaluation report containing Precision, Recall, F1, and ROC-AUC.

For every requirement, record:
- Implemented.
- Tested.
- Demonstrated.
- Evidence or remaining limitation.

Do not mark a feature complete merely because a component or API exists.

## 12. IMPLEMENTATION RULES

These rules are mandatory:

1. Work inside the existing repository.
2. Do not rebuild the entire application from scratch.
3. Do not discard working features.
4. Do not introduce unnecessary dependencies.
5. Avoid unnecessary architectural migrations.
6. Do not fabricate AI capabilities, metrics, or test results.
7. Do not use hardcoded data as a substitute for functioning workflows.
8. Do not leave TODOs for critical functionality.
9. Do not spend time adding features that do not improve the official deliverables.
10. Prioritize stability and working demonstrations over feature quantity.

Implement in the smallest logical groups.

After each group:
- Run relevant backend tests.
- Run frontend type checks.
- Run production build.
- Fix regressions before continuing.

If an external service, API key, model download, or browser capability is unavailable, implement an honest fallback and document the limitation.

Do not claim a test passed unless you actually ran it.

## 13. FINAL ACCEPTANCE

The task is complete only when:

- The frontend starts.
- The backend starts.
- Production build succeeds.
- Critical workflows work through the UI.
- All three modules are connected.
- Student 360° reflects shared records.
- PS2 grading no longer crashes.
- Role restrictions work.
- No critical browser console errors remain.
- No critical backend errors remain.
- Official deliverables are mapped to test evidence.
- Setup and demo instructions are accurate.

Produce:

1. `FINAL_AUDIT.md`
2. `FINAL_IMPLEMENTATION_REPORT.md`
3. `OFFICIAL_DELIVERABLES_CHECKLIST.md`
4. `DEMO_GUIDE.md`
5. Updated README with exact setup commands.

In the final report, clearly separate:
- Implemented and tested.
- Implemented but not fully validated.
- Partially implemented.
- Not implemented.
- Known limitations.

## FINAL INSTRUCTION

Think like an engineering team preparing its product for a national hackathon final.

Do not optimize for the number of files changed or features added.

Optimize for:
- Reliability.
- Demonstrability.
- Technical credibility.
- Visual quality.
- Integration.
- Judge confidence.

Start with the audit, then execute the implementation. Do not stop at recommendations. Do not ask me for approval after every small change.

If a decision is necessary, choose the safest implementation that preserves existing functionality and meets the official requirements.

Your final objective: make EDUCORE AI a product that judges can actually use, test, understand, and trust.

# MANDATORY ADDITION — AUTHENTICATION, LOGIN SYSTEM & COMPLETE VISUAL ANALYTICS

These requirements are compulsory. Do not consider the project complete without them.

## 1. COMPLETE AUTHENTICATION SYSTEM

Implement a professional, fully functional authentication system.

### Login and registration
- Professional login page.
- Student registration.
- Teacher registration or administrator-controlled teacher accounts.
- Secure password storage.
- Password visibility toggle.
- Form validation.
- Forgot password and password reset flow.
- Logout.
- Session persistence.
- Protected routes.
- Authentication error handling.
- Loading and success states.

Use the existing authentication infrastructure if it is functional. If not, implement a secure solution compatible with the existing database architecture.

Never store plaintext passwords.

### Role-based access control

Implement four distinct roles:

**ADMIN**
- Manage users.
- Manage teachers, students and counselors.
- View institution-wide analytics.
- Manage academic records.
- Access all three modules.
- Manage system settings.

**TEACHER**
- View assigned classes.
- Manage learning activities.
- Create assessments and rubrics.
- Upload and evaluate submissions.
- Moderate AI-generated grades.
- View student learning progress.
- Access relevant student profiles.

**STUDENT**
- Access personal learning dashboard.
- Complete adaptive quizzes.
- View knowledge graph and mastery.
- Access assessment results.
- View feedback.
- View personal academic progress.

**COUNSELOR**
- View authorized student risk profiles.
- Access dropout-risk analytics.
- Review SHAP explanations.
- Create and assign intervention tasks.
- Update intervention status and notes.
- Track student progress.

### Security requirements
- Enforce permissions on the backend.
- Never rely exclusively on frontend route hiding.
- Prevent students from accessing other students' private records.
- Prevent unauthorized grade modifications.
- Validate session and role on protected API endpoints.
- Add logout and session-expiry handling.
- Use secure password hashing and safe session/token handling.
- Never expose credentials or secrets in frontend code.

### Demo accounts
Provide a safe, repeatable way to create demo users for all four roles.

Display demo credentials only in the development/demo environment.

Do not create an authentication bypass for production.

## 2. COMPLETE DASHBOARDS AND GRAPHS

All graphs must display actual application data or clearly labelled synthetic demo data.

Do not use decorative graphs with hardcoded random values.

### Admin dashboard
Include:
- Total students.
- Total teachers.
- Total classes.
- Total assessments.
- Institution-wide academic performance.
- Student risk distribution.
- Attendance trends.
- Learning progress trends.
- PS1, PS2 and PS3 activity overview.

### Teacher dashboard
Include:
- Class performance overview.
- Student mastery distribution.
- Topic-wise learning performance.
- Assessment score distribution.
- Submission status.
- Students requiring remediation.
- Weak-concept analytics.
- Learning progress over time.

### Student dashboard
Include:
- Overall learning progress.
- Topic-wise mastery graph.
- Quiz performance over time.
- Assessment performance.
- Strengths and weak concepts.
- Learning activity history.
- Personalized recommendations.

### Counselor dashboard
Include:
- Low, medium and high-risk student distribution.
- Institution risk heatmap.
- Risk trends over time.
- Student-level risk curves.
- Attendance and engagement trends.
- Intervention completion statistics.
- Pending counselor tasks.
- Students requiring immediate review.

## 3. GRAPH AND CHART REQUIREMENTS

Use the existing chart library where possible.

Every graph must:
- Have a meaningful title.
- Have correctly labelled axes.
- Display units where relevant.
- Support hover tooltips.
- Have useful legends.
- Handle empty datasets.
- Adapt to mobile screens.
- Support relevant filters.
- Display loading and error states.
- Use consistent visual styling.

Use appropriate visualizations:
- Line charts for progress and trends.
- Bar charts for performance comparisons.
- Pie or donut charts for distributions.
- Heatmaps for student risk.
- Radar charts only where meaningful.
- Interactive knowledge graphs for PS1 concept mastery.

Do not use charts just to fill dashboard space.

## 4. UNIFIED STUDENT PROFILE

Every student must have a consistent student ID.

The Student 360° page must integrate:

- Student details.
- Class and academic information.
- PS1 mastery and learning history.
- PS2 assessment scores and feedback.
- PS3 risk assessment and explanations.
- Attendance and engagement.
- Intervention history.

Display relevant charts and a chronological activity timeline.

Ensure data is retrieved from actual shared records.

## 5. LOGIN-TO-DASHBOARD USER EXPERIENCE

The complete user journey must work:

1. User opens the application.
2. User sees the login page.
3. User authenticates.
4. Backend verifies the identity and role.
5. User is redirected to the correct dashboard.
6. Navigation only displays permitted features.
7. User performs permitted actions.
8. Data is saved persistently.
9. Refreshing the browser preserves the authenticated session.
10. Logout ends the session.

Test every role independently.

## 6. VISUAL ACCEPTANCE TESTS

Test:
- Login and logout.
- Registration.
- Password reset flow.
- Protected routes.
- Unauthorized API access.
- Role-specific dashboards.
- All dashboard graphs.
- Graph filters and tooltips.
- Empty-state rendering.
- Student 360° integration.
- Mobile responsiveness.
- Session persistence.

No broken links, nonfunctional buttons, fake charts, inaccessible pages, or runtime errors.

## FINAL RULE

Authentication, authorization, dashboards, graphs, and data integration are core product requirements, not optional enhancements.

Implement and test them before declaring EDUCORE AI competition-ready.