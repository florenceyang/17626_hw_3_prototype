# Sprint goal model: online intake form (V1)

Model: `goal_model_online_intake.py` (built with cmu-relab/goalmodeling; a subset of the team model `goal_model_combined.py`).
Run `python3 goal_model_online_intake.py --trace` for the Mermaid diagram, the mermaid.live link and every table below.

## Scope

- **In scope:** the online form, from starting it until the submission is waiting for staff review.
- **Accounts:** optional to start the form; required to save progress or to see status.
- **Out of scope:**
  - phone intake
  - all staff work after submission, which is mocked
- **Size:** 35 goals, 24 of them leaves.
- **Top-level goals:**
  - the sprint root **G-400 OnlineHelpRequestSubmittedAndReadyForStaffReview**
  - **G-155**, the soft goal that the intake is understandable and low-effort
  - **G-250**, keeping human judgment over applicant outcomes

| Area | Goals |
|---|---|
| Question form (G-404) | G-6 only applicable questions, G-7 terms explained first, G-207 one question per screen in short steps |
| Completing the form (G-132) | G-133 applicant alone **or** G-134 with a trusted helper, each using G-404 |
| Submission (G-5) | G-138 confirmation screen, G-142 "Waiting for staff review" status (logged-in applicants only), G-313 no login to start, G-317 → G-318 unsure tag, G-51 no automated decision |
| Account and saved progress | G-10 save and resume (logged-in applicants only), G-405 prompt to log in or create an account when saving or checking status |
| Court dates and urgency (G-401) | G-15 deadline and danger questions asked first, G-81 notice date and appearance date reported separately, G-30 marked Reported (unverified), G-406 marked urgent if the reported appearance date is within 7 days **or** danger is reported |
| Documents (G-402) | G-8 upload, G-329 photo instructions, G-96 unreadable page flagged, G-95 missing document flagged; mock storage |
| Privacy and safety (G-403) | G-68 → G-71 quick exit, G-323 who sees the information |
| Soft-goal contributions | G-157 no cost up front, G-147 help contact |

## Decisions applied

### Conflicts (links kept unless noted)

| ID | Goals | Decision |
|---|---|---|
| K4 | G-207 vs G-7 | Prioritize **G-7**: terms are explained before the question. G-156 was merged into G-207 (O1), so K4 now links G-207. |
| K5 | G-134 vs G-68 | Prioritize **G-68**: the safety-sensitive situation stays hidden. The helper alternative remains but may not weaken it. |
| K11 | G-10 vs G-313 | Compromise: the form can be started without a login (G-313), but saving and resuming require one (G-10). G-405 prompts the applicant to log in or sign up. |
| K13 | G-405 vs G-155 | **Resolution not chosen.** Requiring an account to save or see status adds effort for non-expert applicants such as Gloria, who needed help with the form (Gl:10,37). |
| K14 | G-405 vs G-68 | **Resolution not chosen.** Logging in or signing up by email or text can leave a trace that the applicant contacted legal aid (C:90, Gl[77]). |
| K12 | G-10 vs G-68 | Not a real conflict once phone scope is removed. Link removed; the reasoning stays recorded here. |

### Overlaps

| ID | Decision |
|---|---|
| O1 | One combined question form, **G-404**. G-156 and G-312 are merged into G-207, and the phone-intake wording is removed. |
| O2 | One confirmation screen, **G-138**, which absorbs G-139, G-140 and G-151. |
| O3 | **G-9** removed (contradictory answers are hard to measure). Keep the concrete goals G-318 and G-95. |
| O4 | **G-335** removed. Keep G-323 and G-157. |
| O5 | **G-267** merged into G-81. |

### Dependencies

| Goal | Decision |
|---|---|
| G-15 | Back in scope: danger questions stay on the form (answer 4 below). |
| G-81 / G-267 | Form values are treated as unverified: G-30 marks them *Reported*. |
| G-51 / G-9 | Add a "Waiting for staff review" status (G-142). |
| G-151 | Callback timeframe: urgent = same day; everything else = within 2 business days (now in G-138). |
| G-342 | Removed from the sprint. |
| G-8, G-95 | Legal documents use mock storage. |
| G-314 | Out of sprint scope. |
| G-318 | Applicants tag answers they are unsure of. |
| Phone scope | G-58 removed. G-10, G-207 and G-250 reworded for the online form. |

All removed and merged goals remain in the team model. Only the sprint subset changed.

## Dependencies on out-of-scope goals (mocked)

| In-scope goal | Out-of-scope goals | Prototype handling |
|---|---|---|
| G-138 | G-17, G-14, G-327 | Promises a same-day callback when urgent; staff review is mocked |
| G-15 | G-14, G-16, G-17 | Danger answers are for staff; staff review is mocked |
| G-406 | G-14, G-17, G-100 | Urgent flag shown on a mock staff queue; based on an unverified date or the danger answer |
| G-81 | G-80, G-82, G-268 | Dates shown as unverified; docket check later |
| G-142, G-51 | G-34, G-27 | Submission held at "Waiting for staff review" |
| G-318, G-95 | G-47, G-279 | Staff follow-up is mocked |
| G-8 | G-89, G-44 | Documents go to mock storage |

## Answers to the follow-up questions

| # | Question | Answer | Model change |
|---|---|---|---|
| 1 | What counts as urgent? | The reported appearance date is within 7 days, or danger is reported (same as team definition I3) | New G-406; G-138 refers to it |
| 2 | How does an applicant resume? | Only with a login. An applicant who isn't logged in and wants to save is asked to log in or create an account | G-10 reworded; new G-405; K11 is now a compromise |
| 3 | Where is the status shown? | Only to applicants with an account | G-142 reworded; G-405 also covers status |
| 4 | Keep the danger questions? | Yes | G-15 back in scope, under G-401 |

## Still to decide

- **K13 (login vs. low effort):** prioritize one goal, find a compromise (for example, save with just a phone number or a short PIN), or leave it unresolved and ask Gloria.
- **K14 (login vs. safety):** prioritize one goal, find a compromise (for example, a neutral sender name and no "legal aid" wording in login messages), or leave it unresolved and ask Carmen.
