# Contract: Rules

These pure functions hold all the decision logic. They do no input or output and read no hidden
clock: "now" is always passed in. Unit tests treat these signatures and the examples below as
the contract. Each example becomes at least one test whose name cites the listed ID.

## `visibleQuestions(problemType, answers) → Question[]`

- **FR-004**: returns questions whose `appliesTo` includes `problemType` or `all`. For
  `unsure`, only `all` questions are returned.
- **FR-005**: section order is
  problem → helper → deadline → danger → housing → household → income.
- **FR-017**: `showIf` conditions are applied, so the recertification question appears only if
  the subsidy answer is yes.

| Example | Expected | Trace |
|---|---|---|
| `eviction`, no answers | Includes the notice-date and court-date questions as two separate entries | FR-012, US1-AS7 |
| `other` | Excludes the eviction-only questions | FR-004, US1-AS2 |
| `unsure` | Only `all` questions | Edge case |
| Any type | Every `deadline` or `danger` question comes before the first `household` or `income` question | FR-005, US1-AS3 |

## `computeUrgency(answers, submittedAt, office) → { isUrgent, reasons }`

| Court date relative to the submission date (office time zone) | Danger answer | Expected | Trace |
|---|---|---|---|
| +7 days | no | urgent, reason `date` | Edge case (inclusive), FR-014 |
| +8 days | no | not urgent | US4-AS3 |
| −3 days (past) | no | urgent, reason `date` | Edge case |
| not sure, no date | no | not urgent | Edge case |
| +30 days | yes | urgent, reason `danger` | US4-AS2 |
| +30 days | not sure | urgent, reason `danger` | FR-024 |
| +2 days | yes | urgent, reasons `date` and `danger` | FR-014 |

## `callbackMessage(urgent, submittedAt, office) → string`

Times are in `America/New_York`.

| Submitted at | Urgent | Expected | Trace |
|---|---|---|---|
| Tuesday 10:00 | yes | "Expect a call today" | US1-AS10 |
| Tuesday 9:00 (opening) | yes | "Expect a call today" | R7 boundary |
| Tuesday 17:00 (closing) | yes | "Expect a call by the end of the next business day" | Edge case |
| Tuesday 21:00 | yes | "Expect a call by the end of the next business day" | US1-AS12 |
| Saturday 10:00 | yes | "Expect a call by the end of the next business day" | US1-AS12 |
| Any time | no | "Expect a call within 2 business days" | US1-AS9 |

## `requiredDocuments(problemType, answers, urgent) → DocumentRule[]` and `missingDocuments(required, documents) → type[]`

| Case | Required | Optional (listed, never missing) | Trace |
|---|---|---|---|
| Eviction, Section 8, recertification issues, no income, not urgent | eviction notice, lease, rent history, inspection notices, recertification paperwork | court papers | US3-AS5 |
| Eviction, no subsidy, no income, court date +30 days | eviction notice, lease | court papers | US3-AS6 |
| Eviction, subsidy answered "not sure" | eviction notice, lease | court papers, rent history, inspection notices, recertification paperwork | Edge case |
| Other, income reported, urgent by date | problem notice, income proof, deadline paperwork | — | FR-017 |
| Eviction, urgent by date, court papers uploaded | The deadline-paperwork requirement is satisfied by the court papers | | FR-017 note |

- Only documents with readability `readable` count toward satisfying a requirement.
- `missingDocuments` never returns a type whose rule is `never`.

## Traceability guard

`allConfigTraced()` returns the question and document-rule IDs that have no FR ID. A unit test
asserts the result is empty (Principle II).
