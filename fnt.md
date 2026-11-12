# EDUCORE AI — COMPLETE FRONTEND REDESIGN
## Senior UI/UX Engineer + Creative Director + Senior React Developer

You are a senior product designer and frontend engineer responsible for transforming EDUCORE AI into a polished, premium, production-quality education technology platform.

The current frontend looks poor and does not communicate the quality or capabilities of the underlying system.

Your task is to redesign the ENTIRE FRONTEND EXPERIENCE.

This is not a landing-page-only redesign. EDUCORE AI is a multi-role academic management application with three integrated AI systems.

Do not create a generic dashboard template. Design a cohesive, distinctive product experience.

---

# 1. PRODUCT IDENTITY

Product: EDUCORE AI

Tagline: Intelligent Student Success & Academic Management System.

Core modules:

PS1 — Adaptive Learning
- AI-powered personalized learning.
- Adaptive quizzes and difficulty adjustment.
- Concept mastery and knowledge graph.
- Multilingual learning (Kannada, Hindi, English).
- Curriculum-grounded remediation.
- Offline learning support.

PS2 — Intelligent Assessment
- Subjective answer evaluation.
- Semantic similarity and rubric-based grading.
- PDF/image uploads and OCR inspection.
- Concept-wise feedback.
- Faculty moderation and score overrides.
- Grading history and audit logs.

PS3 — Student Retention Intelligence
- Dropout risk prediction.
- SHAP explainability.
- Longitudinal risk progression.
- Institutional risk heatmaps.
- Counselor intervention management.
- Student performance analytics.

The platform must make these three modules feel like one connected ecosystem.

Shared student identity and student_id are essential.

---

# 2. FIRST: AUDIT THE EXISTING PROJECT

Before changing code:

1. Inspect the entire frontend directory.
2. Identify the existing routes, components, layouts, charts, styles and assets.
3. Inspect backend API endpoints and response structures.
4. Identify which features already work.
5. Identify existing navigation and role-based experiences.
6. Reuse working API integrations and business logic.
7. Identify broken, duplicated, inconsistent or unfinished UI.

Do not replace working backend functionality.

Do not invent API endpoints or fake successful operations.

Do not remove features simply because the existing interface is poorly designed.

The redesign must work with the actual existing application.

---

# 3. ART DIRECTION

Chosen style: NEO-FUTURIST + EDITORIAL MINIMAL.

The interface should feel like a premium modern SaaS product.

Visual inspiration:
- Linear: clean navigation, spacing and interaction quality.
- Vercel: typography and restrained visual hierarchy.
- Stripe: polished data presentation.
- Notion: clarity and usability.
- Modern education analytics products: informative dashboards and meaningful visualizations.

Do not directly copy any reference product.

## Color system

Create a cohesive dark/light-capable design system.

Default appearance: sophisticated light interface.

Palette:
- Background: soft cool off-white.
- Main surfaces: pure white.
- Primary text: deep navy/charcoal.
- Secondary text: muted slate.
- Primary accent: restrained electric blue/cyan.
- Success: muted green.
- Warning: amber.
- Danger: restrained red.
- Borders: subtle neutral grey.

Use semantic CSS variables in src/styles.css.

Do not hardcode colors throughout individual components.

Avoid:
- Excessive gradients.
- Purple/pink AI-themed gradients.
- Excessive glowing effects.
- Random colorful cards.
- Overuse of glassmorphism.
- Giant rounded cards everywhere.
- Excessive shadows.
- Emoji as interface icons.

Use Lucide icons consistently.

Typography:
- Modern sans-serif for interface.
- Strong, readable headings.
- Clear numerical typography for metrics.
- Consistent text hierarchy.

Spacing:
- Consistent spacing scale.
- Comfortable dashboard density.
- Proper alignment.
- Responsive layouts.

---

# 4. GLOBAL APPLICATION SHELL

Create a professional application shell.

## Sidebar

Design a refined collapsible sidebar.

Top:
- EDUCORE AI logo and wordmark.
- Organization / institution selector.

Navigation:

OVERVIEW
- Dashboard

LEARNING
- Adaptive Learning
- Knowledge Graph
- Learning Progress

ASSESSMENT
- Assessment Workspace
- Grading Results
- OCR Inspector
- Moderation

STUDENT SUCCESS
- Dropout Analytics
- Risk Heatmap
- Retention Copilot

MANAGEMENT
- Student Directory
- Reports
- Settings

Important:
Only show navigation items relevant to the logged-in demo role.

Bottom:
- User profile.
- Role indicator.
- Settings.
- Collapse control.

## Top navigation

Include:
- Breadcrumbs.
- Current page title.
- Search.
- Notification indicator.
- Help.
- User avatar and role menu.

Use a consistent header across application pages.

---

# 5. ROLE-BASED EXPERIENCES

The interface must support the existing demo roles:

1. Student
2. Teacher
3. Faculty
4. Counselor
5. Admin

