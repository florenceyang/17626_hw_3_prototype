# Contract: Screens and Routes

The prototype's external interface is its user interface. This contract lists every screen,
the route it lives at, and what each screen must guarantee. End-to-end tests depend on the
**test IDs** and **text** listed here, so changing either is a contract change.

## Routing

- Hash-based routes, such as `#/staff`, so the app works as static files.
- Form steps are **not** routes. While the form is in progress, the address stays `#/form` and
  no browser history entries are added (R3).

| Route | Screen | Stories |
|---|---|---|
| `#/` | Welcome: the service is free, who sees the information, and a "Start" button | US1-AS1 |
| `#/form` | Question flow, one question per screen, then upload, review, and submit | US1–US3 |
| `#/confirmation` | Confirmation screen | US1-AS9, US1-AS10, US1-AS12, US3-AS4 |
| `#/account` | Mock log-in or create-account screen, and the status screen | US5 |
| `#/staff` | Mock staff list | US4 |
| `/neutral.html` | Neutral page that quick exit goes to (a separate static file) | US2-AS2 |

## Elements on every applicant screen (`#/`, `#/form`, `#/confirmation`, `#/account`)

| Element | Test ID | Guarantee | Trace |
|---|---|---|---|
| Quick-exit button | `quick-exit` | Visible at a 360×640 viewport without scrolling. Label: "Quick exit". | FR-003, US2-AS1 |
| Help contact | `help-contact` | Shows the fictional phone number and hours | FR-008, US2-AS3 |
| Mock banner | `mock-banner` | Shown on `#/account` and `#/staff`: "Simulated for this prototype" | FR-026 |

## Question screen (`#/form`)

| Element | Test ID | Guarantee | Trace |
|---|---|---|---|
| Question | `question` (with `data-question-id`) | Exactly one per screen | FR-006, US1-AS4 |
| Explanation | `explanation` | Comes before the answer controls in the page | FR-007, US1-AS5 |
| "I'm not sure" option | `unsure` | Present on every question | FR-009, US1-AS6 |
| Next-step line | `next-step` | Text starts with "Next:" | FR-006, US1-AS4 |
| Private-answers screen | `private-gate` | Shown before the danger questions when a helper is present | FR-011, US2-AS5 |
| Save and finish later | `save-later` | Opens the account prompt if not logged in. Can be declined. | FR-019, US5-AS1 |

## Upload step (inside `#/form`)

| Element | Test ID | Guarantee | Trace |
|---|---|---|---|
| Photo instructions | `photo-instructions` | Comes before the first upload control in the page | FR-015, US3-AS1 |
| Document slot | `doc-slot-<type>` with `data-required="true\|false"` | One slot per document type that applies | FR-017, US3-AS1, US3-AS5 |
| Simulated result control | `simulate-<type>` | Options: Readable, Unreadable, Wrong page | FR-016, R6 |
| Upload problem message | `doc-problem-<type>` | Appears right after an unreadable or wrong-page upload | FR-016, US3-AS2 |
| Missing-documents message | `missing-docs` | Names each missing required document. Submit stays enabled. | FR-017, US3-AS3, US3-AS6 |

## Review screen (inside `#/form`)

- Court and notice dates show "Reported by applicant, not verified" (FR-013, US1-AS8).
- Private (danger) answers are never shown (FR-011, US2-AS6).

## Confirmation screen (`#/confirmation`)

| Element | Test ID | Guarantee | Trace |
|---|---|---|---|
| Confirmation number | `confirmation-number` | Matches `LA-YYMMDD-XXXX`, with a sentence saying what it is for | FR-021 |
| Documents received | `docs-received` | Lists each readable document by type, or "None" | FR-021, US3-AS4 |
| Callback message | `callback` | Exactly one of: "Expect a call today", "Expect a call by the end of the next business day", "Expect a call within 2 business days" | FR-021, FR-025 |
| Status | `status` | "Waiting for staff review" | FR-022, US1-AS11 |

No applicant screen may contain eligibility wording. The words "qualify", "eligible", "approved",
"denied", and "accepted" are checked by a test (SC-006).

## Account screens (`#/account`)

| Element | Test ID | Guarantee | Trace |
|---|---|---|---|
| Nickname field | `nickname` | The only input. No password, email, or phone field. | R5, FR-026 |
| Continue without account | `decline-account` | Returns to the form with answers kept in memory | FR-019, US5-AS1 |
| Status | `account-status` | "Waiting for staff review" for each submitted request | FR-020, US5-AS3 |

## Staff list (`#/staff`)

Each row uses test ID `staff-row` with `data-confirmation`. Its columns are listed in
[data-model.md](../data-model.md#stafflistentry-fr-023--a-view-derived-from-helprequest). The page
shows the mock banner and no eligibility column (US4-AS5).
