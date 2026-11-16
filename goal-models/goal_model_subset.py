"""
17-626 HW3, Steps 1-2: sprint-scope goal model - ONLINE INTAKE FORM only.
A subset of the team model goal_model_combined.py (Model A + Model B merge).
Built with https://github.com/cmu-relab/goalmodeling.

Run:  python3 goal_model_online_intake.py           -> Mermaid definition + view link
      python3 goal_model_online_intake.py --trace   -> also prints scope, pruning and boundary tables

Scope rule
  Keep the goals that the applicant-facing online form (and the system behind it, up to the moment
  the submission is waiting for staff review) must satisfy. Everything staff do after submission
  (screening, routing, conflict check, attorney triage, callbacks) is OUT of scope and stays in the
  combined model; where an in-scope goal depends on or feeds one of those goals, it is listed in
  BOUNDARY so the dependency is not lost.

Traceability
  Every goal keeps its ID, name, sources, agent and STATED/DERIVED tag from goal_model_combined.py.
  New sprint-scope goals: G-400..G-403 (DERIVED, grouping only).
  Where a retained parent lost or gained children, the change is in PRUNED.
  Source notation as in the combined model: C:22 = Model A row, C[8] = Model B turn.

Highlighting in the diagram (Mermaid style lines added after generate_graph)
  red fill      = goal is in a conflict (CONFLICTS below)
  yellow fill   = goal overlaps another in-scope goal (OVERLAPS below); red wins if both
  dashed border = goal depends on / feeds an out-of-scope goal (BOUNDARY below)
"""
import sys
from goalmodeling.schema import *

SHOW_OPERATIONS = False

APPLICANT = ("Applicant", AgentType.ENVIRONMENT_AGENT)
HELPER = ("TrustedHelper", AgentType.ENVIRONMENT_AGENT)
PARALEGAL = ("IntakeParalegal", AgentType.ENVIRONMENT_AGENT)
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


def leaf(cls, gid, name, src, agent, operation, stated=True):
    return goal(cls, gid, name, src, stated, performs=by(agent, operation), leaf=True)


# ===========================================================================
# 1. Completing the form (alone or with a helper)
# ===========================================================================
g6 = leaf(AchieveGoal, "G-6", "OnlyApplicableQuestionsShown <b>If</b> ProblemTypeSelected", "C:68",
          SYSTEM, "FilterQuestionsByProblemType")
g7 = leaf(AchieveGoal, "G-7", "TermsAndRequiredDocumentsExplainedInPlainLanguage <b>Before</b> QuestionAsked",
          "C:68 | Gl:10,25,27,39 | Gl[26][28][33]", SYSTEM, "ShowPlainLanguageDefinitions")
g207 = leaf(AchieveGoal, "G-207", "QuestionsPresentedInPlainLanguageOneAtATime <b>Whether</b> ByPhoneOrOnline",
            "C[8] | Gl[66]", SYSTEM, "PresentOneQuestionAtATime")
g9 = leaf(AchieveGoal, "G-9", "MissingOrContradictoryAnswersShownAndFlagged <b>Before</b> StaffReview",
          "C:61,63,68 | C[4][38]", SYSTEM, "ValidateAnswers")
g133 = leaf(AchieveGoal, "G-133", "FormFilledByApplicant", "Gl:10,37", APPLICANT, "FillInForm")
g134 = leaf(AchieveGoal, "G-134", "FormFilledWithTrustedHelper", "Gl:10,50,52,54 | Gl[31][56][80]",
            HELPER, "AssistWithForm")
g314 = leaf(AchieveGoal, "G-314", "HelperAllowedToAssistApplicant <b>Without</b> Penalty", "Gl[80]",
            SYSTEM, "AllowHelperAssistance")
g132 = goal(AchieveGoal, "G-132", "IntakeFormCompleted", "Gl:10",
            refinements=[Refinement(False, [g133, g6, g7, g207, g9], "H6"),           # applicant alone
                         Refinement(False, [g134, g314, g6, g7, g207, g9], "H6")])    # with a helper

# ===========================================================================
# 2. Submission and confirmation
# ===========================================================================
g139 = leaf(AchieveGoal, "G-139", "ConfirmationNumberIssuedWithPurposeExplained", "Gl:10,17", SYSTEM, "IssueConfirmation")
g140 = leaf(AchieveGoal, "G-140", "PaperworkReceiptAcknowledged", "Gl:17,20,37,56", SYSTEM, "AcknowledgeReceipt")
g138 = goal(AchieveGoal, "G-138", "ReceiptConfirmedToApplicant", "Gl:17,20,37,56 | Gl[71]",
            refinements=[Refinement(False, [g139, g140], "H4")])