Each role must have an appropriate dashboard and permissions.

Do not merely change the dashboard title.

### Student dashboard

Show:
- Welcome section.
- Overall learning progress.
- Subject mastery.
- Upcoming assessments.
- Recent quiz performance.
- Recommended learning activities.
- Weak concepts.
- Learning streak or activity history.
- Continue learning CTA.

A student should immediately understand:
What should I learn next?

### Teacher dashboard

Show:
- Classroom overview.
- Student performance distribution.
- Class mastery levels.
- Weakest concepts.
- Assessment activity.
- Students needing attention.
- Recommended remedial actions.

### Faculty dashboard

Show:
- Assessment workspace.
- Submission queue.
- AI grading progress.
- Pending moderation.
- Average assessment scores.
- OCR review warnings.
- Recent grading activity.

### Counselor dashboard

Show:
- Institution retention overview.
- High/medium/low risk students.
- Risk distribution.
- Students requiring intervention.
- Pending counselor tasks.
- Overdue interventions.
- Risk progression.

### Admin dashboard

Show:
- Institution-wide overview.
- Total students.
- Learning activity.
- Assessment activity.
- Retention analytics.
- Role and system management.
- Module health.

---

# 6. PS1 — ADAPTIVE LEARNING UI

This should feel like a modern interactive learning environment, not a standard admin form.

## Learning dashboard

Create:
- Subject cards.
- Mastery progress.
- Learning recommendations.
- Recent attempts.
- Continue learning section.
- Weak concept alerts.

## Interactive quiz

Design an immersive quiz experience.

Include:
- Question number and progress.
- Question content.
- Answer choices.
- Submit answer.
- Explanation after submission.
- Difficulty indicator.
- Next question.
- Adaptive difficulty feedback.

Avoid unnecessary distractions.

## Knowledge graph

Build an attractive interactive concept visualization.

Include:
- Connected concept nodes.
- Prerequisite relationships.
- Mastery-based node states.
- Zoom and pan.
- Concept selection.
- Concept detail drawer.
- Start remedial quiz action.

Use the actual existing knowledge graph data.

## Remediation experience

Show:
- Identified weak concept.
- Explanation.
- Curriculum source and page reference.
- Recommended practice questions.
- TTS playback.
- Language selector.

## Multilingual voice

Make voice controls intuitive:
- Kannada.
- Hindi.
- English.
- Microphone interaction.
- Listening state.
- Transcription preview.
- Speech playback controls.

Clearly communicate browser or device voice limitations.

---

# 7. PS2 — INTELLIGENT ASSESSMENT UI

Build a professional faculty grading workspace.

## Assessment workspace

Include:
- Create assessment.
- Upload answer key.
- Configure rubric.
- Maximum marks.
- Submission upload.
- Submission list.
- Evaluation status.

## Grading results

Design a detailed grading view.

Show:
- Student answer.
- AI-awarded marks.
- Maximum marks.
- Criterion-wise scores.
- Semantic similarity.
- Supporting evidence.
- Missing concepts.
- Incorrect assertions.
- AI grading rationale.

Use visual score breakdowns.

Do not imply semantic similarity is the same as grading accuracy.

## OCR inspector

Include:
- Document preview.
- Extracted text.
- Page navigation.
- OCR confidence.
- Low-confidence warning.
- Manual review status.

## Faculty moderation

Show:
- Original AI score.
- Human-adjusted score.
- Difference.
- Reviewer identity.
- Moderation notes.
- Timestamp.
- Audit history.

Make score overrides explicit and traceable.

---

# 8. PS3 — RETENTION INTELLIGENCE UI

This is a major presentation feature. Make it visually impressive while keeping it understandable.

## Retention overview

Display:
- Total students.
- High-risk students.
- Medium-risk students.
- Low-risk students.
- Average predicted risk.
- Pending interventions.

## Risk heatmap

Build a real interactive 3×3 risk matrix.

Axes:
- Attendance.
- CGPA.

Each cell:
- Student count.
- Average predicted risk.
- Click to inspect students in that category.

Use the actual API data.

## Student risk profile

Include:
- Student information.
- Current risk probability.
- Risk category.
- Longitudinal risk chart.
- Attendance trend.
- Grade trend.
- LMS engagement trend.
- Top SHAP risk factors.
- Protective factors.
- Non-causal explanation disclaimer.

Make the distinction between risk prediction and certainty clear.

## SHAP visualization

Use a clear horizontal contribution chart.

- Positive contribution: risk increasing.
- Negative contribution: risk reducing.
- Show actual feature values.
- Show model baseline and predicted probability.
- Explain the result in simple language.

## Retention Copilot

Create a task-oriented counselor workspace.

Include:
- Suggested interventions.
- Priority.
- Assigned staff.
- Due date.
- Status.
- Progress notes.
- Resolve/dismiss actions.

The counselor remains in control.

