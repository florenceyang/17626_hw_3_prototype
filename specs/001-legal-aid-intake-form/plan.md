# Implementation Plan: Legal Aid Intake Form

**Branch**: `001-legal-aid-intake-form` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-legal-aid-intake-form/spec.md`

## Summary

Build a phone-first, frontend-only prototype of the legal aid online intake form, rooted in goal
G-400. Applicants can:

- start without an account
- answer one plain-language question per screen, filtered by problem type, with deadline and
  danger questions first
- mark any answer "I'm not sure"
- upload documents with a simulated readability check
- submit to a confirmation screen whose callback promise follows the urgency and office-hours
  rules

A quick-exit button and the help contact appear on every screen. With a helper present, the
danger questions are answered privately. A mock staff list shows urgency, unsure answers,
missing documents, and unverified court dates. Mock accounts allow save, resume, and status.

The technical approach is a static React and TypeScript single-page app in `frontend/`:

- All decision logic is in pure, unit-tested rule functions.
- Questions and document rules are declared as data tagged with FR and goal IDs.
- Persistence is `localStorage` only.
- The acceptance scenarios are proven by Playwright tests named by scenario ID.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS or later (the local machine has Node 26)

**Primary Dependencies**:

- Runtime: React 19 and Vite (static build). No router or date library: the app uses hash
  routes and the built-in `Intl` API.
- Development: Vitest, React Testing Library, Playwright, and @axe-core/playwright.

**Storage**: browser `localStorage`, holding submitted requests and mock accounts. Anonymous
drafts stay in memory only. See [contracts/storage.md](./contracts/storage.md).

**Testing**: Vitest for unit and component tests, and Playwright for end-to-end tests. Test names
cite US#-AS# or FR-### IDs. Usability is checked manually (SC-001, SC-008).

**Target Platform**: current mobile and desktop browsers, designed for 360 px width first

**Project Type**: static frontend web app (single page)

**Performance Goals**: each step change displays in under 100 ms on a mid-range phone. Quick exit
leaves the page in under 1 second.

**Constraints**:

- No server, authentication, or external APIs (Principle IV).
- Works offline once loaded.
- Fictional data only.
- Office-hours rules are evaluated in `America/New_York`.

**Scale/Scope**:

- About 20 question screens and 9 document types.
- 5 user stories, 26 FRs, 9 SCs.
- Single-browser demo data, holding tens of requests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Pre-research | Post-design |
|---|---|---|---|
| I. Testable acceptance scenarios | Every scenario has an observable outcome and maps to a test | PASS: each spec scenario names visible text or a state | PASS: [ui-screens.md](./contracts/ui-screens.md) gives each scenario a test ID and expected text. [rules.md](./contracts/rules.md) turns boundary cases into unit tests. SC-001 and SC-008 are scripted manual checks in [quickstart.md](./quickstart.md). |
| II. Requirement traceability | IDs kept, FRs cite goals, tasks and tests cite IDs | PASS: FR-001 to FR-026 cite G-### or constitution IDs. K13 and K14 are listed as open issues. | PASS: config entries carry `traces`, with a guard test (R9). Test names cite US#-AS# or FR-###. |
| III. Frontend-only code location | All app code and tests under `frontend/` | PASS | PASS: see Project Structure. `specs/` holds docs only. |
| IV. No auth, backend, or external APIs | Mocks only, labeled | PASS: the spec mocks accounts, storage, and the staff list (FR-026) | PASS: nickname-only mock account (R5), simulated readability (R6), `localStorage` (R4), bundled neutral exit page (R3), mock banners in the UI contract |
| Prototype constraints | Follow K4 and K5. Label reported values. No automated decisions. | PASS | PASS: K4 requires the explanation to come before the controls in the page. K5 adds the private-answers screen and hides private answers. Dates are labeled "reported". A test scans for eligibility wording (SC-006). |

**Result**: all gates pass. There are no violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-legal-aid-intake-form/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R10
├── data-model.md        # Phase 1: entities, rules, state transitions
├── quickstart.md        # Phase 1: run and validation guide
├── contracts/
│   ├── ui-screens.md    # routes, test IDs, per-screen guarantees
│   ├── rules.md         # pure rule functions and example tables
│   └── storage.md       # localStorage keys and rules
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── playwright.config.ts
├── public/
│   └── neutral.html            # quick-exit destination (R3)
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # hash routes: #/, #/form, #/confirmation, #/account, #/staff
│   ├── config/
│   │   ├── questions.ts        # Question[] with traces (FR-004–FR-012)
│   │   ├── documents.ts        # DocumentRule[] (Document Requirements table)
│   │   ├── office.ts           # OfficeConfig: time zone, hours, help contact, exit URL
│   │   └── copy.ts             # plain-language screen text
│   ├── rules/                  # pure functions (contracts/rules.md)
│   │   ├── visibleQuestions.ts
│   │   ├── urgency.ts
│   │   ├── callback.ts
│   │   ├── documents.ts
│   │   └── traceability.ts
│   ├── state/
│   │   ├── intakeStore.ts      # in-memory draft and transitions
│   │   ├── storage.ts          # localStorage adapter (contracts/storage.md)
│   │   └── clock.ts            # injectable clock
│   ├── components/
│   │   ├── SafetyBar.tsx       # quick exit and help contact on every screen
│   │   ├── QuestionScreen.tsx
│   │   ├── PrivateGate.tsx
│   │   ├── UploadStep.tsx
│   │   ├── ReviewStep.tsx
│   │   └── MockBanner.tsx
│   └── pages/
│       ├── Welcome.tsx
│       ├── IntakeForm.tsx
│       ├── Confirmation.tsx
│       ├── Account.tsx
│       └── StaffList.tsx
└── tests/
    ├── unit/                   # rules/*.test.ts, named by FR-### and US#-AS#
    ├── component/              # screens with React Testing Library
    └── e2e/                    # Playwright, one file per user story (us1.spec.ts …)
```

**Structure Decision**: a single static frontend project in `frontend/`, as Principle III
requires. There is no `backend/` (Principle IV). Rules are separate from components so that every
boundary in the spec can be unit-tested without a browser.

## Complexity Tracking

No constitution violations to justify.
