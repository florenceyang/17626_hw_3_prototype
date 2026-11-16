# Online Intake Form Prototype Constitution

## Core Principles

### I. Testable Acceptance Scenarios

- Every user story in a spec MUST have acceptance scenarios written as
  Given / When / Then.
- Each scenario MUST name an observable outcome in the frontend: visible text, a screen
  state, a stored mock record, or a flag shown in the mock staff queue.
- Words that cannot be checked, such as "easy", "fast" or "user-friendly", MUST NOT appear
  in a scenario unless they are given a measurable threshold.
- Each scenario MUST map to at least one test, automated or a scripted manual check, and
  that test MUST cite the scenario it covers.

Rationale: a prototype is only useful for validating requirements if each requirement can
be shown to pass or fail.

### II. Requirement Traceability

- Requirement and goal IDs MUST be kept exactly as issued. This covers goal-model IDs
  (G-###), conflict and overlap IDs (K#, O#), and spec IDs (FR-###, SC-###).
- IDs MUST NOT be renumbered, reused, or silently dropped.
- A merged or removed requirement keeps its ID and gets a recorded reason, as in
  `docs/v1_goal_model_decisions.md`.
- Every functional requirement in a spec MUST cite the goal IDs it satisfies.
- Every task MUST cite the requirement IDs it implements.
- Tests MUST cite the acceptance scenarios or requirement IDs they verify.

Rationale: the goal models are the source of truth, and graders and teammates must be able
to trace any screen back to a goal.

### III. Frontend-Only Code Location

- All generated application code, assets, and tests MUST live under `frontend/`.
- `goal-models/`, `docs/`, `specs/`, and `.specify/` hold requirements artifacts only and
  MUST NOT contain application code.

Rationale: a single code root keeps requirements artifacts separate from the prototype and
makes reviews predictable.

### IV. No Authentication, Backend Services, or External APIs

- The prototype MUST NOT implement real authentication: no login, no sessions, no identity
  providers.
- Where a goal assumes an account, such as G-10 save and resume, G-142 status, or G-405
  login prompt, the behavior MUST be simulated in the frontend and clearly labeled as a mock.
- The prototype MUST NOT add servers, databases, serverless functions, or calls to
  third-party APIs.
- Persistence, document storage, and staff review MUST use in-browser mocks such as
  in-memory state or browser storage.

Rationale: the sprint validates the applicant-facing intake. Real accounts and services are
out of scope and would add privacy risk (K14, G-68).

## Prototype Constraints

- Scope is the sprint subset in `goal-models/v1_prototype_goal_model.py`: from starting the
  online form until the submission waits for staff review.
- Everything after submission, including staff work, is mocked.
- Phone intake is out of scope.
- Conflict resolutions recorded in `docs/v1_goal_model_decisions.md` MUST be followed. For
  example, K4 means terms are explained before the question, and K5 means safety wins over
  helper convenience.
- Unresolved conflicts (K13, K14) MUST be listed as open issues in any spec they affect.
- Values the applicant enters, such as dates and danger answers, MUST be shown as
  "Reported (unverified)" (G-30).
- No automated decisions are made about applicant outcomes (G-51, G-250).
- Any real or realistic personal data MUST NOT be committed. Use fictional fixtures only.

## Development Workflow

- Features follow the Spec Kit flow in order: specify, clarify, plan, tasks, analyze,
  implement.
- `/speckit-analyze` MUST report no unresolved traceability gaps before implementation
  begins. A gap is an FR without a goal ID, a task without an FR, or a scenario without a
  test.
- Changes are committed with descriptive messages and pushed to the shared GitHub
  repository so collaborators work from the same state.
- Reviews MUST check that changes comply with Principles I–IV.

## Governance

- This constitution supersedes conflicting guidance in specs, plans, and tasks.
- Amendments are made through `/speckit-constitution`, recorded in a commit, and announced
  to collaborators.
- Versioning follows semantic versioning:
  - MAJOR for removing or redefining a principle.
  - MINOR for adding a principle or section.
  - PATCH for wording fixes.
- Every plan's Constitution Check MUST evaluate Principles I–IV. A violation MUST be either
  fixed or justified in the plan's Complexity Tracking table.

**Version**: 1.0.0 | **Ratified**: 2026-11-15 | **Last Amended**: 2026-11-15
