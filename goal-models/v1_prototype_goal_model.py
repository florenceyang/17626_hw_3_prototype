"""
17-626 HW3, Step 2: sprint-scope goal model - ONLINE INTAKE FORM, with the team's decisions applied.
Built with https://github.com/cmu-relab/goalmodeling. Subset of goal_model_combined.py.

Run:  python3 goal_model_online_intake.py           -> Mermaid definition + view link
      python3 goal_model_online_intake.py --trace   -> also prints goals, decisions, sprint merges,
                                                       removals and boundary dependencies

Scope
  The applicant-facing online form, from starting the form until the submission is waiting for staff
  review. Phone intake (calls, call recording, call load) is out of scope. "Phone" in G-207's merged
  wording and in the obstacle SessionStoppedByPhoneStorage means the applicant's mobile phone, which
  is how Gloria filled in the form (Gl:10,37). Staff work after submission is out of scope; where an
  in-scope goal depends on it, the dependency is in BOUNDARY and is mocked in the prototype.
  An account is optional to start the form but required to save progress and to see status (Q2, Q3).

Traceability
  Goals keep their ID, sources and STATED/DERIVED tag from goal_model_combined.py.
  Goals rewritten by a sprint decision are listed in REWRITTEN; duplicates merged for the sprint are in
  SPRINT_MERGES (retired ID -> retained ID); goals taken out of the sprint are in REMOVED (they stay in
  the combined model). New sprint goals: G-400..G-404 (DERIVED).
  Source notation: C:22 = Model A transcript row, C[8] = Model B transcript turn.

Diagram highlighting (Mermaid style lines added after generate_graph)
  red fill      = goal in a conflict; the prioritized goal carries a dashed note "Kn: prioritized"
  green fill    = goal rewritten, combined or added by a sprint decision
  dashed border = depends on or feeds an out-of-scope goal (mocked in the prototype)
"""
import sys
from goalmodeling.schema import *

SHOW_OPERATIONS = False

APPLICANT = ("Applicant", AgentType.ENVIRONMENT_AGENT)
HELPER = ("TrustedHelper", AgentType.ENVIRONMENT_AGENT)
SYSTEM = ("IntakeSystem", AgentType.SOFTWARE_AGENT)

TRACE = []   # (id, type, name, sources, STATED/DERIVED)
NODES = {}   # id -> vertex, used for highlighting


def by(agent, operation):
    name, kind = agent
    category = (OperationCategory.SOFTWARE_TO_BE_OPERATION if kind == AgentType.SOFTWARE_AGENT
                else OperationCategory.ENVIRONMENT_OPERATION)
    op = Operation(operation, category) if SHOW_OPERATIONS else None
    return [PerformanceLink(Agent(name, kind), op)]


def goal(cls, gid, name, src, stated=True, **kw):
    g = cls(f"{gid}: {name}", **kw)
    TRACE.append((gid, cls.__name__.replace("Goal", ""), name, src, "STATED" if stated else "DERIVED"))
    NODES[gid] = g
    return g


def leaf(cls, gid, name, src, agent, operation, stated=True, annotation=""):
    return goal(cls, gid, name, src, stated, performs=by(agent, operation), leaf=True, annotation=annotation)


# ===========================================================================
# 1. Question form (O1: one combined question form)
# ===========================================================================
g6 = leaf(AchieveGoal, "G-6", "OnlyApplicableQuestionsShown <b>If</b> ProblemTypeSelected", "C:68",
          SYSTEM, "FilterQuestionsByProblemType")
g7 = leaf(AchieveGoal, "G-7", "TermsAndRequiredDocumentsExplainedInPlainLanguage <b>Before</b> QuestionAsked",
          "C:68 | Gl:10,25,27,39 | Gl[26][28][33]", SYSTEM, "ShowPlainLanguageDefinitions",
          annotation="K4: prioritized")
# O1: G-156 (short steps on a phone) and G-312 (next step after each screen) merged into G-207; phone-intake wording removed
g207 = leaf(AchieveGoal, "G-207", "OneQuestionPerScreenInShortStepsWithNextStepShown",
            "Gl:10,37 | C[8] | Gl[66]", SYSTEM, "PresentOneQuestionPerScreen")
g404 = goal(AchieveGoal, "G-404", "OnlineQuestionFormPresented", "C:68 | Gl:10,37,39 | Gl[66]", stated=False,
            refinements=[Refinement(False, [g6, g7, g207], "H4")])