g312 = leaf(AchieveGoal, "G-312", "NextStepShownClearly <b>After</b> EachScreen", "Gl[66]", SYSTEM, "ShowNextScreenStep")
g313 = leaf(AchieveGoal, "G-313", "IntakeStartable <b>Without</b> Login", "Gl[64]", SYSTEM, "AllowAnonymousStart")
g318 = leaf(AchieveGoal, "G-318", "UncertainAnswerMarkedForStaffFollowUp <b>If</b> ApplicantUnsure", "Gl[28][31][33]",
            SYSTEM, "MarkUncertainAnswer", stated=False)
g51 = leaf(AvoidGoal, "G-51", "EligibilityOrHelpDecidedByAutomation <b>Without</b> StaffOrLawyerReview",
           "C:68,83,92 | C[16][21] | Gl[68]", SYSTEM, "HoldForStaffReview")
g317 = goal(AvoidGoal, "G-317", "HelpRequestLostBecauseOfFormError", "Gl[28][31][33]",
            refinements=[Refinement(False, [g318, g51], "H8")])
g5 = goal(AchieveGoal, "G-5", "IntakeSubmittedViaOnlineForm", "C:61,63,68 | Gl:10,50,52 | Gl[31][33][66]",
          refinements=[Refinement(False, [g132, g138, g312, g313, g317], "P1")])
g10 = leaf(MaintainGoal, "G-10", "IntakeProgressSavedAndResumable <b>If</b> CallerDropsOrApplicantPauses",
           "C:45,68 | Gl:10,17 | C[38] | Gl[66]", SYSTEM, "SavePartialIntake")

# ===========================================================================
# 3. Urgency and court date captured on the form (feeds G-14 and G-80, out of scope)
# ===========================================================================
g15 = leaf(AchieveGoal, "G-15", "DeadlineAndDangerAsked <b>Before</b> EligibilityQuestions", "C:57,87",
           SYSTEM, "PromptUrgencyQuestionsFirst")
g81 = leaf(AchieveGoal, "G-81", "AppearanceDateReportedByApplicant", "D:7,12 | Gl:10", APPLICANT, "ReportCourtDate")
g267 = leaf(AchieveGoal, "G-267", "CourtDateRecordedAtIntake <b>With</b> NoticeDateDistinguishedFromAppearanceDate",
            "D[13][22] | Gl[28][66]", PARALEGAL, "RecordCourtDates")
g401 = goal(AchieveGoal, "G-401", "UrgencyAndCourtDatesCapturedOnForm", "C:57 | D:80 | Gl:10 | Gl[28]", stated=False,
            refinements=[Refinement(False, [g15, g81, g267], "H4")])

# ===========================================================================
# 4. Documents uploaded with the form
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
# 5. Privacy and safety while using the form
# ===========================================================================
g71 = leaf(AchieveGoal, "G-71", "QuickExitAvailable <b>If</b> SafetyConcern", "C:90 (interpreted for online form)",
           SYSTEM, "ProvideQuickExit", stated=False)
g68 = goal(AvoidGoal, "G-68", "SafetySensitiveSituationExposed", "C:90,92,96 | C[46][50]",
           refinements=[Refinement(False, [g71], "H3")])                 # pruned, see PRUNED
g323 = leaf(AchieveGoal, "G-323", "WhoSeesInformationAndWhyStatedPlainly", "Gl[68][74][77]",
            SYSTEM, "ShowPrivacyNotice")
g335 = leaf(AchieveGoal, "G-335", "ApplicantToldWhetherInformationReachesBenefitAgencies", "Gl[77]",
            SYSTEM, "ExplainAgencySharing")
g342 = leaf(AchieveGoal, "G-342", "MessageContentNeutral <b>Unless</b> ApplicantConsentedToDetailedMessages",
            "C[65] | Gl[77]", SYSTEM, "ApplyMessageConsent", stated=False)
g403 = goal(AchieveGoal, "G-403", "ApplicantPrivacyAndSafetyProtectedOnForm", "C:90 | Gl[68][74][77]", stated=False,
            refinements=[Refinement(False, [g68, g323, g335, g342], "H4")])

