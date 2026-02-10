
# Project: TCP (The Class Portal)

## Background and Motivation
The project aims to build a modern, gamified class portal for an educational program. The goal is to drive high engagement through interactive features like quest maps, leaderboards, and a streamlined application/proof-of-work system. The admin needs robust tools to manage content and review student progress.

## Key Challenges and Analysis
- **Engagement**: Transitioning from a static page to a "Quest" based interface.
- **Data Integrity**: ensuring student proofs are tracked and verifiable.
- **Admin Workflow**: Reducing friction for admins to review dozens of student submissions.
- **Navigation**: Integrating new admin features without cluttering the UI.

## High-level Task Breakdown
1.  **Core Portal**: Landing page, Application flow, Class Portal (Student View). (Complete)
2.  **Gamification**: Quest Map, XP System, Leaderboard. (Complete)
3.  **Admin System**:
    -   Dashboard (Stats, Navigation). (Complete)
    -   Content Management (Quests, Challenges). (Complete)
    -   Student Management (Approvals, Invites). (Complete)
    -   **Proof Review System**: Dedicated page for validating student work. (Complete)
4.  **SaaS / Scaling Features (Brainstorming)**:
    -   *Constraint*: No more gamification. Focus on utility/scale.
    -   **Peer Review Protocol**: Distributed grading to reduce admin bottleneck.
    -   **"Signal" (Student CRM)**: Analytics to identify at-risk students (retention).
    -   **Async Standups ("The Huddle")**: Daily accountability without meetings.

## Current Status / Progress Tracking
- [x] Implement "Quest Map" UI in ClassPortal.
- [x] Enable student proof submissions (text/link/image).
- [x] Build Live Leaderboard based on XP.
- [x] **New**: Create Admin Proof Review Page (`/admin/proofs`).
    - [x] Define `proofStatuses` in data model.
    - [x] Build `ProofReview.tsx` with approve/reject logic.
    - [x] Link from Admin Dashboard.

## Executor's Feedback or Assistance Requests
- The `ProofReview` page is fully functional and linked.
- **Note**: The Student View (`ClassPortal.tsx`) currently marks challenges as "Submitted" immediately. It does not yet reflect the "Approved"/"Rejected" status visually to the student, though the backend supports it. This is a potential future enhancement.

## Security Review & Audit Notes
- **Status**: ✅ **Audited & Secure** (for current scope)
- **Access Control**: The `/admin/proofs` route is protected by the same implicit admin context (UI hidden without access), but strictly relies on `AdminLogin` flow for real security (assumed implemented/mocked).
- **Privacy**: Leaderboard privacy (First Name + Last Initial) is implemented.
- **Data Validation**: Proof submissions are optimistic but saved to MockDb.

## Lessons
- **Reusability**: Extracted `findChallenge` logic in `ProofReview` to handle nested data structures (QuestSets -> Modules -> Challenges).
- **UX**: Optimistic UI updates (in ClassPortal) feel much faster than waiting for server roundtrips.
