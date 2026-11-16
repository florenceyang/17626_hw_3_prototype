# Research: Legal Aid Intake Form

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-15

Each section records a decision, why it was chosen, and the alternatives considered. All
decisions are bounded by the constitution:

- **Principle III**: code lives only in `frontend/`.
- **Principle IV**: no authentication, backend, or external APIs.

## R1. Application stack

- **Decision**: a single-page app built with React and TypeScript, bundled with Vite. It is
  served as static files from `frontend/`.
- **Rationale**:
  - The spec needs many small, stateful screens (one question per screen), which React's
    component model handles well.
  - TypeScript catches mistakes in the question and rule definitions, which carry requirement
    IDs.
  - Vite builds a static bundle with no server-side runtime, which satisfies Principle IV.
  - Collaborators can run it with `npm install` and `npm run dev`.
- **Alternatives considered**:
  - Plain HTML and JavaScript: no build step, but harder to test, and branching question logic
    grows messy.
  - Next.js: adds server rendering and API routes, which tempts a backend (Principle IV).
  - Vue or Svelte: equally capable, but the team has no stated preference and React has the
    most testing examples.

## R2. Testing approach (Principle I)

- **Decision**: use three layers, and have every test name cite its scenario or requirement ID.
  The convention is `US1-AS7` for User Story 1, Acceptance Scenario 7, and `FR-014` for a
  requirement.
  1. **Vitest unit tests** for pure rules: urgency, callback wording, required documents,
     question filtering, and next-step labels.
  2. **Vitest and React Testing Library component tests** for screen-level behavior: one
     question per screen, the "I'm not sure" option, and the quick-exit and help bar.
  3. **Playwright end-to-end tests** for each acceptance scenario that crosses screens: the
     full submit path, quick exit with the Back button, the helper privacy path, the staff
     list, and the mock account.

  The usability criteria SC-001 and SC-008 are scripted manual checks in
  [quickstart.md](./quickstart.md).
- **Rationale**:
  - Pure rules can be tested exhaustively, including boundaries such as exactly 7 days and
    exactly 5:00 pm.
  - Browser-level behavior (history, Back button, page replacement) can only be shown in a
    real browser.
  - Citing IDs in test names makes the traceability check in `/speckit-analyze` mechanical.
- **Alternatives considered**:
  - End-to-end tests only: slow, and boundary cases are awkward to set up.
  - Manual checks only: violates Principle I's "maps to at least one test" for checkable
    behavior.

## R3. Quick exit that defeats the Back button (FR-003, US2-AS2, SC-003)

- **Decision**:
  1. Form steps never add browser history entries. Step changes are app state, not new URLs.
  2. On quick exit, the app clears all in-memory answers and logs out. An account draft that the
     applicant previously chose to save remains in browser storage and can be resumed after
     logging in again; unsaved form changes are discarded.
  3. Then it calls `location.replace()` to load a neutral page. `replace` swaps out the
     current history entry, so Back skips the form.
  4. A `pageshow` listener blanks and reloads the app if the browser restores it from its
     back/forward cache.
  5. The quick-exit button is fixed at the top of the screen and also responds to pressing
     Escape three times.
- **Neutral page**: a bundled, unrelated static page (`frontend/public/neutral.html`, a
  generic weather page). Its URL is a single configuration value.
- **Rationale**:
  - The bundled page works offline and in automated tests.
  - A real deployment would point the same setting at a common external site; that is a link,
    not an API call.
- **Alternatives considered**:
  - `window.open` plus closing the tab: browsers block closing tabs the script did not open.
  - Pushing a history entry for each question: makes Back reveal earlier answers, which
    violates FR-003.
  - Linking to an external site in the prototype: fails offline and in continuous
    integration.

## R4. Where state lives (Principle IV, edge case "leaves without logging in")

- **Decision**:
  - An anonymous draft lives only in memory. Refreshing or leaving loses it, as the spec
    states, and the app warns the applicant before they leave through the form's own controls.
  - Submitted requests are written to `localStorage` under a versioned key. This lets the mock
    staff list in the same browser see them.
  - Mock accounts and their saved drafts are also stored in `localStorage`.
  - Uploaded files are kept only as metadata (type, file name, size, readability result). File
    contents are not stored.
- **Rationale**:
  - Keeping anonymous drafts out of persistent storage matches the K14 and G-68 safety intent:
    nothing remains on a shared phone.
  - `localStorage` is the simplest in-browser store that survives "leave and return" (US5-AS2).
  - Storing only metadata avoids keeping sensitive images and avoids storage quota problems.
