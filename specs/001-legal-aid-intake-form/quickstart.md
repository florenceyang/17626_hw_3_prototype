# Quickstart: Run and Validate the Intake Prototype

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

This guide shows how to prove the feature works end to end. Implementation details belong in
`tasks.md`.

## Prerequisites

- Node.js 22 LTS or later, with npm
- A desktop browser for manual checks, and a phone or browser device emulation at 360×640
- The commands below are run from `frontend/`

## Setup and run

```bash
cd frontend
npm install
npx playwright install chromium   # one-time browser download for end-to-end tests
npm run dev                       # serves the app at http://localhost:5173
```

## Automated validation

```bash
npm test          # Vitest unit tests (rules) and component tests (screens)
npm run test:e2e  # Playwright end-to-end tests for the acceptance scenarios
npm run build     # static build in frontend/dist; must succeed with no server code
```

**Expected result**: all tests pass. Each test name begins with the scenario or requirement ID it
covers, for example `US1-AS10` or `FR-014`. To list the IDs covered, run:

```bash
npx vitest list && npx playwright test --list
```

The traceability check compares that list with the scenarios in the spec.

| Area | Proven by | Contract |
|---|---|---|
| Urgency, callback, and document rules | Unit tests | [rules.md](./contracts/rules.md) |
| One question per screen, "not sure", explanation order, quick-exit and help bar | Component tests | [ui-screens.md](./contracts/ui-screens.md) |
| US1 to US5 acceptance scenarios, quick exit with Back, no eligibility wording | End-to-end tests | [ui-screens.md](./contracts/ui-screens.md) |
| Storage keys, and no anonymous draft persisted | End-to-end tests (inspect `localStorage`) | [storage.md](./contracts/storage.md) |

## Manual validation scenarios

Use fictional data only. Before each run, open `#/staff` and choose **Clear prototype data**.

1. **Anonymous eviction submission (US1, SC-005)**
   1. Open `#/`. Confirm the screen says the service is free and who sees the information.
   2. Press Start, choose Eviction, and choose "I'm filling this in myself".
   3. Enter a notice date, and a court date 3 days from today. Answer "no" to the danger
      questions.
   4. Skip the uploads and submit.
   5. **Expect**:
      - a confirmation number
      - "None" under documents received
      - "Expect a call today" during 9:00 am to 5:00 pm, Monday to Friday (New York time);
        otherwise the next-business-day wording
      - "Waiting for staff review"
2. **Quick exit (US2, SC-002, SC-003)**
   1. On any question screen, press Quick exit.
   2. **Expect**: the neutral page loads. Pressing Back does not show any answers.
   3. Repeat from the welcome, upload, and review screens.
3. **Helper privacy (US2-AS5, US2-AS6, SC-007)**
   1. Choose "Someone is helping me".
   2. **Expect**: the private-answers screen appears before the danger questions.
   3. Answer "not sure" to a danger question.
   4. **Expect**: the review and confirmation screens show no danger answers.
   5. Open the staff list. **Expect**: the row is marked urgent with reason "danger".
4. **Documents (US3)**
   1. Choose Eviction and Section 8, with recertification issues.
   2. **Expect**: five required slots, plus court papers listed as optional.
   3. Upload a lease set to "Unreadable". **Expect**: an immediate message.
   4. Leave the upload step. **Expect**: the missing documents are named, and Submit is still
      enabled.
5. **Staff list (US4, SC-004, SC-009)**
   1. Submit three requests:
      - court date in 7 days
      - court date in 8 days with no danger
      - court date in 30 days with danger "not sure"
   2. **Expect**: urgent, not urgent, and urgent, each row showing its unsure count, missing
      documents, and court date labeled unverified.
6. **Mock account (US5)**
   1. Partway through, choose "Save and finish later".
   2. **Expect**: the account prompt and the simulated-account banner.
   3. Decline once. **Expect**: you return to the same question.
   4. Choose "Save and finish later" again and create the nickname `tester1`.
   5. Reload, log in as `tester1`. **Expect**: the form resumes at the first unanswered
      question.
   6. Submit. **Expect**: the status screen shows "Waiting for staff review".

## Usability checks (SC-001, SC-008)

Run with 5 participants on a phone, using a printed fictional eviction scenario.

- Record the time from Start to the confirmation screen, and whether the facilitator helped.
  - **Pass**: at least 4 of 5 participants finish in under 15 minutes without help.
- After the welcome screen, ask: "Does this cost money? Who will see your answers?"
  - **Pass**: at least 4 of 5 participants answer both correctly.
- Record results in `specs/001-legal-aid-intake-form/usability-results.md`, citing SC-001 and
  SC-008.
