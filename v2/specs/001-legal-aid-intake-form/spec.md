# Feature Specification: Legal Aid Intake Form

**Feature Branch**: `001-legal-aid-intake-form`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "./docs/initial-specs-v1.md"

**Goal model**: `goal-models/v1_prototype_goal_model.py` (root G-400). Decisions:
`docs/v1_goal_model_decisions.md`. FR-001 to FR-023 keep the numbering of the 23 requirements in
`docs/initial-specs-v1.md`; FR-024 onward are derived from that document's notes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit a help request without an account (Priority: P1)

An applicant facing eviction opens the form on their phone. Without logging in, they learn the
service is free and who will see their answers. They pick their problem type and answer the
deadline and danger questions first, one question per screen, with legal terms explained before
each question. They can mark any answer "I'm not sure". They give the notice date and the court
date separately. They submit and see a confirmation screen saying when to expect a call. They are
never told whether they qualify.

**Why this priority**: This is the root goal (G-400). Without a submitted request nothing else in
the prototype has value.

**Independent Test**: Start the form without an account, complete the eviction path with
fictional data, submit, and check the confirmation screen. This can be done with no documents and
no account features.

**Acceptance Scenarios**:

1. **Given** a visitor who is not logged in, **When** they open the form, **Then** the first
   screen says the service is free and names who will see their information, and a "Start"
   button begins the form without asking for a login.
2. **Given** the applicant selected "Eviction" as the problem type, **When** they move through
   the form, **Then** only questions tagged for eviction or for all problem types are shown.
3. **Given** the applicant is on the problem-type step, **When** they continue, **Then** the
   deadline and danger questions appear before any household or income question. A "Yes" or
   "I'm not sure" danger answer shows a brief urgent-review notice, then lets the applicant
   continue with the remaining questions.
4. **Given** any question screen, **When** it is displayed, **Then** it shows exactly one
   question and a line naming the next applicable step (for example, "Next: your court date"),
   including when a conditional follow-up question appears.
5. **Given** a question that uses a legal term (for example, "eviction notice"), **When** the
   screen is displayed, **Then** a plain-language explanation of the term appears above the
   question's answer controls.
6. **Given** any question screen, **When** the applicant chooses "I'm not sure", **Then** the
   answer is saved with an unsure tag and the applicant can continue.
7. **Given** the eviction path, **When** the applicant reaches the court-date questions,
   **Then** the notice date and the court appearance date are asked on two separate screens. If
   the court date is before the notice date, the applicant is asked to check both dates or mark
   the court date "I'm not sure".
8. **Given** the applicant entered a court date, **When** staff view it, **Then** it is labeled
   "Reported by applicant, not verified"; applicant screens do not show this label.
9. **Given** a non-urgent request, **When** the applicant submits, **Then** the confirmation
   screen shows a confirmation number, a list of documents received (or "None"), and "Expect a
   call within 2 business days".
10. **Given** an urgent request submitted during office hours (9:00 am to 5:00 pm, Monday to
    Friday), **When** the applicant submits, **Then** the confirmation screen says "Expect a call
    today".
11. **Given** any submission, **When** the confirmation screen and every later screen are
    shown, **Then** no text states or implies that the applicant does or does not qualify, and
    the request is shown as "Waiting for staff review".
12. **Given** an urgent request submitted outside office hours (for example, Saturday at
    10:00 am or Tuesday at 9:00 pm), **When** the applicant submits, **Then** the confirmation
    screen says "Expect a call by the end of the next business day".

---

### User Story 2 - Stay safe and get help while filling in the form (Priority: P1)

An applicant in an unsafe situation needs to leave the form instantly. A relative may be helping
them, but the danger questions must stay private from that helper. Any applicant who gets stuck
needs to see how to reach a person.

**Why this priority**: Exposure of a safety-sensitive situation (G-68) can cause harm, and K5
gives safety priority over helper convenience. This must ship with the MVP.

**Independent Test**: On every screen of the form, check for the quick-exit control and the help
contact. Then run the helper path and confirm the danger answers never reappear.

**Acceptance Scenarios**:

