# Legal Aid Intake Form — prototype

A phone-first prototype of an online intake form for a legal aid office. It covers
`specs/001-legal-aid-intake-form/` (spec, plan, tasks) and goal G-400 in
`goal-models/v1_prototype_goal_model.py`.

**Everything is fictional and stays in your browser.**
- There is no server, no real login, and no network calls (Constitution Principle IV).
- Submitted requests and mock accounts are kept in `localStorage`.
- Uploaded files are never stored; only their names and sizes are kept.
- Use made-up information only.

## Run it

Requires Node.js 22 or later.

```bash
cd frontend
npm install
npx playwright install chromium   # one-time, for the end-to-end tests
npm run dev                       # http://localhost:5173
```

| Page | Address |
|---|---|
| Applicant form | http://localhost:5173/#/ |
| Mock account (save, resume, status) | http://localhost:5173/#/account |
| Mock staff list | http://localhost:5173/#/staff |

The staff list has a **Clear prototype data** button that resets the stored requests and accounts.

## Test it

```bash
npm test           # unit and component tests (Vitest)
npm run test:e2e   # end-to-end tests for every acceptance scenario (Playwright, 360×640 phone viewport)
npm run trace      # fails if any US#-AS#, FR-### or SC-### in the spec is not cited by a test title
npm run build      # type-check and build static files into dist/
```

Every test title starts with the scenario or requirement ID it covers, such as `US1-AS10` or
`FR-014` (Constitution Principles I and II). SC-001 and SC-008 are usability checks run by
hand; see `specs/001-legal-aid-intake-form/quickstart.md`.

## Configuration

Placeholder values to confirm with the legal aid office live in `src/config/office.ts`:

| Setting | Value |
|---|---|
| Office time zone | `America/New_York` |
| Office hours | 9:00 am (included) to 5:00 pm (excluded), Monday to Friday |
| Help contact | (555) 010-0199, a fictional number |
| Quick-exit page | `/neutral.html`, a bundled weather page |

Text that needs review lives in two files:
- **Questions:** `src/config/questions.ts`. The danger questions are placeholders marked `TODO: staff review`.
- **Document rules:** `src/config/documents.ts`.

Each question and document rule lists the FR and goal IDs it implements, and a unit test fails
if any entry has none.

## Where things are

| Path | What it holds |
|---|---|
| `src/rules/` | Pure decision logic: which questions show, urgency, callback wording, required documents |
| `src/state/` | In-memory intake store, `localStorage` adapter, mock accounts, injectable clock |
| `src/components/`, `src/pages/` | Screens |
| `tests/unit`, `tests/component`, `tests/e2e` | Tests, named by spec ID |