# ===========================================================================
# 2. Completing the form (alone OR with a helper)
# ===========================================================================
g133 = leaf(AchieveGoal, "G-133", "FormFilledByApplicant", "Gl:10,37", APPLICANT, "FillInForm")
g134 = leaf(AchieveGoal, "G-134", "FormFilledWithTrustedHelper", "Gl:10,50,52,54 | Gl[31][56][80]",
            HELPER, "AssistWithForm")
g132 = goal(AchieveGoal, "G-132", "IntakeFormCompleted", "Gl:10",
            refinements=[Refinement(False, [g133, g404], "H6"),     # applicant alone
                         Refinement(False, [g134, g404], "H6")])    # with a helper (G-314 out of scope)

# ===========================================================================
# 3. Submission, confirmation and status
# ===========================================================================
# O2: G-139, G-140 and G-151 merged into G-138 (one confirmation screen); timeframe from the G-151 decision
g138 = leaf(AchieveGoal, "G-138",
            "ConfirmationScreenShown (confirmation number and its purpose, documents received, "
            "callback timeframe: same day <b>If</b> Urgent (G-406), otherwise within 2 business days)",
            "Gl:10,12,17,20,34,37,56 | Gl[20][71][74]", SYSTEM, "ShowConfirmationScreen")
# G-51/G-9 decision: status "Waiting for staff review"
g142 = leaf(AchieveGoal, "G-142", "CurrentStageShownInPlainWords (WaitingForStaffReview <b>After</b> Submission) <b>If</b> ApplicantLoggedIn",
            "Gl:20,39,64", SYSTEM, "ShowStage")
g313 = leaf(AchieveGoal, "G-313", "IntakeStartable <b>Without</b> Login", "Gl[64]", SYSTEM, "AllowAnonymousStart")
# G-318 decision: applicants tag answers they are unsure of
g318 = leaf(AchieveGoal, "G-318", "UnsureTagAvailableOnEachAnswer <b>And</b> TaggedAnswersFlaggedForStaff",
            "Gl[28][31][33]", SYSTEM, "OfferUnsureTag", stated=False)
g51 = leaf(AvoidGoal, "G-51", "EligibilityOrHelpDecidedByAutomation <b>Without</b> StaffOrLawyerReview",
           "C:68,83,92 | C[16][21] | Gl[68]", SYSTEM, "HoldForStaffReview")
g317 = goal(AvoidGoal, "G-317", "HelpRequestLostBecauseOfFormError", "Gl[28][31][33]",
            refinements=[Refinement(False, [g318, g51], "H8")])
g5 = goal(AchieveGoal, "G-5", "IntakeSubmittedViaOnlineForm", "C:61,63,68 | Gl:10,50,52 | Gl[31][33][66]",
          refinements=[Refinement(False, [g132, g138, g142, g313, g317], "P1")])
g10 = leaf(MaintainGoal, "G-10", "IntakeProgressSavedAndResumable <b>If</b> ApplicantLoggedIn",
           "C:45,68 | Gl:10,17 | Gl[66]", SYSTEM, "SavePartialIntake", annotation="K11: save needs login")
# Q2 + Q3: an account is optional to start, required to save progress or see status
g405 = leaf(AchieveGoal, "G-405",
            "LoginOrAccountCreationPrompted <b>If</b> NotLoggedIn <b>And</b> (WantsToSaveProgress <b>Or</b> WantsToSeeStatus)",
            "Gl:10,17,20 | Gl[64]", SYSTEM, "PromptLoginOrSignUp", stated=False)

# ===========================================================================
# 4. Court dates and urgency captured on the form (court dates unverified)
# ===========================================================================
# Q4: danger questions kept, so G-15 is back in scope
g15 = leaf(AchieveGoal, "G-15", "DeadlineAndDangerAsked <b>Before</b> EligibilityQuestions", "C:57,87",
           SYSTEM, "PromptUrgencyQuestionsFirst")
# Q1: urgent = reported appearance date within 7 days OR danger reported (team definition I3)
g406 = leaf(AchieveGoal, "G-406",
            "SubmissionMarkedUrgent <b>If</b> ReportedAppearanceDateWithin7Days <b>Or</b> DangerReported",
            "C:57,87 | D:80,83 | D[13]", SYSTEM, "MarkUrgent", stated=False)
