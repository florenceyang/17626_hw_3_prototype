---

description: "Task list for the Legal Aid Intake Form prototype"
---

# Tasks: Legal Aid Intake Form

**Input**: Design documents from `specs/001-legal-aid-intake-form/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are required by Constitution Principle I: every acceptance scenario maps to a
test that cites it. Write each story's tests first and confirm they fail before implementing.

**Traceability**: Every task cites the IDs it implements, in parentheses (Principle II).
- Story tasks cite FR-### and/or US#-AS#.
- Setup and foundational tasks cite the plan decision (R#), the constitution principle, or the
  FRs they enable.
- Test names MUST begin with the cited ID, for example `test("US1-AS10 …")` or
  `test("FR-014 …")`.

**Organization**: Tasks are grouped by user story so each story can be built and tested on its
own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: the user story the task belongs to (US1–US5)
- All paths are relative to the repository root. All application code is under `frontend/`
  (Principle III).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the static frontend project. There is no backend (Principle IV).

- [ ] T001 Scaffold a Vite + React 19 + TypeScript (strict) single-page app in `frontend/` (`frontend/package.json`, `frontend/index.html`, `frontend/tsconfig.json`, `frontend/src/main.tsx`). Add npm scripts `dev`, `build`, `test` (vitest run), and `test:e2e` (playwright test). Add no router, no date library, no HTTP client, and no server dependencies. (R1, Principles III and IV)
- [ ] T002 [P] Configure Vitest with the jsdom environment and React Testing Library in `frontend/vite.config.ts` and `frontend/tests/setup.ts`. The test include patterns are `tests/unit/**` and `tests/component/**`. (R2)
- [ ] T003 [P] Configure Playwright in `frontend/playwright.config.ts`:
  - Use a `webServer` that runs `npm run dev` on port 5173.
  - Create one Chromium project with a 360×640 viewport and `hasTouch: true`.
  - Set `testDir: tests/e2e`.
  - Add `@axe-core/playwright` as a dev dependency.
  (R2, R10)
- [ ] T004 [P] Create `frontend/.gitignore` listing `node_modules/`, `dist/`, `test-results/`, and `playwright-report/`. (Principle III)
- [ ] T005 [P] Create the quick-exit destination `frontend/public/neutral.html`. It is a self-contained, generic "Local weather" page with no scripts, no links back to the app, and nothing about legal aid. (R3, FR-003)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, configuration, state, storage, and the app shell that every story uses.

**⚠️ CRITICAL**: No user-story work can begin until this phase is complete.

- [ ] T006 Define the entity types from data-model.md in `frontend/src/types.ts`. Use these values verbatim:
  - `ProblemType = "eviction" | "other" | "unsure"`
  - `Section = "problem" | "helper" | "deadline" | "danger" | "housing" | "household" | "income"`
  - `QuestionKind = "choice" | "date" | "number" | "yesNo"`
  - `DocumentType = "problemNotice" | "incomeProof" | "deadlinePaperwork" | "evictionNotice" | "lease" | "courtPapers" | "rentHistory" | "inspectionNotices" | "recertPaperwork"`
  - `RequiredWhen = "always" | "hasIncome" | "urgentByDate" | "hasVoucherOrPublicHousing" | "hasSubsidy" | "subsidyAndRecertIssues" | "never"`
  - `Readability = "readable" | "unreadable" | "wrongPage"`
  - `Status = "draft" | "waitingForStaffReview"`
  - `UrgencyReason = "date" | "danger"`

  Also define:
  - `Question`, with `traces: { fr: string[]; goals: string[] }`
  - `DocumentRule`
  - `Answer`, with `value: string | number | boolean | null` (`null` when unsure), `unsure: boolean`, `source?: "reported"`, and `private: boolean`
  - `UploadedDocument` (metadata only)
  - `HelpRequest`, with `helperPresent: boolean | "unsure"`
  - `MockAccount`, with `nickname` "string, 1–30 characters"
  - `OfficeConfig`

  (data-model.md; enables FR-001–FR-026)
- [ ] T007 [P] Create `frontend/src/config/office.ts` exporting `OFFICE: OfficeConfig` with:
  - `timeZone: "America/New_York"`
  - `openHour: 9` and `closeHour: 17` ("open hour included, close hour excluded")
  - `businessDays: [1,2,3,4,5]` (Monday to Friday)
  - `helpContact` with a fictional phone number "(555) 010-0199" and hours "Mon–Fri 9am–5pm"
  - `quickExitUrl: "/neutral.html"`
  (R3, R7, FR-008, FR-025)
- [ ] T008 [P] Create the injectable clock in `frontend/src/state/clock.ts`:
  - `now(): Date` returns `new Date()` by default.
  - `setClockForTests(fn)` overrides it in unit tests. End-to-end tests use Playwright `page.clock`.
  - Add `officeDateParts(date, tz)`, which uses `Intl.DateTimeFormat` to return `{year, month, day, weekday, hour, minute}` in the office time zone.
  (R7, R8)
- [ ] T009 [P] Implement the localStorage adapter in `frontend/src/state/storage.ts` following contracts/storage.md:
  - Keys `lai.v1.requests` and `lai.v1.accounts`.
  - `loadRequests()`, `saveRequest(req)`, `loadAccounts()`, `saveAccounts(map)`, and `clearPrototypeData()`.
  - Unparseable JSON is treated as empty, never thrown.
  - Write unit tests in `frontend/tests/unit/storage.test.ts`. Test names start with `storage:`; include a test for corrupt JSON.
  (R4, contracts/storage.md)
- [ ] T010 [P] Create `frontend/src/config/copy.ts` with plain-language text for the welcome screen (free service, and who sees the information and why), the confirmation sentence explaining the confirmation number, the mock-banner text "Simulated for this prototype. Do not enter real information.", and the leave warning "If you leave now, your answers will not be saved." (FR-002, FR-021, FR-026)
- [ ] T011 Implement the hash router and app shell:
  - `frontend/src/App.tsx` handles routes `#/`, `#/form`, `#/confirmation`, `#/account`, and `#/staff`. Routes use `location.hash`, and form steps never change the hash or push history.
  - `frontend/src/components/Layout.tsx` renders a fixed top bar slot, the page content, and a phone-first container at most 480 px wide, with touch targets of at least 44 px.
  (contracts/ui-screens.md, R3, R10)
- [ ] T012 [P] Create `frontend/src/components/MockBanner.tsx`, rendering the mock-banner text from copy.ts with `data-testid="mock-banner"`. (FR-026)
- [ ] T013 Implement the in-memory intake store in `frontend/src/state/intakeStore.ts`, as a React context and reducer:
  - Draft fields: `HelpRequest` with `status: "draft"`, the current step index, and `loggedInNickname: string | null`.
  - Actions: `start`, `answer(questionId, value)`, `markUnsure(questionId)`, `next`, `back` (in-app only), `reset`, and a `submit` placeholder.
  - The anonymous draft is never written to storage.
  (R4, FR-001, FR-009)
- [ ] T014 [P] Implement `allConfigTraced(questions, documentRules)` in `frontend/src/rules/traceability.ts`. It returns the IDs of entries whose `traces.fr` is empty. (R9, Principle II)
- [ ] T015 [P] Create the end-to-end helpers in `frontend/tests/e2e/helpers.ts`:
  - `resetApp(page)` clears localStorage and goes to `#/`.
  - `fixTime(page, isoInNewYork)` wraps `page.clock.setFixedTime`.
  - `answerCurrent(page, value)` answers the current question.
  - `chooseUnsure(page)` picks "I'm not sure".
  - `goToStep(page, questionId)` advances to the given question.
  - Add an `ELIGIBILITY_WORDS` list: qualify, eligible, approved, denied, accepted.
  (R2, SC-006)

**Checkpoint**: The app shell runs with `npm run dev`. Storage and clock unit tests pass.

---

## Phase 3: User Story 1 - Submit a help request without an account (Priority: P1) 🎯 MVP

**Goal**: Without an account, the applicant answers filtered, plain-language questions one per
screen (deadline and danger first), submits, and sees a confirmation with the correct callback
promise. No eligibility outcome is ever shown.

**Independent Test**: Complete the eviction path with fictional data and no documents, submit,
and check the confirmation screen (quickstart.md scenario 1).

### Tests for User Story 1 (write first, confirm they fail) ⚠️

- [ ] T016 [P] [US1] Write unit tests for `visibleQuestions` in `frontend/tests/unit/visibleQuestions.test.ts`, covering every row of the contracts/rules.md table. Name them `FR-004 …`, `FR-005 / US1-AS3 …`, `FR-012 / US1-AS7 …`, and `edge: unsure problem type …`.
- [ ] T017 [P] [US1] Write unit tests for `computeUrgency` in `frontend/tests/unit/urgency.test.ts`, covering all 7 rows of the contracts/rules.md table: +7 urgent, +8 not urgent, −3 urgent, unsure date not urgent, danger yes, danger unsure (FR-024), and both reasons. Name them `FR-014 …` and `FR-024 …`.
- [ ] T018 [P] [US1] Write unit tests for `callbackMessage` in `frontend/tests/unit/callback.test.ts`, covering all 6 rows of the contracts/rules.md table in America/New_York: Tuesday 10:00, 9:00, 17:00, and 21:00; Saturday 10:00; and non-urgent. Name them `US1-AS9 …`, `US1-AS10 …`, `US1-AS12 …`, and `FR-025 …`.
- [ ] T019 [P] [US1] Write component tests for QuestionScreen in `frontend/tests/component/QuestionScreen.test.tsx`:
  - `US1-AS4`: exactly one `question` test ID, and a `next-step` element whose text starts with "Next:".
  - `US1-AS5`: the `explanation` element comes before the answer controls in the page.
  - `US1-AS6`: choosing `unsure` stores `unsure: true` and `value: null` and enables Continue.
- [ ] T020 [P] [US1] Write unit test `FR-009 / Principle II` in `frontend/tests/unit/traceability.test.ts`. It asserts that `allConfigTraced(QUESTIONS, DOCUMENT_RULES)` returns `[]` and that every question has `kind` and "I'm not sure" support.
- [ ] T021 [P] [US1] Write end-to-end tests in `frontend/tests/e2e/us1.spec.ts`, one test per scenario US1-AS1 to US1-AS12, using `fixTime`:
  - AS10 uses Tuesday 10:00 New York time.
  - AS12 uses Saturday 10:00 and Tuesday 21:00.

  Also add these tests:
  - `SC-006`: walks every applicant screen and asserts that none of the `ELIGIBILITY_WORDS` appear.
  - `FR-001`: asserts no login prompt appears before submit.
  - `R4`: asserts that localStorage has no draft while the form is in progress.

### Implementation for User Story 1

- [ ] T022 [P] [US1] Create the question set in `frontend/src/config/questions.ts`. Each question has a stable `id`, `section`, `appliesTo`, `kind`, plain-language `prompt`, `explanation` where a legal term is used, and `traces`. In this order:
  1. `Q-PROBLEM-TYPE`: choice; Eviction or housing / Something else; all; FR-004, G-6
  2. `Q-HELPER`: choice; "I'm filling this in myself" / "Someone is helping me"; all; FR-010, G-133, G-134
  3. `Q-NOTICE-DATE`: date; eviction; explains "eviction notice"; FR-012, G-81
  4. `Q-COURT-DATE`: date; all; explains "court appearance date"; FR-012, FR-013, G-81, G-30
  5. `Q-DANGER-AFRAID`: yesNo; all; private; placeholder "Are you afraid someone may hurt you if they find out you contacted us?"; FR-005, FR-011, G-15
  6. `Q-DANGER-HOME`: yesNo; all; private; placeholder "Is anyone where you live threatening you or making you feel unsafe right now?"; FR-005, FR-011, G-15
  7. `Q-SUBSIDY`: choice; Section 8 or another voucher / Public housing / Another housing subsidy / None; eviction; explains "subsidy"; FR-017, G-95
  8. `Q-RECERT`: yesNo; eviction; showIf `Q-SUBSIDY` is not None or unsure; explains "recertification"; FR-017
  9. `Q-HOUSEHOLD-SIZE`: number; all; FR-005
  10. `Q-HAS-INCOME`: yesNo; all; FR-017
  11. `Q-INCOME-AMOUNT`: number; all; showIf `Q-HAS-INCOME` = yes; FR-005

  "I'm not sure" is provided by the screen for every question, so Q-PROBLEM-TYPE needs no separate unsure option. Mark the placeholder danger wording with a `// TODO: staff review` comment (spec Assumptions).
- [ ] T023 [P] [US1] Implement `visibleQuestions(problemType, answers)` in `frontend/src/rules/visibleQuestions.ts`:
  - Filter by `appliesTo`. The `unsure` problem type gets only `all` questions.
  - Apply `showIf`.
  - Sort stably by the section order problem → helper → deadline → danger → housing → household → income.
  - Add `nextStepLabel(questions, index)`, which returns "Next: <short label>", or "Next: upload documents" after the last question.
  (FR-004, FR-005, FR-006)
- [ ] T024 [P] [US1] Implement `computeUrgency(answers, submittedAt, office)` in `frontend/src/rules/urgency.ts`:
  - Compare calendar dates in `office.timeZone`.
  - The date reason applies when the court date ≤ the submission date + 7 days, past dates included. A null or unsure court date never sets the date reason.
  - The danger reason applies when any `danger`-section answer is `true` or unsure.
  - Return `{ isUrgent, reasons }`.
  (FR-014, FR-024, R8)
- [ ] T025 [P] [US1] Implement `callbackMessage(urgent, submittedAt, office)` in `frontend/src/rules/callback.ts`, returning exactly one of:
  - "Expect a call today": urgent, a business day, and `openHour ≤ hour < closeHour`.
  - "Expect a call by the end of the next business day": urgent at any other time.
  - "Expect a call within 2 business days": not urgent.
  (FR-021, FR-025, R7)
- [ ] T026 [P] [US1] Implement `newConfirmationNumber(date, existing)` in `frontend/src/rules/confirmationNumber.ts`. The format is `LA-YYMMDD-XXXX`, where `XXXX` is 4 random uppercase letters or digits, unique within `existing`. (FR-021)
- [ ] T027 [US1] Build the Welcome page in `frontend/src/pages/Welcome.tsx`. It shows the free-service and who-sees-it text from copy.ts and a "Start" button that dispatches `start` and sets the hash to `#/form`, with no login step. (FR-001, FR-002, US1-AS1)
- [ ] T028 [US1] Build `frontend/src/components/QuestionScreen.tsx`:
  - Render one question (`data-testid="question"`, `data-question-id`).
  - Show the `explanation` above the answer controls.
  - Provide answer controls for each `kind`, plus a button `data-testid="unsure"` labeled "I'm not sure".
  - Show a `next-step` line, plus Continue and Back buttons (in-app only, no history).
  (FR-006, FR-007, FR-009, US1-AS4–AS6)
- [ ] T029 [US1] Build the IntakeForm page in `frontend/src/pages/IntakeForm.tsx`:
  - Step through `visibleQuestions`, recomputing them after each answer.
  - Then show the review step, then submit.
  - When the applicant leaves through in-app navigation with unsaved answers, show the leave warning from copy.ts.
  (FR-004, FR-005, FR-006, spec edge case "leaves without logging in")
- [ ] T030 [US1] Build `frontend/src/components/ReviewStep.tsx`, listing the answers. Court and notice dates show "Reported by applicant, not verified", and unsure answers show "Not sure". (FR-013, US1-AS8)
- [ ] T031 [US1] Implement `submit` in `frontend/src/state/intakeStore.ts`:
  - Set `submittedAt = now()`.
  - Compute `urgent`, `callbackMessage`, and `confirmationNumber`, and set `missingDocuments = []` until US3 wires it.
  - Set `status = "waitingForStaffReview"` (the only post-submit status) and call `saveRequest`.
  - Clear the draft and go to `#/confirmation`.
  (FR-014, FR-021, FR-022)
- [ ] T032 [US1] Build the Confirmation page in `frontend/src/pages/Confirmation.tsx`, with these test IDs:
  - `confirmation-number`, with a sentence explaining what it is for
  - `docs-received`, listing readable documents by type or showing "None"
  - `callback`
  - `status`, reading "Waiting for staff review"

  Use no eligibility wording. (FR-021, FR-022, US1-AS9–AS12)

**Checkpoint**: T016–T021 pass. US1 works on its own.

---

## Phase 4: User Story 2 - Stay safe and get help while filling in the form (Priority: P1)

**Goal**: Quick exit and help contact on every screen. Private danger questions when a helper is
present.

**Independent Test**: Check every screen for quick exit and help contact, test quick exit with
the Back button, and run the helper path (quickstart.md scenarios 2–3).

### Tests for User Story 2 (write first, confirm they fail) ⚠️

- [ ] T033 [P] [US2] Write component tests in `frontend/tests/component/SafetyBar.test.tsx`:
  - `US2-AS1`: the `quick-exit` button renders, labeled "Quick exit".
  - `US2-AS3`: `help-contact` shows `OFFICE.helpContact`.
  - `FR-003`: clicking calls the reset action and then `location.replace(OFFICE.quickExitUrl)` (mock `location.replace`).
- [ ] T034 [P] [US2] Write end-to-end tests in `frontend/tests/e2e/us2.spec.ts`:
  - `US2-AS1` and `SC-002`: on `#/`, every form step, the upload, review, and confirmation screens, and `#/account`, the `quick-exit` and `help-contact` elements are within the 360×640 viewport.
  - `US2-AS2` and `SC-003`: after quick exit from a question screen, the URL ends in `/neutral.html`. After `page.goBack()`, no answer text or `question` test ID is visible. Navigation completes in under 1 s.
  - `US2-AS4`, `US2-AS5`, and `US2-AS6`: with "Someone is helping me", `private-gate` appears before `Q-DANGER-AFRAID`. After answering, the review and confirmation pages contain no danger answer text.
  - `edge: helper + quick exit`.

### Implementation for User Story 2

- [ ] T035 [US2] Build `frontend/src/components/SafetyBar.tsx`:
  - A fixed top bar with a `quick-exit` button and a `help-contact` element.
  - Quick exit dispatches `reset` (clearing all in-memory answers), blanks the page body, then calls `location.replace(OFFICE.quickExitUrl)`.
  - Pressing Escape three times within 2 s also triggers quick exit.
  (FR-003, FR-008, R3)
- [ ] T036 [US2] Render SafetyBar in `frontend/src/components/Layout.tsx` on every applicant route (`#/`, `#/form`, `#/confirmation`, `#/account`). (FR-003, FR-008, US2-AS1, US2-AS3)
- [ ] T037 [US2] Add a `pageshow` listener in `frontend/src/main.tsx`. When `event.persisted` is true (the page was restored from the back/forward cache), clear the body and call `location.reload()`, so restored pages never show answers. (FR-003, R3, US2-AS2)
- [ ] T038 [US2] Build `frontend/src/components/PrivateGate.tsx` (`data-testid="private-gate"`). It says "The next questions are private. Please answer them on your own." and has a button "I'm alone now, continue". In `frontend/src/pages/IntakeForm.tsx`, insert it before the first `danger`-section question when `helperPresent` is `true` or `"unsure"`. (FR-010, FR-011, K5, US2-AS4, US2-AS5)
- [ ] T039 [US2] Hide private answers:
  - In `frontend/src/state/intakeStore.ts`, set `Answer.private = question.private && helperPresent !== false`.
  - In `frontend/src/components/ReviewStep.tsx` and `frontend/src/pages/Confirmation.tsx`, never render answers with `private: true`. Show no placeholder that reveals their content.
  (FR-011, US2-AS6, SC-007)

**Checkpoint**: T033–T034 pass. US1 tests still pass.

---

## Phase 5: User Story 3 - Upload documents with the form (Priority: P2)

**Goal**: Show the document slots that apply, with photo instructions, a simulated readability
result, and missing-document messages. Submission is never blocked.

**Independent Test**: quickstart.md scenario 4.

### Tests for User Story 3 (write first, confirm they fail) ⚠️

- [ ] T040 [P] [US3] Write unit tests for `requiredDocuments` and `missingDocuments` in `frontend/tests/unit/documents.test.ts`, covering all 5 rows of the contracts/rules.md table. Also cover "only `readable` documents count" and "`never` rules are never missing". Name them `US3-AS5 …`, `US3-AS6 …`, `FR-017 …`, and `edge: subsidy unsure …`.
- [ ] T041 [P] [US3] Write component tests in `frontend/tests/component/UploadStep.test.tsx`:
  - `US3-AS1`: `photo-instructions` comes before the first `doc-slot-*`, and `data-required` is correct.
  - `US3-AS2`: choosing `simulate-lease` = Unreadable shows `doc-problem-lease` immediately.
  - `edge: non-image file`: a `.txt` file is rejected with a message.
- [ ] T042 [P] [US3] Write end-to-end tests in `frontend/tests/e2e/us3.spec.ts`:
  - `US3-AS3`: leaving the step with a missing required document shows `missing-docs` naming it, and Submit stays enabled.
  - `US3-AS4`: confirmation `docs-received` lists the uploaded types.
  - `US3-AS5` and `US3-AS6`: full-path variants.
  - `R4`: localStorage request records contain no file contents.

### Implementation for User Story 3

- [ ] T043 [P] [US3] Create `frontend/src/config/documents.ts` exporting `DOCUMENT_RULES: DocumentRule[]`, one entry per row of the spec's Document Requirements table:
  - `problemNotice`: all, always, C14 C68
  - `incomeProof`: all, hasIncome, C45 C68
  - `deadlinePaperwork`: all, urgentByDate, C90
  - `evictionNotice`: eviction, always, D22 D25 Gl10
  - `lease`: eviction, always, D22 D25
  - `courtPapers`: eviction, never, D22 D25
  - `rentHistory`: eviction, hasVoucherOrPublicHousing, D15 D20
  - `inspectionNotices`: eviction, hasSubsidy, D20
  - `recertPaperwork`: eviction, subsidyAndRecertIssues, D20

  Set `satisfiedBy` so that `problemNotice ← evictionNotice` and `deadlinePaperwork ← courtPapers`. Give each rule a plain-language `label` and `explanation` and traces FR-015 and FR-017, plus G-8 and G-95. (FR-015, FR-017)
- [ ] T044 [P] [US3] Implement `requiredDocuments(problemType, answers, urgent)` and `missingDocuments(required, documents)` in `frontend/src/rules/documents.ts`:
  - `hasVoucherOrPublicHousing` means `Q-SUBSIDY` is Section 8/voucher or Public housing.
  - `hasSubsidy` means any subsidy option except None.
  - `subsidyAndRecertIssues` means `hasSubsidy` and `Q-RECERT` = yes.
  - An unsure subsidy answer makes subsidy rules optional.
  - For eviction cases, `problemNotice` is satisfied by `evictionNotice`.
  - Only `readable` uploads count, and `never` rules are never returned as missing.
  (FR-017)
- [ ] T045 [US3] Build `frontend/src/components/UploadStep.tsx`:
  - `photo-instructions` first.
  - Then one `doc-slot-<type>` per applicable rule, with `data-required`, the explanation, a file input accepting `image/*,application/pdf`, and a `simulate-<type>` select (Readable, the default / Unreadable / Wrong page) labeled "Prototype: simulate result".
  - Show `doc-problem-<type>` immediately for an unreadable or wrong-page upload, with "Retake or replace".
  - Reject other file types with a message.
  - Store only `{type, fileName, mimeType, sizeBytes, readability}`.
  (FR-015, FR-016, R6, US3-AS1, US3-AS2)
- [ ] T046 [US3] In `frontend/src/pages/IntakeForm.tsx`, insert UploadStep after the last question and before the review step. When the applicant leaves the step with missing required documents, show `missing-docs` naming each one, and keep Submit enabled. (FR-017, US3-AS3)
- [ ] T047 [US3] Wire the documents into `submit` in `frontend/src/state/intakeStore.ts`, setting `missingDocuments = missingDocuments(requiredDocuments(…), documents)`. In `frontend/src/pages/Confirmation.tsx`, make `docs-received` list the readable documents by `label`. (FR-017, FR-021, US3-AS4)

**Checkpoint**: T040–T042 pass. US1 and US2 tests still pass.

---

## Phase 6: User Story 4 - Staff see which requests are urgent and what needs follow-up (Priority: P2)

**Goal**: A mock staff list showing the urgent flag, unsure answers, missing documents, and
unverified court dates.

**Independent Test**: quickstart.md scenario 5.

### Tests for User Story 4 (write first, confirm they fail) ⚠️

- [ ] T048 [P] [US4] Write component tests in `frontend/tests/component/StaffList.test.tsx`. Seed storage with fixture requests:
  - `US4-AS4`: each `staff-row` shows urgent with its reasons, the unsure count and prompts, missing-document labels, and a court date with "Reported by applicant, not verified".
  - `US4-AS5`: `mock-banner` is present and there is no eligibility column or words.
  - `storage: clear prototype data` empties the list.
- [ ] T049 [P] [US4] Write end-to-end tests in `frontend/tests/e2e/us4.spec.ts`. Submit three requests through the UI with a fixed clock: court date +7, court date +8 with no danger, and +30 with danger unsure. Then assert:
  - `US4-AS1`: the first row is urgent.
  - `US4-AS3`: the second row is not urgent.
  - `US4-AS2`: the third row is urgent with reason danger.
  - `SC-004` and `SC-009`: all columns are correct.

### Implementation for User Story 4

- [ ] T050 [US4] Build `frontend/src/pages/StaffList.tsx` at `#/staff`:
  - Render `MockBanner`.
  - Show one `staff-row` per stored request (with `data-confirmation`), newest first.
  - Columns: confirmation number and submitted time; Urgent (Yes/No plus "court date" and/or "danger reported"); Not sure (count plus prompts); Missing documents (labels); Court date (value plus "Reported by applicant, not verified"); Status ("Waiting for staff review").
  - Add a "Clear prototype data" button calling `clearPrototypeData()`.
  - Do not render private danger answer values. The urgency reason is enough.
  (FR-023, FR-026, US4-AS1–AS5)
- [ ] T051 [US4] Register the `#/staff` route in `frontend/src/App.tsx`, without SafetyBar, because it is a staff view. (FR-023)

**Checkpoint**: T048–T049 pass. Earlier stories still pass.

---

## Phase 7: User Story 5 - Save progress and check status with an account (Priority: P3)

**Goal**: A simulated nickname-only account for save, resume, and status. The applicant can
always decline. K13 and K14 stay open.

**Independent Test**: quickstart.md scenario 6.

### Tests for User Story 5 (write first, confirm they fail) ⚠️

- [ ] T052 [P] [US5] Write unit tests in `frontend/tests/unit/accounts.test.ts`:
  - `FR-018`: create an account with nickname "string, 1–30 characters", rejecting empty, over-30, and duplicate nicknames.
  - `FR-018`: save the draft, then load the draft.
  - `FR-020`: adding a submitted confirmation number makes the status list return "Waiting for staff review".
- [ ] T053 [P] [US5] Write end-to-end tests in `frontend/tests/e2e/us5.spec.ts`:
  - `US5-AS1`: `save-later` while logged out shows the account prompt, and `decline-account` returns to the same question with answers kept.
  - `US5-AS2`: create `tester1`, save, reload, log in, and the form resumes at the first unanswered question.
  - `US5-AS3`: after submitting, `account-status` reads "Waiting for staff review".
  - `US5-AS4` and `FR-026`: `mock-banner` is visible, and `nickname` is the only input (no password, email, or phone field).

### Implementation for User Story 5

- [ ] T054 [P] [US5] Implement the account functions in `frontend/src/state/accounts.ts` on top of `storage.ts`:
  - `createAccount(nickname)` takes a nickname of "string, 1–30 characters", unique in this browser.
  - `logIn(nickname)` and `saveDraft(nickname, draft)` (at most one draft).
  - `loadDraft(nickname)`.
  - `addSubmitted(nickname, confirmationNumber)` and `statusesFor(nickname)`.
  (FR-018, FR-020, R5)
- [ ] T055 [US5] Build `frontend/src/pages/Account.tsx` at `#/account`:
  - `MockBanner`.
  - A form whose only input is `nickname`, with "Create account" and "Log in" buttons.
  - A `decline-account` button, "Continue without saving", which returns to `#/form` with the in-memory answers kept.
  - When logged in, an `account-status` list showing "Waiting for staff review" per submitted request.
  (FR-019, FR-020, FR-026, US5-AS1, US5-AS3, US5-AS4)
- [ ] T056 [US5] Add a `save-later` button ("Save and finish later") to `frontend/src/components/QuestionScreen.tsx`, and a "Check my status" link to `frontend/src/pages/Welcome.tsx`:
  - If the applicant is not logged in, go to `#/account` (G-405 prompt).
  - If logged in, call `saveDraft` and confirm "Saved".
  (FR-018, FR-019, US5-AS1)
- [ ] T057 [US5] In `frontend/src/state/intakeStore.ts`:
  - On log-in, if a saved draft exists, load it and set the step to the first visible question without an answer.
  - On submit while logged in, call `addSubmitted` and clear the saved draft.
  (FR-018, FR-020, US5-AS2, US5-AS3)

**Checkpoint**: All story tests pass.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T058 [P] Add `frontend/tests/e2e/a11y.spec.ts`, which runs an `@axe-core/playwright` scan on `#/`, a question screen, the upload step, review, `#/confirmation`, `#/account`, and `#/staff`, and asserts there are no serious or critical violations. (R10, G-155)
- [ ] T059 [P] Add `frontend/scripts/check-traceability.mjs` and an npm script `trace`:
  - Parse the US#-AS#, FR-###, and SC-### IDs from `specs/001-legal-aid-intake-form/spec.md`.
  - Collect test titles from `npx vitest list --json` and `npx playwright test --list --reporter=json`.
  - Print any scenario with no test, and exit non-zero if any exist.
  - Exempt SC-001 and SC-008, which are manual checks.
  (Principle I, Principle II)
- [ ] T060 [P] Write `frontend/README.md` with setup, run, and test commands from quickstart.md, the configuration values in `src/config/office.ts`, and a note that all data is fictional and stored only in the browser. (Principles III and IV)
- [ ] T061 Create `specs/001-legal-aid-intake-form/usability-results.md` as a results template for SC-001 and SC-008: one row per participant, with time to confirmation, whether the facilitator helped, and answers to "Does this cost money? Who will see your answers?". (SC-001, SC-008)
- [ ] T062 Run the full quickstart.md validation: `npm test`, `npm run test:e2e`, `npm run trace`, and `npm run build`. Then run manual scenarios 1–6 and fix any failures. (All FRs)

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)** depends on nothing.
- **Foundational (Phase 2)** depends on Setup and blocks every story.
- **US1 (Phase 3)** depends on Foundational. It is the MVP base.
- **US2 (Phase 4)** depends on Foundational.
  - T036 needs the Layout from T011.
  - T038 and T039 extend the IntakeForm and ReviewStep from US1, so build US2 after US1.
- **US3 (Phase 5)** depends on US1, which supplies the IntakeForm, submit, and Confirmation.
- **US4 (Phase 6)** depends on US1 submitting requests. Its tests also cover US3's missing-documents column, so run them after US3. The page itself only needs Foundational and US1.
- **US5 (Phase 7)** depends on US1 (QuestionScreen and submit).
- **Polish (Phase 8)** depends on all the stories you choose to build.

### Within each story

Tests come first and must fail. Then configuration and rules (marked [P]), then components and
pages, then wiring into the store.

## Parallel Opportunities

- **Setup**: T002, T003, T004, and T005 in parallel after T001.
- **Foundational**: T007, T008, T009, T010, T012, T014, and T015 in parallel after T006. T011 and T013 follow.
- **US1**: tests T016–T021 in parallel. Then T022–T026 in parallel. Then T027–T032 in order.
- **US3**: T040–T042 in parallel. Then T043 and T044 in parallel.
- **Across stories**: once US1 is done, US2, US3, and US5 touch mostly separate files and can be split among teammates. Coordinate edits to `IntakeForm.tsx` and `intakeStore.ts`.

### Parallel example: User Story 1

```bash
Task: "T016 visibleQuestions unit tests in frontend/tests/unit/visibleQuestions.test.ts"
Task: "T017 urgency unit tests in frontend/tests/unit/urgency.test.ts"
Task: "T018 callback unit tests in frontend/tests/unit/callback.test.ts"
Task: "T022 question config in frontend/src/config/questions.ts"
Task: "T024 computeUrgency in frontend/src/rules/urgency.ts"
Task: "T025 callbackMessage in frontend/src/rules/callback.ts"
```

---

## Implementation Strategy

### MVP first

1. Complete Phase 1 and Phase 2.
2. Complete US1 (Phase 3) and US2 (Phase 4). Both are P1, because a form without quick exit and
   private danger questions is unsafe to demonstrate (G-68).
3. **Stop and validate**: run quickstart.md scenarios 1–3 and the US1 and US2 test suites.

### Incremental delivery

1. MVP (US1 and US2)
2. Add US3 for documents.
3. Add US4 for the staff list, which can then show missing documents.
4. Add US5 for the mock account, which may change once stakeholders decide K13 and K14.
5. Polish, then the traceability check, then a commit and push for collaborators.

## Notes

- [P] means different files and no dependency on an incomplete task.
- Commit after each phase checkpoint so collaborators can pull working increments.
- Do not add a server, authentication, or network calls at any point (Principle IV).
