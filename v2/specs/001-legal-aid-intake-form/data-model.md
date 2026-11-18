# Data Model: Legal Aid Intake Form

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

All data lives in the browser (Principle IV). Persistent data and its storage keys are listed in
[contracts/storage.md](./contracts/storage.md). The IDs in parentheses trace each field to the
spec.

## Configuration entities (static, shipped with the app)

### Question

| Field | Type | Rules |
|---|---|---|
| `id` | string, for example `Q-COURT-DATE` | Unique and stable. Tests and answers refer to it. |
| `section` | `problem` \| `helper` \| `deadline` \| `danger` \| `housing` \| `household` \| `income` | Order is fixed. `deadline` and `danger` come before `household` and `income` (FR-005). |
| `appliesTo` | list of problem types, or `all` | Filtering rule (FR-004). `unsure` problem type sees only `all`. |
| `showIf` | optional condition on earlier answers | For example, the recertification question is shown only if the subsidy answer is yes (FR-017). |
| `kind` | `choice` \| `date` \| `number` \| `yesNo` | Every kind also accepts "I'm not sure" (FR-009). |
| `prompt` | plain-language text | One per screen (FR-006). |
| `explanation` | optional plain-language text | Shown above the answer controls (FR-007, K4). |
| `nextStepLabel` | text, for example "Next: your court date" | Computed from the next visible question if not set (FR-006). |
| `private` | boolean | `true` for danger questions (FR-011). |
| `staffLabel` | optional string | Staff-only detail for an unsure private answer; never shown to the applicant (FR-023). |
| `traces` | `{ fr: string[], goals: string[] }` | Must contain at least one FR ID (Principle II, R9). |

### DocumentRule

One rule per row of the spec's Document Requirements table.

| Field | Type | Rules |
|---|---|---|
| `type` | `problemNotice` \| `incomeProof` \| `deadlinePaperwork` \| `evictionNotice` \| `lease` \| `courtPapers` \| `rentHistory` \| `inspectionNotices` \| `recertPaperwork` | Unique |
| `appliesTo` | `all` \| `eviction` | |
| `requiredWhen` | `always` \| `hasIncome` \| `urgentByDate` \| `hasVoucherOrPublicHousing` \| `hasSubsidy` \| `subsidyAndRecertIssues` \| `never` | `never` means "requested, never missing" (court papers) |
| `satisfiedBy` | list of document types | `problemNotice` is satisfied by `evictionNotice`. `deadlinePaperwork` is satisfied by `courtPapers`. |
| `label`, `explanation` | plain-language text | FR-007 |
| `source` | interview codes, for example `D22, D25` | Copied from the spec table |

### OfficeConfig

| Field | Default | Rules |
|---|---|---|
| `timeZone` | `America/New_York` | R7 |
| `openHour` and `closeHour` | 9 and 17 | Open hour included, close hour excluded (spec edge case: 5:00 pm is after hours) |
| `businessDays` | Monday to Friday | FR-025. Holidays are ignored. |
| `helpContact` | fictional phone number and hours | FR-008 |
| `quickExitUrl` | `/neutral.html` | R3 |

## Runtime entities

### HelpRequest (FR-001, FR-014, FR-017, FR-021, FR-022)

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Internal |
| `confirmationNumber` | string `LA-YYMMDD-XXXX` | Set at submission. Unique among stored requests. |
| `problemType` | `eviction` \| `other` \| `unsure` | From the problem-type question |
| `helperPresent` | boolean \| `unsure` | FR-010. `unsure` is treated as a helper being present, which is the safer choice (K5). |
| `answers` | map from question ID to Answer | |
| `documents` | UploadedDocument[] | |
| `missingDocuments` | DocumentRule `type`[] | Derived at submission (FR-017) |
| `urgent` | `{ isUrgent: boolean, reasons: ("date" \| "danger")[] }` | Derived at submission (FR-014, FR-024) |
| `callbackMessage` | string | Derived at submission (FR-021, FR-025) |
| `status` | `draft` \| `waitingForStaffReview` | No other values. Eligibility outcomes are never stored (FR-022). |
| `ownerNickname` | string or null | Set only when saved under a mock account |
| `createdAt`, `submittedAt` | ISO timestamp | Taken from the injectable clock |

**State transitions**:

```text
(new) --start--> draft --submit--> waitingForStaffReview
draft --quickExit--> (discarded; not persisted unless previously saved under an account)
draft --saveAndFinishLater (logged in)--> draft (persisted to account)
```

No transition leaves `waitingForStaffReview` in the prototype. Staff actions are out of scope.

### Answer (FR-009, FR-011, FR-013)

| Field | Type | Rules |
|---|---|---|
| `questionId` | Question `id` | |
| `value` | string \| number \| ISO date \| boolean \| null | `null` when the applicant chose "not sure" |
| `unsure` | boolean | `true` makes the answer appear in the staff list (FR-023) |
| `source` | `"reported"` | Set on court and notice dates and shown only in the staff view as "Reported by applicant, not verified" (FR-013, G-30) |
| `private` | boolean | Copied from the question when `helperPresent` is not `false`. Private answers are never shown on applicant screens (FR-011). |

### UploadedDocument (FR-015, FR-016)

| Field | Type | Rules |
|---|---|---|
| `type` | DocumentRule `type` | |
| `fileName`, `mimeType`, `sizeBytes` | metadata only | Multiple files of the same type are allowed. Accepted types: `image/*` and `application/pdf`. Other types are rejected with a message (spec edge case). |
| `readability` | `readable` \| `unreadable` \| `wrongPage` | Comes from the simulation control (R6). Only `readable` documents count toward required documents and appear as received on the confirmation screen. |

### MockAccount (FR-018 to FR-020, FR-026)

| Field | Type | Rules |
|---|---|---|
| `nickname` | string, 1–30 characters | Unique in this browser. No password, email, or phone number (R5). |
| `draft` | HelpRequest (status `draft`) or null | At most one saved draft |
| `submittedConfirmationNumbers` | string[] | Used for the status screen (FR-020) |

### StaffListEntry (FR-023) — a view derived from HelpRequest

| Column | Derived from |
|---|---|
| Confirmation number and submitted time | `confirmationNumber`, `submittedAt` |
| Urgent | `urgent.isUrgent` plus the reasons (date or danger) |
| Not sure | number of answers with `unsure`, plus question prompts or staff-only labels for private answers |
| Missing documents | labels of `missingDocuments` |
| Court date | value plus "Reported by applicant, not verified" |
| Status | always "Waiting for staff review" |

The staff list may show that danger was reported, as the urgency reason. It is a staff view, not
an applicant screen, so FR-011 does not apply to it. It never shows an eligibility decision.

## Derived rules (see [contracts/rules.md](./contracts/rules.md))

- `visibleQuestions(problemType, answers)` → ordered Question[] (FR-004, FR-005, FR-017)
- `computeUrgency(answers, submittedAt, office)` → `urgent` (FR-014, FR-024)
- `requiredDocuments(problemType, answers, urgent)` → DocumentRule[] (FR-017)
- `missingDocuments(required, documents)` → type[] (FR-017)
- `callbackMessage(urgent, submittedAt, office)` → string (FR-021, FR-025)