# O5: G-267 merged into G-81
g81 = leaf(AchieveGoal, "G-81", "CourtDatesReportedByApplicant <b>With</b> NoticeDateDistinguishedFromAppearanceDate",
           "D:7,12 | Gl:10 | D[13][22] | Gl[28][66]", APPLICANT, "ReportCourtDates")
g30 = leaf(AchieveGoal, "G-30", "InfoSourceMarked (Reported | Estimated | Verified)", "C:41,45",
           SYSTEM, "TagInfoProvenance")
g401 = goal(AchieveGoal, "G-401", "CourtDatesAndUrgencyCapturedOnForm", "C:57,87 | D:7,12,80 | Gl:10 | Gl[28]",
            stated=False, refinements=[Refinement(False, [g15, g81, g30, g406], "H4")])

# ===========================================================================
# 5. Documents uploaded with the form (mock storage)
# ===========================================================================
g8 = leaf(AchieveGoal, "G-8", "NoticesLeaseCourtPapersAndPayStubsSentElectronically <b>If</b> ApplicantCanSendElectronically",
          "C:45,68 | D:22 | Gl:10 | D[58]", APPLICANT, "UploadDocuments")
g329 = leaf(AchieveGoal, "G-329", "ClearPhotoAndUploadInstructionsGiven", "Gl[56][58][61]",
            SYSTEM, "ShowPhotoInstructions")
g96 = leaf(AchieveGoal, "G-96", "UnreadableOrWrongPageFlagged <b>At</b> Upload", "D:28", SYSTEM, "CheckImageQuality")
g95 = leaf(AchieveGoal, "G-95", "MissingRequiredDocumentFlaggedImmediatelyAndTrackedOnRecord",
           "D:22,25 | C[56][65]", SYSTEM, "TrackDocumentCompleteness")
g402 = goal(AchieveGoal, "G-402", "KeyDocumentsUploadedLegiblyWithForm", "D:22,28 | Gl:10 | Gl[56][58]", stated=False,
            refinements=[Refinement(False, [g8, g329, g96, g95], "H4")])

# ===========================================================================
# 6. Privacy and safety while using the form
# ===========================================================================
g71 = leaf(AchieveGoal, "G-71", "QuickExitAvailable <b>If</b> SafetyConcern", "C:90 (interpreted for online form)",
           SYSTEM, "ProvideQuickExit", stated=False)
g68 = goal(AvoidGoal, "G-68", "SafetySensitiveSituationExposed", "C:90,92,96 | C[46][50]",
           refinements=[Refinement(False, [g71], "H3")], annotation="K5: prioritized")
g323 = leaf(AchieveGoal, "G-323", "WhoSeesInformationAndWhyStatedPlainly", "Gl[68][74][77]",
            SYSTEM, "ShowPrivacyNotice")
g403 = goal(AchieveGoal, "G-403", "ApplicantPrivacyAndSafetyProtectedOnForm", "C:90 | Gl[68][74][77]", stated=False,
            refinements=[Refinement(False, [g68, g323], "H4")])

# ===========================================================================
# Sprint root
# ===========================================================================
g400 = goal(AchieveGoal, "G-400", "OnlineHelpRequestSubmittedAndReadyForStaffReview",
            "C:61,63,68 | Gl:10,17 | Gl[31][33][66]", stated=False,
            refinements=[Refinement(False, [g5, g10, g405, g401, g402, g403], "H4")])

# ===========================================================================
# Soft goals the form contributes to
# ===========================================================================
g157 = leaf(AchieveGoal, "G-157", "NoCostStatedUpFront", "Gl:37 (worry about cost)",
            SYSTEM, "StateServiceIsFree", stated=False)
g147 = leaf(AchieveGoal, "G-147", "HelpContactShown <b>If</b> ApplicantConfused", "Gl:12,39",
            SYSTEM, "ShowHelpContact")
g155 = goal(SoftGoal, "G-155", "IntakeUnderstandableAndLowEffortForNonExpertApplicant",
            "Gl:12,20,25,27,39,64 | Gl[26][28][33][64][83]",
            refinements=[Refinement(False, [g404, g157, g317, g138, g142, g147], "H7")])
g250 = goal(MaintainGoal, "G-250", "HumanJudgmentOverApplicantOutcomes <b>Including</b> WhetherApplicantGetsHelp",
            "C[10][16][21][50][52] | Gl[68]",
            refinements=[Refinement(False, [g51, g142], "H8")])

ROOTS = [g400, g155, g250]