# ===========================================================================
# Sprint root: the online alternative of G-3 plus what the form must collect
# ===========================================================================
g400 = goal(AchieveGoal, "G-400", "OnlineHelpRequestSubmittedAndReadyForStaffReview",
            "C:61,63,68 | Gl:10,17 | Gl[31][33][66]", stated=False,
            refinements=[Refinement(False, [g5, g10, g401, g402, g403], "H4")])

# ===========================================================================
# Soft goals the form contributes to
# ===========================================================================
g156 = leaf(AchieveGoal, "G-156", "FormCompletableOnPhoneInShortSteps", "Gl:10,37", SYSTEM, "SplitFormIntoShortSteps")
g157 = leaf(AchieveGoal, "G-157", "NoCostStatedUpFront", "Gl:37 (worry about cost)",
            SYSTEM, "StateServiceIsFree", stated=False)
g151 = leaf(AchieveGoal, "G-151", "ExpectedCallbackTimeframeShown", "Gl:12,17,34 | Gl[20][71][74]",
            SYSTEM, "ShowCallbackTimeframe")
g147 = leaf(AchieveGoal, "G-147", "HelpContactShown <b>If</b> ApplicantConfused", "Gl:12,39",
            SYSTEM, "ShowHelpContact")
g155 = goal(SoftGoal, "G-155", "IntakeUnderstandableAndLowEffortForNonExpertApplicant",
            "Gl:12,20,25,27,39,64 | Gl[26][28][33][64][83]",
            refinements=[Refinement(False, [g6, g7, g156, g157, g317, g151, g147], "H7")])
g58 = goal(SoftGoal, "G-58", "PhoneCallLoadReduced", "C:61,64-68",
           refinements=[Refinement(False, [g5], "H6")])
g250 = goal(MaintainGoal, "G-250", "HumanJudgmentOverCallerOutcomes <b>Including</b> WhetherApplicantGetsHelp",
            "C[10][16][21][50][52] | Gl[68]",
            refinements=[Refinement(False, [g51], "H8")])                # pruned, see PRUNED

ROOTS = [g400, g155, g58, g250]

# ===========================================================================
# Obstacles and conflicts
# ===========================================================================
o_answers = Obstacle("AnswersChosenWithoutApplicantUnderstanding", annotation="H8")
o_session = Obstacle("SessionStoppedByPhoneStorage", annotation="H8")
LINKS = [
    ObstructionLink(g132, o_answers), ResolutionLink(g7, o_answers),     # Gl:10,39
    ObstructionLink(g5, o_session), ResolutionLink(g10, o_session),      # Gl:10,17
    ConflictLink(g156, g7),     # K4
    ConflictLink(g134, g68),    # K5
    ConflictLink(g10, g313),    # K11 (new, found while scoping)
    ConflictLink(g10, g68),     # K12 (new, found while scoping)
]

# ===========================================================================
# Analysis tables (also used for highlighting)
# ===========================================================================
CONFLICTS = {
    "K4":  (["G-156", "G-7"], "stakeholder (Gloria vs Gloria)",
            "Short steps on a phone (Gl:37) vs every term explained before its question (Gl:39)."),
    "K5":  (["G-134", "G-68"], "stakeholder (Gloria vs Carmen)",
            "A helper filling the form sees every answer (Gl:10,50) vs nothing safety-sensitive exposed "
            "(C:90,92); the helper could be the opposing party in a DV matter."),
    "K11": (["G-10", "G-313"], "analyst (DERIVED)",
            "Resume later (G-10) needs a way to find the saved draft, but there is no login (G-313): "
            "a resume code or link is needed, and sending a link uses the applicant's contact channel."),
    "K12": (["G-10", "G-68"], "analyst (DERIVED)",
            "Saved progress on a shared phone leaves a trace (G-10) vs quick exit / no exposure (G-68, G-71)."),
}

OVERLAPS = {
    "O1": (["G-7", "G-207", "G-156", "G-312", "G-6"],
           "Five presentation goals: plain-language terms, one question at a time, short steps, next step "
           "after each screen, only applicable questions. One 'question screen' design could satisfy all five."),
    "O2": (["G-138", "G-139", "G-140", "G-151"],
           "Confirmation number, receipt of paperwork and expected callback time all belong on one "
           "confirmation screen."),
    "O3": (["G-9", "G-318", "G-95"],
           "Three 'flag for staff' goals: missing/contradictory answers, answers the applicant is unsure of, "
           "missing documents. Could be one review-flags list on the submission."),
    "O4": (["G-323", "G-335", "G-157"],
           "Up-front disclosures: who sees the information, whether it reaches benefit agencies, that the "
           "service is free. Could be one plain-language notice before the first question."),
    "O5": (["G-81", "G-267", "G-15"],
           "Court date and urgency questions: G-81 (applicant reports date) and G-267 (notice date vs "
           "appearance date) describe the same form field from two models."),
}