1. **Given** any screen of the form, **When** it is displayed, **Then** a quick-exit button is
   visible without scrolling.
2. **Given** any screen, **When** the applicant presses quick exit, **Then** the form is
   replaced by a neutral, unrelated page in one action, and the in-progress answers are not shown
   when the browser's Back button is pressed. This also applies while logged in; previously saved
   account drafts remain available after logging in again.
3. **Given** any screen of the form, **When** it is displayed, **Then** a phone number or other
   way to reach a person for help is visible.
4. **Given** the start of the form, **When** the applicant is asked whether someone is helping
   them, **Then** they can choose "I'm filling this in myself" or "Someone is helping me".
5. **Given** the applicant chose "Someone is helping me", **When** the danger questions are
   reached, **Then** a screen asks the applicant to answer the next questions privately, with a
   way to continue once they are alone.
6. **Given** the danger questions were answered with a helper present, **When** any later screen
   is shown (including the review and confirmation screens), **Then** the danger answers are not
   displayed.

---

### User Story 3 - Upload documents with the form (Priority: P2)

The applicant photographs their notice, lease, court papers, and pay stubs and uploads them. They
get instructions for taking good photos and are told right away if a photo can't be read or is
the wrong page. If a required document is missing, they are told but can still submit.

**Why this priority**: Documents let staff act faster (G-402), but a request without them is
still valid, so this builds on Story 1.

**Independent Test**: In the upload step, add a readable photo, a photo marked unreadable, and
skip a required document. Confirm each message, then submit successfully.

**Acceptance Scenarios**:

1. **Given** the upload step, **When** it is displayed, **Then** it lists the document types
   that apply to the applicant's answers (per the Document Requirements table), marks which are
   required, and shows photo instructions before the upload control.
2. **Given** the applicant uploads a document, **When** the upload is recognized as unreadable
   or as the wrong page, **Then** a message saying so appears immediately, and "Retake or
   replace" opens the file picker while keeping the current file until a replacement is selected.
3. **Given** a required document for the applicant's problem type has not been uploaded,
   **When** the applicant leaves the upload step, **Then** a message names the missing document
   and the "Submit" button remains available.
4. **Given** documents were uploaded, **When** the confirmation screen is shown, **Then** it
   lists each received document type once, even if it has multiple photos.
5. **Given** an eviction case where the applicant reports Section 8 and recertification issues,
   **When** they reach the upload step, **Then** the required list includes the eviction notice,
   lease, rent payment history, inspection notices, and recertification paperwork, and court
   papers are listed as optional.
6. **Given** an eviction case with no subsidy, no income reported, and a court date more than 7
   days away, **When** the applicant uploads only the eviction notice and the lease, **Then** no
   missing-document message is shown.

---

### User Story 4 - Staff see which requests are urgent and what needs follow-up (Priority: P2)

A staff member opens a simple list of submitted requests. They can see at a glance which
requests are urgent, which answers were marked "not sure", which required documents are missing,
and which court dates are unverified.

**Why this priority**: This shows the value of the applicant-side data to staff. The list is a
mock and depends on Stories 1 and 3.

**Independent Test**: Submit fictional requests covering urgent-by-date, urgent-by-danger, and
non-urgent cases, then open the staff list and check each flag.

**Acceptance Scenarios**:

1. **Given** a request whose reported court date is on or before 7 calendar days after the
   submission date, **When** it is submitted, **Then** it is marked urgent in the staff list.
2. **Given** a request where the applicant reported danger or answered "I'm not sure" to a
   danger question, **When** it is submitted, **Then** it is marked urgent in the staff list.
3. **Given** a request with a court date more than 7 days away and no danger reported, **When**
   it is submitted, **Then** it is not marked urgent.
4. **Given** a submitted request, **When** the staff list is opened, **Then** each row shows the
   urgent flag, the number of "not sure" answers, the names of missing required documents, and
   the court date labeled as unverified.
5. **Given** the staff list, **When** it is displayed, **Then** it is clearly labeled as a
   mock, and no row shows an eligibility decision.

---