- **Alternatives considered**:
  - IndexedDB: more capable, but not needed for small records.
  - `sessionStorage` for drafts: survives a refresh, so an abuser could see answers on a
    shared device.
  - Storing file contents as data URLs: hits the roughly 5 MB quota and keeps sensitive images
    around.

## R5. Simulated account (FR-018 to FR-020, FR-026, Principle IV)

- **Decision**:
  - "Create account" and "Log in" ask only for a nickname. There is no password, email, or
    text.
  - A banner says "Simulated account for this prototype. Do not enter real information."
  - The logged-in nickname is held in memory for the visit only.
- **Rationale**:
  - Principle IV forbids real authentication.
  - Collecting no email or phone number avoids the K14 trace risk in the prototype.
  - K13 and K14 stay open for stakeholders. The prompt flow (FR-019) can still be evaluated.
- **Alternatives considered**:
  - A fake password field: looks like real security and invites real passwords.
  - Skipping accounts entirely: drops FR-018 to FR-020 and US5.

## R6. Simulated readability check (FR-016)

- **Decision**:
  - Each upload slot has a control labeled "Prototype: simulate result" with three options:
    Readable (the default), Unreadable, and Wrong page.
  - The chosen result appears immediately after upload.
  - Files that are not an image or PDF are rejected by type.
- **Rationale**:
  - Real image analysis needs an external service, which Principle IV forbids.
  - An explicit control makes US3-AS2 deterministic in tests and in demonstrations.
- **Alternatives considered**:
  - Guessing from the file name (for example, "blurry"): hidden behavior that confuses
    usability participants.
  - Checking image resolution in the browser: partial and unreliable for "wrong page".

## R7. Office hours, business days, and time zone (FR-021, FR-025)

- **Decision**:
  - Office hours are 9:00 am to 5:00 pm, Monday to Friday. The start is included and the end
    is excluded, so 5:00 pm is after hours.
  - Times are in a configured office time zone, `America/New_York` by default. The app uses the
    browser's built-in `Intl.DateTimeFormat` with no date library.
  - The current time comes from an injectable clock, so tests can fix "now".
  - Rule for urgent requests:
    - Submitted inside office hours: "Expect a call today".
    - Otherwise: "Expect a call by the end of the next business day".
  - Non-urgent requests always get "Expect a call within 2 business days".
- **Rationale**:
  - The time-zone setting keeps the result correct when a tester's device is in another zone.
  - An injectable clock makes the boundary scenarios testable (Principle I).
- **Alternatives considered**:
  - The device's local time: gives wrong wording for testers in other zones.
  - A date library such as date-fns-tz: an extra dependency the built-in API already covers.

## R8. Urgency date arithmetic (FR-014, FR-024)

- **Decision**:
  - Compare calendar dates, not timestamps, in the office time zone.
  - The request is urgent by date if the court date is on or before the submission date plus 7
    days. Past court dates are urgent.
  - A court date marked "not sure" with no date entered is not urgent by date.
  - Any danger answer of "yes" or "not sure" makes the request urgent by danger.
  - Both reasons are recorded.
- **Rationale**: this matches the inclusive boundary and the edge cases in the spec, and comparing
  dates avoids daylight-saving off-by-one errors.

## R9. Question definitions and traceability (Principle II)

- **Decision**:
  - Questions, document rules, and screen copy are declared as data in typed configuration
    files.
  - Each entry carries the requirement IDs (FR-###) and goal IDs (G-###) it implements.
  - A unit test asserts that every question and document rule has at least one FR ID.
- **Rationale**:
  - Traceability then lives in the code next to the behavior.
  - Wording changes, such as the danger questions that staff still need to review, are edits
    to data, not to logic.
- **Alternatives considered**: hard-coding each screen as a component. That spreads questions
  across files and makes filtering by problem type (FR-004) harder.

## R10. Mobile-first layout and accessibility

- **Decision**:
  - Lay out for a 360 px wide screen first.
  - Keep the quick-exit and help bar always visible.
  - Make touch targets at least 44 px.
  - Use semantic form controls with labels.
  - Run an automated accessibility check with axe on each screen in the end-to-end suite.
- **Rationale**:
  - Applicants mostly use phones (spec Assumptions).
  - "Visible without scrolling" (US2-AS1) depends on the layout.
  - Plain-language goals (G-155) also benefit from accessible markup.
- **Alternatives considered**: desktop-first layout, rejected because of the spec's phone
  assumption.

## Resolved unknowns

No "NEEDS CLARIFICATION" items remain in the Technical Context. Choices left to configuration:

- the neutral exit page URL
- the office time zone
- the help contact number

These are recorded as configuration values, not open questions.