# ===========================================================================
# Obstacles and conflicts
# ===========================================================================
o_answers = Obstacle("AnswersChosenWithoutApplicantUnderstanding", annotation="H8")
o_session = Obstacle("SessionStoppedByPhoneStorage", annotation="H8")
LINKS = [
    ObstructionLink(g132, o_answers), ResolutionLink(g7, o_answers),     # Gl:10,39
    ObstructionLink(g5, o_session), ResolutionLink(g10, o_session),      # Gl:10,17
    ConflictLink(g207, g7),     # K4  (was G-156 vs G-7; G-156 merged into G-207)
    ConflictLink(g134, g68),    # K5
    ConflictLink(g10, g313),    # K11
    ConflictLink(g405, g155),   # K13 login required vs low effort
    ConflictLink(g405, g68),    # K14 login trace vs safety
]

# ===========================================================================
# Decision record (Step 2)
# ===========================================================================
DECISIONS = {
    "K4":  ("conflict", "G-207 vs G-7", "Prioritize G-7: terms are explained before the question, even if a "
            "screen gets longer. Link kept; G-156 merged into G-207 (O1), so K4 now links G-207."),
    "K5":  ("conflict", "G-134 vs G-68", "Prioritize G-68: the safety-sensitive situation stays hidden; the helper "
            "alternative remains but may not weaken it. Link kept."),
    "K11": ("conflict", "G-10 vs G-313", "Compromise (revised by Q2): the form can be started without a login "
            "(G-313), but saving and resuming require one (G-10); G-405 prompts login or sign-up. Link kept."),
    "K13": ("conflict", "G-405 vs G-155", "Requiring an account to save progress or see status (Q2, Q3) adds "
            "effort for non-expert applicants such as Gloria, who needed help with the form (Gl:10,37). "
            "Modeled on request; resolution not yet chosen."),
    "K14": ("conflict", "G-405 vs G-68", "Login or sign-up by email or text can leave a trace that the applicant "
            "contacted legal aid (C:90, Gl[77]). Modeled on request; resolution not yet chosen."),
    "K12": ("conflict", "G-10 vs G-68", "Not a real conflict once phone scope is removed. Link removed; the "
            "analysis stays in this record."),
    "O1":  ("overlap", "G-6, G-7, G-207, G-156, G-312", "Combined into one question form G-404; G-156 and G-312 "
            "merged into G-207; phone-intake wording removed."),
    "O2":  ("overlap", "G-138, G-139, G-140, G-151", "Combined into one confirmation screen G-138."),
    "O3":  ("overlap", "G-9, G-318, G-95", "G-9 removed (contradictory answers are hard to measure); keep the "
            "concrete goals G-318 and G-95."),
    "O4":  ("overlap", "G-323, G-335, G-157", "G-335 removed (not normal in the flow, defined oddly); keep G-323, G-157."),
    "O5":  ("overlap", "G-81, G-267", "Combined into G-81 (applicant reports notice and appearance dates separately)."),
    "D-15":  ("dependency", "G-15", "Was out of sprint scope; back in scope by Q4."),
    "D-81":  ("dependency", "G-81", "Form values are treated as unverified: G-30 marks them Reported."),
    "D-51":  ("dependency", "G-51", "Add a 'Waiting for staff review' status (G-142)."),
    "D-151": ("dependency", "G-151", "Callback timeframe: urgent = same day, all else = within 2 business days "
              "(now part of G-138)."),
    "D-342": ("dependency", "G-342", "Removed from the sprint."),
    "D-8":   ("dependency", "G-8, G-95", "Legal documents use mock storage in the prototype."),
    "D-314": ("dependency", "G-314", "Out of sprint scope."),
    "D-318": ("dependency", "G-318", "Applicants mark unsure answers with a tag."),
    "Q1":    ("open question", "G-138, G-406", "Urgent = reported appearance date within 7 days OR danger "
              "reported on the form (G-406, G-15); matches team definition I3."),
    "Q2":    ("open question", "G-10, G-405", "Resume only with a login; a not-logged-in applicant who wants to "
              "save is prompted to log in or create an account."),
    "Q3":    ("open question", "G-142, G-405", "Status is visible only with an account."),
    "Q4":    ("open question", "G-15", "Danger questions stay on the form (G-15 back in scope)."),
    "PHONE": ("scope", "G-58, phone wording", "Phone intake out of scope: G-58 PhoneCallLoadReduced removed, "
              "G-10, G-207 and G-250 reworded for the online form."),
}