### User Story 5 - Save progress and check status with an account (Priority: P3)

An applicant who can't finish in one sitting wants to save and come back. They are asked to log
in or create an account, then they can resume later and see that their submitted request is
"Waiting for staff review". In the prototype the account is simulated.

**Why this priority**: Convenient but not needed to submit. K13 and K14 are still unresolved, so
this story may change.

**Independent Test**: Start anonymously, choose "Save and finish later", create a mock account,
leave, return, log in, resume, submit, and view the status.

**Acceptance Scenarios**:

1. **Given** an applicant who is not logged in, **When** they choose "Save and finish later" or
   "Check my status" from the welcome, upload, or review screen, **Then** they are asked to log in
   or create an account, and they can decline and keep going without saving.
2. **Given** a logged-in applicant who saved partway, **When** they return and log in, **Then**
   the form opens at the first unanswered question with earlier answers kept.
3. **Given** a logged-in applicant who submitted a request, **When** they view their status,
   **Then** it reads "Waiting for staff review".
   An applicant who submits anonymously can also create or log in to an account from the
   confirmation screen to associate that request with their status list.
4. **Given** any account screen, **When** it is displayed, **Then** it is labeled as a
   simulated account for the prototype.

---

### Edge Cases

- **Court date in the past**: the request is marked urgent and the date stays labeled
  unverified.
- **Court date exactly 7 days away**: urgent (the boundary is inclusive).
- **Court date marked "I'm not sure" with no date entered**: not urgent by date. The unsure
  answer still appears in the staff list.
- **Problem type marked "I'm not sure"**: the applicant gets the general set of questions that
  apply to all problem types.
- **Quick exit pressed in the middle of an upload**: the exit still happens immediately. Answers
  not yet saved are discarded.
- **Applicant leaves without logging in**: progress is not kept. Before leaving through the
  form's own navigation, the applicant is told that unsaved answers will be lost.
- **Applicant uploads a file that is not an image or PDF**: they are told the file type can't be
  used and asked to try another.
- **Helper path with quick exit**: quick exit behaves the same and does not reveal danger
  answers.
- **Urgent request submitted on a weekend or at night**: the confirmation screen says to expect a
  call by the end of the next business day (FR-021).
- **Urgent request submitted at exactly 5:00 pm on a weekday**: this is outside office hours, so
  the next-business-day wording applies.
- **Subsidy question answered "I'm not sure"**: the subsidy-dependent documents are listed as
  optional, not required. The unsure answer still appears in the staff list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Applicants MUST be able to start and submit the form without logging in or
  creating an account. *(G-313, G-5)*
- **FR-002**: Before the first question, the system MUST state that the service is free and who
  will see the applicant's information and why. *(G-157, G-323)*
- **FR-003**: Every screen MUST show a quick-exit button that, in one action, replaces the form
  with a neutral, unrelated page and does not let the Back button return to the applicant's
  answers. *(G-71, G-68)*
- **FR-004**: The system MUST ask for the problem type first and then show only the questions
  that apply to that type. *(G-6)*
- **FR-005**: Deadline and danger questions MUST come before any household or income question.
  A "Yes" or "I'm not sure" danger answer MUST show an urgent-review notice and allow the
  applicant to continue. *(G-15)*
- **FR-006**: Each screen MUST show one question and name the next step. *(G-207)*
- **FR-007**: Legal terms and required documents MUST be explained in plain language on the same
  screen, before the question or upload control. *(G-7; K4 resolved in favor of G-7)*
- **FR-008**: Every screen MUST show how to reach a person for help. *(G-147)*
- **FR-009**: Every question MUST offer "I'm not sure", and unsure answers MUST be tagged for
  staff. *(G-318)*
- **FR-010**: The applicant MUST be able to say whether they are filling in the form alone or
  with a helper. *(G-133, G-134)*
- **FR-011**: When a helper is present, the system MUST ask the applicant to answer the danger
  questions privately and MUST NOT display those answers on any later screen. *(G-134, G-68;
  K5 resolved in favor of G-68)*
