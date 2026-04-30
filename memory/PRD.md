# EduQuest — Educational Platform PRD

## Original Problem Statement
Educational platform where teachers create their own courses, upload resources, schedule tasks/activities; students enroll, access materials, earn rewards / level up as they complete activities; teachers see and grade student submissions.

## User Personas
- **Teacher**: creates courses, uploads lessons/resources, builds quizzes/assignments, grades submissions.
- **Student**: enrolls in courses, consumes lessons/resources, submits assignments, takes quizzes, earns XP and badges, climbs leaderboard.

## User Choices
- Auth: JWT email/password (httpOnly cookie + Bearer fallback, bcrypt)
- Resources: files (PDF/image/video) + links + rich-text lessons
- Gamification: full — XP, levels, badges, leaderboard
- Activities: both assignments (file + text) and auto-graded quizzes
- No AI integration

## Architecture
- **Backend** FastAPI + MongoDB (motor). UUID ids. File storage = base64 in `files` collection (10MB cap).
- **Frontend** React 19 + Tailwind + Shadcn UI. Neo-brutalist design (Cabinet Grotesk + Work Sans, 2px black borders, hard offset shadows).
- Routes: `/api/auth/*`, `/api/courses/*`, `/api/courses/{id}/lessons|resources|activities|submissions`, `/api/activities/{id}/submit-assignment|submit-quiz`, `/api/submissions/{id}/grade`, `/api/files/*`, `/api/me/stats`, `/api/me/submissions`, `/api/leaderboard`.

## Gamification Formula
- Level = 1 + floor(xp / 100)
- Quiz XP: `xp_reward * percent`
- Assignment XP: `xp_reward * score/max_points` (awarded on grade)
- Auto-badges: first_enroll, first_submission, quiz_master (>=90%), level_5, level_10, three_courses

## Implemented (April 2026)
- Full auth (register/login/logout/me) with seeded admin teacher
- Course CRUD (teacher-owned) + enrollment (student)
- Lessons (rich text), Resources (link + file upload), Activities (assignment + quiz with multi-option questions)
- Student submissions (assignment w/ file+text, quiz with auto-grading)
- Teacher grading UI for assignments with feedback + XP award on grade
- Gamification: XP, level progress bar, badges gallery, leaderboard w/ podium top-3
- Student dashboard (bento grid: XP card, badges, enrolled stats, recent submissions)
- Teacher dashboard (stats + pending-to-grade queue)
- Landing page with marquee, feature cards, dual CTA (teacher / student)

## Backlog (P1)
- Rich text / markdown rendering for lessons (currently pre-wrap)
- Calendar view for upcoming due dates (shadcn calendar available)
- Quiz review screen showing correct/incorrect answers after submission
- Course announcements / discussion thread
- Email notifications (Resend) on grade + new assignment
- Avatar customization & profile edit

## Backlog (P2)
- Multi-teacher co-ownership
- Drag-and-drop reorder for lessons
- Rubric-based grading
- Class analytics (average score per activity)
- Certificate generation on course completion

## Test Credentials
- Teacher: admin@eduquest.com / admin123
- Students: create via `/register` (role=student)