Do not imply that recommendations are guaranteed to prevent dropout.

---

# 9. SHARED STUDENT 360° PROFILE

This is the most important integration screen.

Create a polished student detail page accessible from the three modules.

Use the actual shared student_id.

Organize into tabs:

1. Overview
2. Learning
3. Assessments
4. Retention
5. Activity History

Overview:
- Student details.
- Overall learning mastery.
- Recent assessment results.
- Current risk level.
- Important alerts.
- Recommended actions.

Learning:
- Subject progress.
- Topic mastery.
- Quiz history.
- Weak concepts.

Assessments:
- Assessment history.
- Scores.
- Grading feedback.
- Moderation status.

Retention:
- Risk progression.
- SHAP factors.
- Attendance and engagement.
- Counselor interventions.

Activity:
- Chronological student activity.

This page should demonstrate that PS1, PS2 and PS3 are genuinely integrated.

---

# 10. INTERACTION AND MOTION

The application should feel polished and responsive.

Implement:
- Smooth page transitions.
- Subtle hover states.
- Animated metric counters where appropriate.
- Chart entrance animations.
- Sidebar transitions.
- Skeleton loading states.
- Toast notifications.
- Dialogs and confirmation states.
- Empty states.
- Error states.
- Loading states.

Use IntersectionObserver for suitable entrance animations.

Respect prefers-reduced-motion.

Avoid excessive animation.

Every visible button must perform a real action.

No decorative buttons that do nothing.

---

# 11. RESPONSIVE DESIGN

Desktop:
- Optimized dashboard layout.
- Collapsible sidebar.
- Multi-column analytics.

Tablet:
- Responsive grid.
- Compact navigation.

Mobile:
- Single-column layouts.
- Mobile navigation drawer or bottom navigation where appropriate.
- Responsive charts.
- Readable tables or card-based alternatives.
- Touch-friendly controls.

No horizontal overflow.

---

# 12. TECHNICAL REQUIREMENTS

Existing stack:
- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- FastAPI backend.

Preserve the existing versions and architecture.

Use existing dependencies where possible.

Only introduce additional libraries when genuinely necessary.

Recommended:
- Lucide React for icons.
- Recharts for charts.
- Framer Motion only if already available or justified.
- Existing UI component library if present.

Use reusable components:
- AppSidebar
- AppHeader
- PageHeader
- MetricCard
- ChartCard
- DataTable
- StatusBadge
- EmptyState
- LoadingState
- ErrorState
- StudentProfile
- RiskIndicator

Use semantic design tokens in src/styles.css.

Keep API calls and UI components separated.

Use proper TypeScript types.

Do not use `any` unnecessarily.

Do not hardcode demonstration values where real API data is available.

If data is unavailable, show an honest empty state rather than fabricated metrics.

---

# 13. QUALITY CONTROL

Before completion:

1. Test every existing route.
2. Test all five demo roles.
3. Verify role-based navigation.
4. Verify all three modules.
5. Verify student 360 profile.
6. Verify charts render correctly.
7. Verify forms and dialogs.
8. Verify API integration.
9. Verify loading and error states.
10. Test responsive layouts.
11. Run TypeScript checks.
12. Run the production build.

Do not break any existing backend functionality.

Do not modify ML models, grading engines, database schemas or business logic as part of this frontend redesign.

---

# 14. FINAL VISUAL QUALITY BAR

The final application must look like a finished commercial SaaS product.

It should have:
- A recognizable visual identity.
- Consistent spacing.
- Beautiful typography.
- Strong visual hierarchy.
- Excellent dashboard composition.
- Professional data visualization.
- Thoughtful empty/loading/error states.
- Consistent navigation.
- Clear role-based experiences.
- Polished interactions.

Avoid the typical AI-generated dashboard appearance.

Do not simply put random statistics into colorful cards.

Use whitespace, typography, hierarchy and meaningful data visualizations to make the application look premium.

The first screen must immediately communicate that EDUCORE AI is an intelligent student-success platform.

---

# 15. EXECUTION STRATEGY

Work in this order:

1. Audit existing frontend and backend contracts.
2. Establish design tokens and application shell.
3. Redesign role-based dashboards.
4. Redesign PS1.
5. Redesign PS2.
6. Redesign PS3.
7. Build the integrated student 360 profile.
8. Polish responsive layouts and interactions.
9. Run complete regression and production build.

Implement the entire redesign in the existing repository.

Do not stop after creating a design proposal or mockup.

Do not create a separate disconnected frontend.

Do not ask for confirmation between steps.

At the end, provide:

- Summary of redesign.
- Files/components changed.
- Routes redesigned.
- Features preserved.
- Any backend integration issues.
- Test results.
- Production build result.
- Screenshots of the key pages if available.

**FINAL INSTRUCTION: Prioritize visual quality, usability and consistency. The current frontend is not acceptable. Transform it into a genuinely polished EDUCORE AI product without breaking its existing functionality.**