- **FR-012**: The eviction-notice date and the court appearance date MUST be asked as two
  separate questions. A court date before the notice date MUST be flagged for correction or
  marked "I'm not sure". *(G-81)*
- **FR-013**: Court dates entered on the form MUST be labeled "Reported by applicant, not
  verified" in the staff view only. *(G-30)*
- **FR-014**: A request MUST be marked urgent if the reported court appearance date is on or
  before 7 calendar days after the submission date (past dates included), or if danger is
  reported. *(G-406)*
- **FR-015**: Applicants MUST be able to upload photos of their notice, lease, court papers, and
  pay stubs, including multiple photos for one document type, with photo-taking instructions
  shown before the upload control. *(G-8, G-329)*
- **FR-016**: The system MUST tell the applicant immediately when an upload is unreadable or is
  the wrong page and let them reopen the file picker to replace it. *(G-96)*
- **FR-017**: The system MUST tell the applicant which required documents are missing, MUST
  still allow submission, and MUST record the missing documents on the request. *(G-95)*
  Required documents are those in the Document Requirements table below whose condition is met.
  Documents marked "requested, never missing" are asked for but are never reported as missing.

#### Document Requirements (applies to FR-015 and FR-017)

| Problem type | Document | Required when | Source |
|---|---|---|---|
| All | A notice about the problem, plus any other relevant documents | Always | C14, C68 |
| All | Pay stubs or other proof of income | The applicant reports any household income | C45, C68 |
| All | Notice or hearing paperwork showing the deadline | The request is urgent by date (FR-014) | C90 |
| Eviction or housing | Eviction notice (rent demand, termination notice, or holdover notice) | Always. Staff need it to check how and when it was served. | D22, D25, Gl10 |
| Eviction or housing | Lease | Always | D22, D25 |
| Eviction or housing | Court papers (petition, appearance date, index number) | Requested, never missing ("if they have them") | D22, D25 |
| Eviction or housing | Rent payment history | The household has Section 8, public housing, or a voucher | D15, D20 |
| Eviction or housing | Inspection notices | The household has a housing subsidy | D20 |
| Eviction or housing | Recertification paperwork | The household has a subsidy and reports recertification issues | D20 |

For an eviction case, the eviction notice satisfies the all-cases notice row. Court papers that
show the appearance date satisfy the deadline-paperwork row. To evaluate these conditions, the
eviction path MUST ask whether the household has Section 8, public housing, a voucher, or another
housing subsidy. If it has a subsidy, the path MUST also ask whether there are recertification
issues. Both questions offer "I'm not sure", and an unsure answer does not make the conditional
documents required.
- **FR-018**: Logged-in applicants MUST be able to save progress and resume later from the first
  unanswered question. *(G-10)*
- **FR-019**: When an applicant who is not logged in tries to save progress or check status, the
  system MUST ask them to log in or create an account. The applicant MUST be able to decline
  and continue without saving. *(G-405; see Open Issues K13, K14)*
- **FR-020**: Logged-in applicants MUST be able to see their request's status, which after
  submission reads "Waiting for staff review". *(G-142)*
- **FR-021**: After submission, the system MUST show a confirmation screen with a confirmation
  number and what it is for, the documents received, and when to expect a call: same day if
  urgent, otherwise within 2 business days. *(G-138)* An urgent request submitted during office
  hours MUST show "Expect a call today". An urgent request submitted outside office hours MUST
  show "Expect a call by the end of the next business day".
- **FR-022**: The system MUST NOT tell the applicant whether they qualify for help, and every
  request MUST be held as "Waiting for staff review". *(G-51, G-250)*
- **FR-023**: A staff list MUST show each submitted request with its urgent flag, "not sure"
  answers, missing documents, and unverified court dates. *(G-406, G-318, G-95, G-30)*
- **FR-024**: An "I'm not sure" answer to a danger question MUST count as danger reported for
  FR-014. *(G-406, G-318)*
- **FR-025**: Business days for FR-021 MUST exclude Saturdays and Sundays. Office hours for
  FR-021 are 9:00 am to 5:00 pm, Monday to Friday, in the office's local time. *(G-138)*