SPRINT_MERGES = {   # retired -> retained (sprint only; the combined model is unchanged)
    "G-156": ("G-207", "O1"), "G-312": ("G-207", "O1"),
    "G-139": ("G-138", "O2"), "G-140": ("G-138", "O2"), "G-151": ("G-138", "O2 + D-151"),
    "G-267": ("G-81", "O5"),
}

REMOVED = {         # in the previous sprint subset, now out of the sprint (still in the combined model)
    "G-9": "O3", "G-335": "O4", "G-342": "D-342", "G-314": "D-314", "G-58": "PHONE",
}

REWRITTEN = {       # names changed from the combined model by a sprint decision
    "G-207": "O1", "G-138": "O2 + D-151 + Q1", "G-81": "O5", "G-142": "D-51 + Q3", "G-318": "D-318",
    "G-10": "PHONE + Q2", "G-250": "PHONE", "G-401": "D-81 + Q4",
}

ADDED = {"G-404": "O1 combined question form", "G-405": "Q2 + Q3 login prompt", "G-406": "Q1 urgency rule", "G-30": "D-81 (reused from the combined model)",
         "G-142": "D-51 (reused from the combined model)"}

BOUNDARY = {        # in-scope goal -> (out-of-scope goals, how the prototype handles it)
    "G-15":  (["G-14", "G-16", "G-17"], "danger answers are for staff; staff review is mocked"),
    "G-406": (["G-14", "G-17", "G-100"], "urgent flag shown on the mock staff queue; based on an unverified date "
              "or the danger answer"),
    "G-138": (["G-17", "G-14", "G-327"], "promises a same-day callback when urgent; staff review is mocked"),
    "G-81":  (["G-80", "G-82", "G-268"], "dates verified later against papers and docket; shown as unverified"),
    "G-142": (["G-34", "G-27"], "staff review is not built; status stays 'Waiting for staff review'"),
    "G-51":  (["G-34", "G-27"], "no automated eligibility; submission is held for staff"),
    "G-318": (["G-47"], "staff follow-up on unsure answers is mocked"),
    "G-95":  (["G-47", "G-279"], "missing-document follow-up is mocked"),
    "G-8":   (["G-89", "G-44"], "documents go to mock storage, not the case system"),
}

CONFLICT_GOALS = {"G-207", "G-7", "G-134", "G-68", "G-10", "G-313", "G-405", "G-155"}


def highlight():
    changed = (set(REWRITTEN) | set(ADDED)) - CONFLICT_GOALS
    lines = [f"style {NODES[g].get_node_id()} fill:#f8c8c8" for g in sorted(CONFLICT_GOALS)]
    lines += [f"style {NODES[g].get_node_id()} fill:#cdeccd" for g in sorted(changed)]
    lines += [f"style {NODES[g].get_node_id()} stroke-dasharray:6 4" for g in BOUNDARY]
    lines += ['subgraph Legend',
              'legendC["in a conflict (note marks the prioritized goal)"]',
              'legendG["rewritten, combined or added by a sprint decision"]',
              'legendB["depends on out-of-scope goal (mocked)"]', 'end',
              'style legendC fill:#f8c8c8', 'style legendG fill:#cdeccd',
              'style legendB stroke-dasharray:6 4,fill:#fff']
    return "\n".join(lines) + "\n"


def build():
    return generate_graph(ROOTS, LINKS) + highlight()


if __name__ == "__main__":
    out = build()
    print(out)
    print(generate_pako_link(out, "view", config={"theme": "default",
                                                  "themeVariables": {"fontFamily": "Tahoma"}}))
    if "--trace" in sys.argv:
        print("\nID\tType\tGoal\tSources\tOrigin")
        for row in sorted(TRACE, key=lambda r: int(r[0][2:])):
            print("\t".join(row))
        print("\nDECISIONS")
        for k, (kind, goals, text) in DECISIONS.items():
            print(f"{k}\t{kind}\t{goals}\t{text}")
        print("\nSPRINT_MERGES")
        for k, (v, why) in SPRINT_MERGES.items():
            print(f"{k}\t-> {v}\t{why}")
        print("\nREMOVED")
        for k, why in REMOVED.items():
            print(f"{k}\t{why}")
        print("\nBOUNDARY")
        for k, (gs, how) in BOUNDARY.items():
            print(f"{k}\t{', '.join(gs)}\t{how}")