BOUNDARY = {   # in-scope goal -> (out-of-scope goals, relationship)
    "G-15":  (["G-14", "G-16", "G-17", "G-100"],
              "feeds: the urgency answers only matter if staff review urgent submissions the same day"),
    "G-81":  (["G-80", "G-82", "G-268"], "feeds: the date is confirmed later against court papers and the docket"),
    "G-267": (["G-80"], "feeds: agent is IntakeParalegal in the combined model, but on the form the system collects it"),
    "G-51":  (["G-34", "G-27", "G-205"], "depends on: a staff review step must exist after submission"),
    "G-9":   (["G-34"], "depends on: 'before staff review' needs a staff review queue"),
    "G-318": (["G-47"], "feeds: staff follow-up on uncertain answers"),
    "G-95":  (["G-47", "G-279"], "feeds: missing-document follow-up"),
    "G-8":   (["G-89", "G-44"], "feeds: documents go into the case packet and client file"),
    "G-151": (["G-17", "G-327"], "depends on: the timeframe shown must match what staff can actually do"),
    "G-342": (["G-326", "G-280", "G-245", "G-69"],
              "feeds: consent captured on the form governs later messages (open conflicts K2, K8)"),
    "G-314": (["G-315"], "depends on: lawyer still speaks with the applicant directly"),
    "G-68":  (["G-69", "G-70", "G-260", "G-261"], "pruned: staff-side safety goals stay out of scope"),
}

PRUNED = {     # retained parent -> change made for the sprint scope
    "G-68":  "kept G-71; removed G-69, G-70, G-260, G-261 (staff/phone side)",
    "G-155": "removed G-142 (status page, after submission); added G-147 (moved from G-52)",
    "G-250": "kept G-51; removed G-251, G-253, G-254, G-255 (staff review and AI drafts)",
    "G-3":   "not included; G-400 stands for its online alternative [G-5, G-10]",
}

OUT_OF_SCOPE_CONFLICTS = {
    "K1":  "G-54 vs G-21 - phone call speed vs conflict check (phone/staff side)",
    "K2":  "G-326 vs G-69 - message left vs no revealing trace (callbacks); G-342 is in scope as its proposed fix",
    "K3":  "G-42 vs G-100 - routing order (staff side)",
    "K6":  "G-54 vs G-227 - call speed vs verifying computed income (phone/staff side)",
    "K7":  "G-219 vs G-51 - advisory pre-screen flag; in scope only if the form shows a likely-ineligible message",
    "K8":  "G-280 vs G-245 - specific vs neutral reminder; G-342 is in scope as its proposed fix",
    "K9":  "G-100 vs G-21 - urgent routing vs conflict check (staff side)",
    "K10": "G-54 vs G-207 - call speed vs one question at a time (only on the phone)",
}


def highlight():
    """Mermaid style lines: red = conflict, yellow = overlap, dashed border = boundary dependency."""
    conflict = {g for gs, _, _ in CONFLICTS.values() for g in gs}
    overlap = {g for gs, _ in OVERLAPS.values() for g in gs} - conflict
    lines = []
    for gid in sorted(conflict):
        lines.append(f"style {NODES[gid].get_node_id()} fill:#f8c8c8")
    for gid in sorted(overlap):
        lines.append(f"style {NODES[gid].get_node_id()} fill:#fff2a8")
    for gid in BOUNDARY:
        lines.append(f"style {NODES[gid].get_node_id()} stroke-dasharray:6 4")
    lines += ['subgraph Legend',
              'legendC["in a conflict"]', 'legendO["overlaps another goal"]',
              'legendB["depends on / feeds out-of-scope goal"]', 'end',
              'style legendC fill:#f8c8c8', 'style legendO fill:#fff2a8',
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
        for title, table in (("CONFLICTS", CONFLICTS), ("OVERLAPS", OVERLAPS)):
            print(f"\n{title}")
            for k, v in table.items():
                print(f"{k}\t{', '.join(v[0])}\t{v[-1]}")
        print("\nBOUNDARY")
        for k, (gs, rel) in BOUNDARY.items():
            print(f"{k}\t{', '.join(gs)}\t{rel}")
        print("\nPRUNED")
        for k, v in PRUNED.items():
            print(f"{k}\t{v}")