- **FR-026**: Account, document-storage, and staff-list features MUST be visibly labeled as
  simulated for the prototype. *(Constitution Principle IV; out-of-scope dependencies of G-8,
  G-142, G-406)*

### Key Entities

- **Help Request**: one applicant's intake. Attributes:
  - confirmation number
  - problem type
  - helper present (yes/no)
  - urgent flag and the reason (date or danger)
  - status (in progress, or Waiting for staff review)
  - submission time
  - list of missing required documents
- **Answer**: the applicant's response to one question. It belongs to a Help Request.
  Attributes:
  - question ID
  - value
  - unsure tag
  - source label (Reported) for court dates
  - private flag for danger answers given with a helper present
- **Question**: one form question. Attributes:
  - the problem types it applies to
  - section (deadline and danger, household, income, and so on)
  - plain-language explanation
  - next-step label
- **Uploaded Document**: a photo or file attached to a Help Request. Attributes:
  - document type (from the Document Requirements table)
  - readability result (readable, unreadable, wrong page)
- **Applicant Account (simulated)**: optional. It lets an applicant save in-progress requests and
  view the status of submitted ones.
- **Staff List Entry**: a read-only view of a Help Request for staff. It shows the urgent flag,
  unsure answers, missing documents, and unverified court dates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a usability walkthrough, at least 4 of 5 participants complete and submit the
  eviction path using fictional data, without facilitator help, in under 15 minutes.
- **SC-002**: A screen-by-screen audit finds the quick-exit button and the help contact on 100%
  of form screens.
- **SC-003**: Quick exit leaves the form in a single action on every screen, and in 100% of
  trials, pressing Back afterward does not show any applicant answers.
- **SC-004**: On a fixed set of fictional test requests, 100% of those with a court date within
  7 days, a past court date, or danger reported (including "not sure") are marked urgent. 0% of
  the others are.
- **SC-005**: 100% of test submissions show a confirmation number and the callback timeframe
  matching their urgency.
- **SC-006**: Across a full walkthrough of every path, 0 applicant-facing screens state or imply
  an eligibility outcome.
- **SC-007**: In the helper path, danger answers appear on 0 screens after the private section.
- **SC-008**: After the first screen, at least 4 of 5 participants can correctly say that the
  service is free and who will see their information.
- **SC-009**: For every test submission, the staff list correctly shows the urgent flag, the
  count of unsure answers, the missing documents, and the "unverified" label on court dates.

## Assumptions

- Document storage, accounts, and the staff list are mocked, and the prototype uses fictional
  data only.
- The readability check on uploads is simulated. For example, a test option marks an upload as
  unreadable or as the wrong page.
- Court dates and other answers are not checked against court records.
- Business days exclude weekends. Public holidays are not accounted for in the prototype.
- The mock office hours (9:00 am to 5:00 pm, Monday to Friday) are a prototype value and need
  to be confirmed with the legal aid office.
- Source codes in the Document Requirements table (for example, C14, D22, Gl10) refer to the
  team's interview evidence, the same codes the goal model uses.
- Problem types offered:
  - "Eviction or housing"
  - "Something else"
  - "I'm not sure"
  Only the eviction path has problem-specific questions. The others get the general questions.
- Danger-question wording uses placeholder text such as "Are you afraid someone may hurt you
  if they find out you contacted us?" It must be reviewed by legal-aid staff before any real use.
- The help contact is a fictional phone number and hours.
- Applicants mostly use a phone, so every screen must work at phone width.
- Out of scope:
  - phone intake
  - eligibility decisions and income rules
  - conflict checks
  - assigning attorneys
  - staff callbacks and messages
  - verifying court dates
  - real document storage

## Open Issues

- **K13 (G-405 vs G-155)**: requiring an account to save progress or see status adds effort for
  non-expert applicants. Unresolved and needs a stakeholder decision. FR-018 to FR-020 follow
  the current requirement and may change.
- **K14 (G-405 vs G-68)**: login emails or texts could reveal that someone contacted legal aid.
  Unresolved and needs a stakeholder decision. The prototype sends no real emails or texts.
