"""
17-626 HW3, Step 1: team goal model. Merges the two Assignment-2 combined models
  Model A  goal_model_combined.py (team member 1)  G-1..G-162   sources as rows   C:22  D:80  Gl:10
  Model B  goal_model_combined.py (team member 2)  G-1..G-142   sources as turns  C[8]  D[13] Gl[66]
Both model the same three stakeholders: Carmen (intake paralegal), Daniel (housing attorney),
Gloria (tenant/applicant). System: online + phone intake and eligibility screening for a
nonprofit legal aid office.

Run:  python3 goal_model_combined.py            -> prints Mermaid definition + view link
      python3 goal_model_combined.py --trace    -> also prints traceability, merge log, Model B ID map
      python3 goal_model_combined.py --csv      -> also writes the three tables as CSV files

ID policy
  Model A goals keep their IDs (G-1..G-162).
  Model B goals are renumbered by +200 (B:G-7 -> G-207, B:G-142 -> G-342), so every ID still
    traces to exactly one source model and nothing collides.
  When two goals are duplicates, ONE is retained and rewritten to include the other's information;
    the other ID is retired and listed in MERGES (stage A = earlier merge inside Model A,
    stage B = earlier merge inside Model B, stage AB = this merge). Retained goals keep the
    refinement annotation of the goal that was retained.
  New goals created from now on start at G-400.
  Domain properties are numbered DP-1.. (DP-1, DP-2 from Model B; DP-3..DP-6 from Model A).

Sources
  "C:22,77 | D:80 | Gl:10"      = row numbers in Model A's transcript CSVs (row 1 = header).
  "C[8] | D[13] | Gl[66]"        = turn numbers in Model B's transcripts. Model B wrote Gloria's turns
                                   as G[n]; they are written Gl[n] here so they are not confused with goal IDs.
  STATED  = goal expressed in at least one transcript.
  DERIVED = added by a refinement heuristic/pattern or tacit knowledge.

Agents unified: StaffAttorney (B) -> HousingAttorney; Tenant (B) -> Applicant; Helper (B) -> TrustedHelper.
New from B: ReviewingStaff, RulesAdministrator.

Inconsistencies (resolved by rewriting; no conflict link needed)
  I1 "Disposition": intake outcome (G-35, paralegal) vs service level (G-127, attorney).      [A]
  I2 Who assigns the attorney: supervisor (C:26) vs attorneys among themselves (D:58,60) -> G-45.  [A]
  I3 "Urgent": deadline/danger (C:57,87) vs court date within 7 days (D:80, D[13]) ->
     G-14 uses HearingWithin7Days Or SafetyRisk. Model B's G-84 (7 days only) merged into G-14.  [A+B]
  I4 Where urgent matters go: supervisor/unit (C:87) vs same-day attorney (D:80, D[13]) ->
     G-14 + G-16 + G-100 + G-285.                                                             [A+B]
  I5 Court date: applicant reports "the court date" (G-81) but Gloria could not tell the notice date
     from the appearance date (Gl[28]) -> G-80 now needs both G-81 (applicant reports) and G-267
     (paralegal records it with notice date and appearance date kept apart), checked against
     court papers (G-82) and the docket (G-268).                                              [AB]
  I6 Automation: A forbids treating a completed form as eligible (G-51); B allows an advisory
     pre-screen flag (G-219) and AI-drafted routine replies (G-232). Consistent once the flag is
     advisory and every draft is released only after human approval (G-205, G-250).          [AB]
  I7 Safe contact: A limited the voicemail/text restriction to callers with a safety concern (C:90);
     Gloria (no safety concern) is also afraid her landlord will find out (Gl[77]) ->
     G-69 now applies to every applicant.                                                     [AB]

Conflicts (ConflictLink in the model)
  K1  G-54 FastIntakeCalls  vs  G-21 ConflictsCleared Before AdviceOrEligibilityResponse  (C:54,77 vs C:52,85)
  K2  G-326 MessageLeft If ApplicantDoesNotAnswer  vs  G-69 Avoid ContactWithLegalAidRevealed
      (Gl[41][43], C:70 vs C:90, C[46][50], Gl[77]). Was A:K2 (G-53 vs G-69) + B:C3 (G-126 vs G-59).
      Proposed compromise G-342 (neutral message unless consented); needs stakeholder confirmation.
  K3  G-42 MatterRouted After Screening  vs  G-100 UrgentMatterRouted Before EligibilityResolved
      (C:26, D:30,38 vs D:80,83, D[13]). Resolved by the unstated condition "urgent"; G-50 still
      blocks acceptance.
  K4  G-156 FormCompletableOnPhoneInShortSteps  vs  G-7 TermsExplained Before QuestionAsked  (Gl:37 vs Gl:39)
  K5  G-134 FormFilledWithTrustedHelper  vs  G-68 Avoid SafetySensitiveSituationExposed  (Gl:10,50 vs C:90,92)
  K6  G-54 FastIntakeCalls  vs  G-227 ComputedIncomeVerifiedByParalegal (C[67] vs C[63]); B:C1, unresolved,
      mitigated by G-230.
  K7  G-219 LikelyIneligibleCallerFlagged  vs  G-51 Avoid EligibilityDecidedByAutomation (C[8] vs C[16]);
      B:C2, resolved: the flag is advisory, staff decide (C[21]).
  K8  G-280 SpecificMessageLeft (what document and why)  vs  G-245 NeutralReminderSent (D[58] vs C[65]);
      B:C4, unresolved between stakeholders; proposed compromise G-342.
  K9  G-100 UrgentMatterRouted Before EligibilityResolved  vs  G-21 ConflictsCleared Before Advice
      (D[13] vs C[34][36]); B:C5, proposed compromise G-341 (triage, but no advice until conflict cleared).
  K10 G-54 FastIntakeCalls  vs  G-207 QuestionsPresentedOneAtATime (C[8][67] vs Gl[66]); B:C6, unresolved.
"""
import csv
import sys
from goalmodeling.schema import *

SHOW_OPERATIONS = False  # True adds an operation node for every leaf (larger diagram)

PARALEGAL = ("IntakeParalegal", AgentType.ENVIRONMENT_AGENT)
APPLICANT = ("Applicant", AgentType.ENVIRONMENT_AGENT)
HELPER = ("TrustedHelper", AgentType.ENVIRONMENT_AGENT)
SUPERVISOR = ("SupervisingAttorney", AgentType.ENVIRONMENT_AGENT)
ATTORNEY = ("HousingAttorney", AgentType.ENVIRONMENT_AGENT)
REVIEWER = ("ReviewingStaff", AgentType.ENVIRONMENT_AGENT)
RULES_ADMIN = ("RulesAdministrator", AgentType.ENVIRONMENT_AGENT)
SYSTEM = ("IntakeSystem", AgentType.SOFTWARE_AGENT)

TRACE = []  # (id, type, name, sources, STATED/DERIVED)

# retired ID -> (retained ID, stage, note)
MERGES = {
    # ---- stage A: merges made earlier inside Model A ----
    "G-73":  ("G-1",   "A",  "Daniel's root merged into the shared root"),
    "G-130": ("G-1",   "A",  "Gloria's root merged into the shared root"),
    "G-74":  ("G-2",   "A",  "HousingMatterReadyForAttorneyAction: milestones moved into G-2"),
    "G-131": ("G-5",   "A",  "IntakeSubmittedOnline = IntakeSubmittedViaOnlineForm"),
    "G-135": ("G-7",   "A",  "LegalTermsExplained Before QuestionAsked merged with proof-document explanations"),
    "G-136": ("G-10",  "A",  "ProgressSaved If SessionInterrupted = IntakeProgressSaved If IntakePaused"),
    "G-90":  ("G-8",   "A",  "NoticeLeaseAndCourtPapersUploaded merged into document upload"),
    "G-137": ("G-8",   "A",  "EvictionNoticePhotoUploaded merged into document upload"),
    "G-85":  ("G-28",  "A",  "HouseholdCompositionAndIncomeRecorded = G-28 (household) + G-29 (income)"),
    "G-84":  ("G-75",  "A",  "HouseholdIncomeAndSubsidyRecorded dissolved: household/income -> G-28/G-29, subsidy -> G-75"),
    "G-97":  ("G-44",  "A",  "DocumentsAttachedToMatterFile = transfer of notices into the client file"),
    "G-98":  ("G-14",  "A",  "UrgentMatterReachesAttorneySameDay merged into urgent escalation"),
    "G-99":  ("G-16",  "A",  "UrgentHousingMatterVisiblyFlagged merged into urgent flag"),
    "G-111": ("G-41",  "A",  "MatterAssignedToResponsibleAttorney = IntakeAssigned"),
    "G-112": ("G-42",  "A",  "MatterRoutedToUnitByProblemType After Screening = practice-unit matching"),
    "G-113": ("G-45",  "A",  "HousingAttorneySelected = AttorneyAssigned"),
    "G-125": ("G-34",  "A",  "IntakeNarrativeAndEligibilityCaptured = EligibilityDecidedByIntakeStaff"),
    "G-141": ("G-52",  "A",  "ApplicantInformedOfStatusAndNextSteps = ApplicantToldNextSteps"),
    "G-149": ("G-80",  "A",  "CourtDateCapturedAtIntake = NextAppearanceDateConfirmed"),
    "G-154": ("G-57",  "A",  "IntakeInfoVisibleToAllStaffOnMatter merged into record integration"),
    # ---- stage B: merges made earlier inside Model B (IDs already +200) ----
    "G-275": ("G-208", "B",  "B:G-75 single source of truth -> B:G-8 single intake record"),
    "G-304": ("G-279", "B",  "B:G-104 tenant documents provided -> B:G-79 missing document obtained"),
    "G-306": ("G-207", "B",  "B:G-106 plain words one at a time -> B:G-7 plain-language questions"),
    "G-307": ("G-211", "B",  "B:G-107 story told once -> B:G-11 no retyping"),
    "G-310": ("G-213", "B",  "B:G-110 resumable online intake -> B:G-13 partial intake saved"),
    "G-319": ("G-252", "B",  "B:G-119 lawyer looks before decision -> B:G-52 no automated eligibility decision"),
    "G-324": ("G-267", "B",  "B:G-124 court date is soon -> B:G-67 court date recorded at intake"),
    "G-333": ("G-256", "B",  "B:G-133 information private -> B:G-56 confidentiality and safety"),
    "G-334": ("G-259", "B",  "B:G-134 landlord must not find out -> B:G-59 no revealing voicemail/text"),
    "G-336": ("G-250", "B",  "B:G-136 human decision on help -> B:G-50 human judgment"),
    "G-337": ("G-260", "B",  "B:G-137 get a person when needed -> B:G-60 reach a person quickly"),
    # ---- stage AB: this merge (Model B goal -> Model A goal) ----
    "G-340": ("G-1",   "AB", "B combined root = A combined root (eligible applicant helped before deadline)"),
    "G-201": ("G-2",   "AB", "CallerScreenedAndRoutedToAttorneyOrResource = A backbone; B:G-5 response milestone moved under G-52"),
    "G-202": ("G-3",   "AB", "IntakeRecordCaptured = intake opened; children spread over G-3 alternatives and G-57"),
    "G-301": ("G-3",   "AB", "HelpRequestSubmittedByTenant (phone OR online) = G-3 (phone OR online)"),
    "G-305": ("G-4",   "AB", "IntakeCompletedByPhone = IntakeConductedByPhone; G-4 now refined by G-206, G-207, G-308"),
    "G-309": ("G-5",   "AB", "IntakeStartedOnline = IntakeSubmittedViaOnlineForm; adds G-312, G-313"),
    "G-311": ("G-7",   "AB", "UnfamiliarTermsExplainedOnForm = TermsExplainedInPlainLanguage"),
    "G-209": ("G-9",   "AB", "MissingInformationShown = MissingOrContradictoryAnswersFlagged"),
    "G-213": ("G-10",  "AB", "PartiallyCompletedIntakeSavedAndResumable = IntakeProgressSaved"),
    "G-281": ("G-8",   "AB", "DocumentReceivedElectronically = documents uploaded by applicant"),
    "G-316": ("G-134", "AB", "TenantAssistedByHelper dissolved: G-314 joins helper alternative of G-132, G-315 joins G-148"),
    "G-203": ("G-21",  "AB", "ConflictCheckCompleted Before AdviceOrEligibilityResponse = ConflictsCleared Before AdviceGiven"),
    "G-217": ("G-23",  "AB", "CallerAndOpposingPartyChecked = PartiesCheckedAgainstClientDatabase"),
    "G-218": ("G-24",  "AB", "ConflictResultAndRuleVersionStored merged into conflict status"),
    "G-204": ("G-27",  "AB", "EligibilityDetermined = EligibilityDetermined"),
    "G-220": ("G-29",  "AB", "HouseholdIncomeEstablished = IncomeSourcesAndAmountsRecorded; G-29 now refined by G-224/G-225"),
    "G-221": ("G-31",  "AB", "ApplicableFunderIncomeLimitApplied = FunderIncomeLimitApplied; adds G-230, DP-1"),
    "G-228": ("G-32",  "AB", "SeniorIncomeLimitApplied = IncomeWithin200PctPovertyLine If Senior"),
    "G-229": ("G-33",  "AB", "StandardIncomeLimitApplied = IncomeWithin125PctPovertyLine If Not Senior"),
    "G-252": ("G-51",  "AB", "Avoid EligibilityDecidedByAutomation = Avoid CompletedOnlineFormTreatedAsEligible"),
    "G-208": ("G-57",  "AB", "SingleIntakeRecordIsSourceOfTruth = IntakeRecordSharedWithAllStaff; G-57 now refined"),
    "G-211": ("G-44",  "AB", "AnswersAndStoryCarriedToCaseSystem Without Retyping = TransferredToClientFile"),
    "G-276": ("G-44",  "AB", "IntakeEmailAndAttachmentsAttachedToCaseRecord = TransferredToClientFile"),
    "G-243": ("G-47",  "AB", "FollowUpCompleted If InfoOrDocumentMissing = MissingInfoRequested If Pending; G-47 now refined"),
    "G-244": ("G-95",  "AB", "MissingDocumentsTrackedOnIntakeRecord = MissingRequiredDocumentFlagged"),
    "G-241": ("G-54",  "AB", "Minimize[IntakeCallHandlingTime] = FastIntakeCalls"),
    "G-256": ("G-61",  "AB", "CallerConfidentialityAndSafety = IntakeRecordsAccountableAndProtected"),
    "G-257": ("G-63",  "AB", "RoleBasedAccessToIntakeRecords = AccessLimitedByRole"),
    "G-258": ("G-68",  "AB", "CallerInDangerProtected = Avoid SafetySensitiveSituationExposed"),
    "G-259": ("G-69",  "AB", "Avoid ContactRevealedToLandlordOrAbuser = Avoid RevealingVoicemailOrText; condition dropped (I7)"),
    "G-302": ("G-52",  "AB", "TenantToldWhatToDoNext = ApplicantInformedOfStatusAndNextSteps"),
    "G-303": ("G-53",  "AB", "TenantReachedForFollowUp = ApplicantContactedViaPreferredMethod; G-53 now refined"),
    "G-321": ("G-151", "AB", "ExpectedCallbackTimeStated = ExpectedCallbackTimeframeShown"),
    "G-322": ("G-138", "AB", "TenantCanSeeRequestWasReceived = ReceiptConfirmedToApplicant"),
    "G-300": ("G-148", "AB", "TenantConnectedWithLawyerBeforeCourtDate = ApplicantTalksToLawyerBeforeCourtDate"),
    "G-339": ("G-152", "AB", "LawyerSpeaksWithTenantBeforeCourtDate = ApplicantCalledBeforeCourtDate"),
    "G-338": ("G-155", "AB", "Minimize[TenantEffortAndFearOfError] = IntakeUnderstandableToNonExpert"),
    "G-263": ("G-80",  "AB", "OperativeReturnDateConfirmed = NextAppearanceDateCapturedAndConfirmed"),
    "G-264": ("G-89",  "AB", "CompleteIntakePacketInCaseRecord = KeyDocumentsAttachedToCaseRecord"),
    "G-284": ("G-14",  "AB", "UrgentCaseFlaggedToAttorney If Within7Days = UrgentMatterReachesAttorneySameDay"),
    "G-286": ("G-100", "AB", "UrgentCaseSentEvenIfScreeningUnfinished = UrgentMatterRouted Before EligibilityResolved"),
    "G-287": ("G-102", "AB", "CasesOrderedByCourtDateThenLockoutRisk = HousingMattersPrioritized"),
    "G-288": ("G-103", "AB", "CourtDateUsedAsPrimarySortKey = MattersOrderedByNextCourtDate"),
    "G-289": ("G-83",  "AB", "LockoutRiskAndProceedingStatusCaptured merged into ProceduralStageRecorded"),
    "G-293": ("G-109", "AB", "ViableDefenseAndReliefAssessed = ViableDefenseAssessed"),
    "G-266": ("G-124", "AB", "CaseDispositionDecided merged into attorney assessment of accepted matter"),
}


def by(agent, operation):
    """Responsibility link for a leaf goal: a fresh agent node per leaf keeps the diagram readable."""
    name, kind = agent
    category = (OperationCategory.SOFTWARE_TO_BE_OPERATION if kind == AgentType.SOFTWARE_AGENT
                else OperationCategory.ENVIRONMENT_OPERATION)
    op = Operation(operation, category) if SHOW_OPERATIONS else None
    return [PerformanceLink(Agent(name, kind), op)]


def goal(cls, gid, name, src, stated=True, **kw):
    g = cls(f"{gid}: {name}", **kw)
    TRACE.append((gid, cls.__name__.replace("Goal", ""), name, src, "STATED" if stated else "DERIVED"))
    return g


def leaf(cls, gid, name, src, agent, operation, stated=True):
    return goal(cls, gid, name, src, stated, performs=by(agent, operation), leaf=True)


# ===========================================================================
# MILESTONE 1: intake opened (phone OR online form)
# ===========================================================================
# --- phone ---
g206 = leaf(AchieveGoal, "G-206", "ChecklistAnswersElicitedByIntakeStaff", "C[4][50]", PARALEGAL, "AskChecklistQuestions")
g207 = leaf(AchieveGoal, "G-207", "QuestionsPresentedInPlainLanguageOneAtATime <b>Whether</b> ByPhoneOrOnline",
            "C[8] | Gl[66]", SYSTEM, "PresentOneQuestionAtATime")
g308 = leaf(AchieveGoal, "G-308", "ApplicantToldWhichPaperworkMatters", "Gl[66]", PARALEGAL, "ExplainRelevantPaperwork")
g4 = goal(AchieveGoal, "G-4", "IntakeConductedByPhone <b>If</b> ApplicantPrefersPhone", "C:5,7,61 | Gl[31][66]",
          refinements=[Refinement(False, [g206, g207, g308], "H4")])
g214 = leaf(AchieveGoal, "G-214", "CallerPermissionObtained <b>Before</b> CallRecorded", "C[46]",
            PARALEGAL, "AskRecordingPermission")
g215 = leaf(AchieveGoal, "G-215", "CallTranscriptStoredWithIntakeRecord", "C[46]", SYSTEM, "StoreCallTranscript")
g216 = leaf(AchieveGoal, "G-216", "TranscriptNamesAndFactsVerifiedByParalegal", "C[46]", PARALEGAL, "VerifyTranscript")
g10 = leaf(MaintainGoal, "G-10", "IntakeProgressSavedAndResumable <b>If</b> CallerDropsOrApplicantPauses",
           "C:45,68 | Gl:10,17 | C[38] | Gl[66]", SYSTEM, "SavePartialIntake")
g210 = goal(AchieveGoal, "G-210", "CallContextPreserved <b>If</b> CallerDrops", "C[38][40][46]",
            refinements=[Refinement(True, [g10], "H6"),                    # alternative: saved partial intake
                         Refinement(False, [g214, g215, g216], "P4")])     # alternative: recorded call

# --- online form ---
g6 = leaf(AchieveGoal, "G-6", "OnlyApplicableQuestionsShown <b>If</b> ProblemTypeSelected", "C:68",
          SYSTEM, "FilterQuestionsByProblemType")
g7 = leaf(AchieveGoal, "G-7", "TermsAndRequiredDocumentsExplainedInPlainLanguage <b>Before</b> QuestionAsked",
          "C:68 | Gl:10,25,27,39 | Gl[26][28][33]", SYSTEM, "ShowPlainLanguageDefinitions")
g9 = leaf(AchieveGoal, "G-9", "MissingOrContradictoryAnswersShownAndFlagged <b>Before</b> StaffReview",
          "C:61,63,68 | C[4][38]", SYSTEM, "ValidateAnswers")
g133 = leaf(AchieveGoal, "G-133", "FormFilledByApplicant", "Gl:10,37", APPLICANT, "FillInForm")
g134 = leaf(AchieveGoal, "G-134", "FormFilledWithTrustedHelper", "Gl:10,50,52,54 | Gl[31][56][80]", HELPER, "AssistWithForm")
g314 = leaf(AchieveGoal, "G-314", "HelperAllowedToAssistApplicant <b>Without</b> Penalty", "Gl[80]",
            SYSTEM, "AllowHelperAssistance")
g132 = goal(AchieveGoal, "G-132", "IntakeFormCompleted", "Gl:10",
            refinements=[Refinement(False, [g133, g6, g7, g207, g9], "H6"),           # applicant alone
                         Refinement(False, [g134, g314, g6, g7, g207, g9], "H6")])    # with a helper
g8 = leaf(AchieveGoal, "G-8", "NoticesLeaseCourtPapersAndPayStubsSentElectronically <b>If</b> ApplicantCanSendElectronically",
          "C:45,68 | D:22 | Gl:10 | D[58]", APPLICANT, "UploadDocuments")
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

g3 = goal(AchieveGoal, "G-3", "IntakeOpenedWithIdentityAndContactRecorded",
          "C:9,14,57 | Gl:10 | C[4][8] | Gl[26][31][33][66]",
          refinements=[Refinement(False, [g4, g210, g9], "H6"),     # alternative: phone
                       Refinement(False, [g5, g10], "H6")])         # alternative: online form

# ===========================================================================
# MILESTONE 2: problem, case facts and urgency identified
# ===========================================================================
g158 = leaf(AchieveGoal, "G-158", "CaseTypeAndSubstantiveIssueRecorded", "C:9,30 | D:12",
            PARALEGAL, "RecordCaseTypeAndIssue")
g76 = leaf(AchieveGoal, "G-76", "HousingTypeRecorded", "D:12", PARALEGAL, "RecordHousingType")
g77 = leaf(AchieveGoal, "G-77", "PredicateNoticeRecorded (type, service date, method)", "D:7,12,15,18",
           PARALEGAL, "RecordPredicateNotice")
g78 = leaf(AchieveGoal, "G-78", "AllegedArrearsOrOtherBasisRecorded", "D:12,15", PARALEGAL, "RecordArrearsOrBasis")
g79 = leaf(AchieveGoal, "G-79", "CourtIndexNumberRecorded", "D:12", PARALEGAL, "RecordIndexNumber")
# --- court date (I5) ---
g81 = leaf(AchieveGoal, "G-81", "AppearanceDateReportedByApplicant", "D:7,12 | Gl:10", APPLICANT, "ReportCourtDate")
g82 = leaf(AchieveGoal, "G-82", "AppearanceDateCheckedAgainstCourtPapers <b>If</b> PapersUploaded", "D:22",
           ATTORNEY, "CheckDatesInCourtPapers")
g267 = leaf(AchieveGoal, "G-267", "CourtDateRecordedAtIntake <b>With</b> NoticeDateDistinguishedFromAppearanceDate",
            "D[13][22] | Gl[28][66]", PARALEGAL, "RecordCourtDates")
g268 = leaf(AchieveGoal, "G-268", "ReturnDateCrossCheckedAgainstCourtDocket", "D[22][32][36]",
            PARALEGAL, "CheckDocket")
g269 = leaf(AchieveGoal, "G-269", "ReturnDateVerifiedWithApplicant <b>If</b> IndexNumberDefectiveOrNoticeAmbiguous",
            "D[22][32][36]", PARALEGAL, "VerifyDateWithApplicant")
dp2 = DomainProperty("DP-2: OperativeReturnDateIsTiedToADocketOrIndexNumber", leaf=True)
g80 = goal(AchieveGoal, "G-80", "OperativeAppearanceDateCapturedAndConfirmed",
           "D:7,12,91 | Gl:10 | D[19][22][28][30]",
           refinements=[Refinement(False, [g81, g82, g267, g268, g269, dp2], "P7")])
g83 = leaf(AchieveGoal, "G-83", "ProceduralStageLockoutRiskAndPriorJudgmentsRecorded", "C:30 | D:12,15,51",
           PARALEGAL, "RecordStageAndLockoutRisk")
g86 = leaf(AchieveGoal, "G-86", "SubsidyStatusRecorded (Section 8 | public housing | voucher | other | none)",
           "D:12,15", PARALEGAL, "RecordSubsidyStatus")
g87 = leaf(AchieveGoal, "G-87", "SubsidyPaymentHistoryAndArrearsShareRecorded <b>If</b> Subsidized", "D:15,20",
           PARALEGAL, "RecordSubsidyDetails")
g88 = leaf(AchieveGoal, "G-88", "ReliefSoughtRecorded (stay | answer | repairs | settlement)", "D:12,28",
           PARALEGAL, "RecordReliefSought")
g75 = goal(AchieveGoal, "G-75", "HousingCaseFactsRecorded <b>If</b> HousingCase", "D:12,15,20,91",
           refinements=[Refinement(False, [g76, g77, g78, g79, g80, g83, g86, g87, g88], "P5")])
g159 = leaf(AchieveGoal, "G-159", "ProgramSpecificFactsRecorded <b>If</b> FamilyOrBenefitsCase", "C:30,57",
            PARALEGAL, "RecordProgramFacts")
g160 = goal(AchieveGoal, "G-160", "CaseSpecificFactsRecorded", "C:57 | D:12", stated=False,
            refinements=[Refinement(False, [g75, g159], "P2")])
g12 = goal(AchieveGoal, "G-12", "CaseFactsAndPostureRecorded", "C:9,30 | D:12,91",
           refinements=[Refinement(False, [g158, g160], "H4")])

# --- urgency ---
g15 = leaf(AchieveGoal, "G-15", "DeadlineAndDangerAsked <b>Before</b> EligibilityQuestions", "C:57,87",
           SYSTEM, "PromptUrgencyQuestionsFirst")
g16 = leaf(AchieveGoal, "G-16", "UrgentMatterVisiblyFlaggedToSupervisorOrUnit <b>If</b> Urgent",
           "C:87 | D:77,80,91", PARALEGAL, "FlagUrgentMatter")
g17 = leaf(AchieveGoal, "G-17", "UrgentSubmissionReviewedSameDay <b>If</b> SubmittedOnline", "C:87 | D:80",
           SUPERVISOR, "ReviewUrgentSubmission")
g18 = leaf(AchieveGoal, "G-18", "NoticeOrHearingDateVerified <b>If</b> DocumentAvailable", "C:90 | D:22",
           PARALEGAL, "VerifyNoticeOrHearing")
g19 = leaf(AvoidGoal, "G-19", "ProofOfDangerRequired <b>Before</b> UrgentReview", "C:90",
           PARALEGAL, "ReviewWithoutProofOfDanger")
g100 = leaf(AchieveGoal, "G-100", "UrgentMatterRoutedToAttorney <b>Before</b> EligibilityResolved <b>If</b> HearingWithin7Days",
            "D:80,83 | D[13]", PARALEGAL, "RouteUrgentMatter")
g101 = leaf(AchieveGoal, "G-101", "EligibilityResolved <b>After</b> Routing <b>If</b> Urgent", "D:80,83",
            PARALEGAL, "CompleteEligibilityLater")
g285 = leaf(AchieveGoal, "G-285", "AttorneyNotifiedSameDay <b>If</b> CourtDateWithinSevenDays", "D[13]",
            SYSTEM, "NotifyAttorney")
g341 = leaf(AchieveGoal, "G-341", "UrgentCaseTriagedByAttorney <b>Without</b> AdviceGiven <b>Until</b> ConflictCheckCleared",
            "D[13] | C[34][36]", ATTORNEY, "TriageWithoutAdvice", stated=False)
g290 = leaf(AchieveGoal, "G-290", "MissingDocumentShownAlongsideUrgentFlag", "D[64]", SYSTEM, "ShowMissingDocsOnFlag")
g291 = leaf(AvoidGoal, "G-291", "MissingDocumentLoweringUrgencyOfNearTermCourtDate", "D[64]",
            SYSTEM, "KeepUrgencyIndependentOfDocs")
g14 = goal(AchieveGoal, "G-14",
           "UrgentMatterReachesAttorneySameDay <b>If</b> HearingWithin7Days <b>Or</b> SafetyRisk",
           "C:57,85,87 | D:80,83,91 | D[13][61][64]",
           refinements=[Refinement(False, [g15, g16, g17, g18, g19, g100, g101, g285, g341, g290, g291], "P7")])
g20 = leaf(AchieveGoal, "G-20", "MatterEnteredInRegularQueue <b>If Not</b> Urgent", "C:87 (implied)",
           SYSTEM, "QueueRoutineMatter", stated=False)
g13 = goal(AchieveGoal, "G-13", "MatterPrioritizedByUrgency", "C:83,85,92 | D:77,80",
           refinements=[Refinement(True, [g14, g20], "H10")])
g11 = goal(AchieveGoal, "G-11", "ProblemAndUrgencyIdentified", "C:9,57 | D:12",
           refinements=[Refinement(False, [g12, g13], "H4")])

# ===========================================================================
# MILESTONE 3: conflicts cleared before any advice
# ===========================================================================
g22 = leaf(AchieveGoal, "G-22", "ApplicantAndAllOpposingPartiesRecorded", "C:14,52", PARALEGAL, "RecordParties")
g23 = leaf(AchieveGoal, "G-23", "PartiesCheckedAgainstClientDatabase", "C:9,28,52 | C[34][36]",
           SYSTEM, "RunConflictSearch")
g24 = leaf(AchieveGoal, "G-24", "ConflictStatusAndRuleVersionRecorded (Cleared | Potential | Pending)",
           "C:28 | C[34][36]", SYSTEM, "SetConflictStatus")
g25 = leaf(AchieveGoal, "G-25", "MatterSentToConflictReview <b>If</b> PossibleMatch", "C:52",
           PARALEGAL, "SendToConflictReview")
g26 = leaf(AvoidGoal, "G-26", "LegalAdviceGiven <b>If Not</b> ConflictCleared", "C:9,52,85",
           PARALEGAL, "WithholdAdvice")
g21 = goal(AchieveGoal, "G-21", "ConflictsCleared <b>Before</b> AdviceOrEligibilityResponse",
           "C:9,50,52,57,85 | C[34][36]",
           refinements=[Refinement(False, [g22, g23, g24, g25, g26], "H11")])

# ===========================================================================
# MILESTONE 4: eligibility determined
# ===========================================================================
g219 = leaf(AchieveGoal, "G-219", "LikelyIneligibleCallerFlagged <b>Before</b> FullScreening (advisory)",
            "C[8][10][21]", SYSTEM, "FlagLikelyIneligible")
g28 = leaf(AchieveGoal, "G-28", "HouseholdCompositionRecorded (members, relationship, age, income)",
           "C:14,16 | D:12", PARALEGAL, "RecordHousehold")
g224 = leaf(AchieveGoal, "G-224",
            "IncomeRecordedAsReported <b>If</b> ApplicantKnowsHouseholdIncome <b>Including</b> BenefitIncome",
            "C[56] | Gl[28]", PARALEGAL, "RecordReportedIncome")
g226 = leaf(AchieveGoal, "G-226", "IncomeFigureComputedFromPayStubsOrBenefitLetters", "C[63]",
            SYSTEM, "ComputeIncomeFromDocuments")
g227 = leaf(AchieveGoal, "G-227", "ComputedFigureAndRuleUsedVerifiedByParalegal", "C[63]",
            PARALEGAL, "VerifyComputedIncome")
g225 = goal(AchieveGoal, "G-225", "IncomeEstimatedFromDocuments <b>If</b> ApplicantDoesNotKnowIncome", "C[56][63]",
            refinements=[Refinement(True, [g226, g227], "H11")])
g29 = goal(AchieveGoal, "G-29", "HouseholdIncomeSourcesAndAmountsEstablished", "C:14 | D:12 | Gl:10 | C[56][63]",
           refinements=[Refinement(True, [g224, g225], "P6")])
g30 = leaf(AchieveGoal, "G-30", "InfoSourceMarked (Reported | Estimated | Verified)", "C:41,45",
           SYSTEM, "TagInfoProvenance")
g32 = leaf(AchieveGoal, "G-32", "IncomeWithin200PctPovertyLine <b>If</b> Senior", "C:11 | C[63][65]",
           SYSTEM, "ApplySeniorFunderRule")
g33 = leaf(AchieveGoal, "G-33", "IncomeWithin125PctPovertyLine <b>If Not</b> Senior", "C:11 | C[63][65]",
           SYSTEM, "ApplyGeneralFunderRule")
g230 = leaf(AchieveGoal, "G-230", "FunderAndHouseholdCategoryAppliedShownToParalegal", "C[63][65]",
            SYSTEM, "ShowAppliedRule")
dp1 = DomainProperty("DP-1: IncomeLimitsDifferByFunderAndHouseholdCategory", leaf=True)
dp3 = DomainProperty("DP-3: Senior <b>Or</b> NotSenior", leaf=True)
g31 = goal(AchieveGoal, "G-31", "FunderIncomeLimitApplied", "C:11,41,43,50 | C[63][65]",
           refinements=[Refinement(True, [g32, g33, g230, dp1, dp3], "P3")])
g222 = leaf(AchieveGoal, "G-222", "IncomeSourceOrCalculationCorrectedByParalegal <b>Before</b> EligibilityResultRecorded",
            "C[65]", PARALEGAL, "CorrectIncome")
g231 = leaf(AchieveGoal, "G-231", "FunderRuleVersionUpdated <b>If</b> FunderRulesChange", "C[16] (implied)",
            RULES_ADMIN, "UpdateFunderRules", stated=False)
g223 = goal(MaintainGoal, "G-223", "CurrentFunderRulesUsedForScreening", "C[16]",
            refinements=[Refinement(False, [g231], "P7")])
g34 = leaf(AchieveGoal, "G-34", "IntakeNarrativeCapturedAndEligibilityDecidedByIntakeStaff",
           "C:9,68,83 | D:30", PARALEGAL, "DecideEligibility")
g27 = goal(AchieveGoal, "G-27", "EligibilityDetermined", "C:9,11,57,68 | D:30,83 | C[4][10][63][65]",
           refinements=[Refinement(False, [g219, g28, g29, g30, g31, g222, g223, g34, g51], "H4")])

# ===========================================================================
# MILESTONE 5: complete intake packet (documents, follow-up, single record)
# ===========================================================================
g92 = leaf(AchieveGoal, "G-92", "DocumentsRenamedAndFiledManually", "D:25,28", PARALEGAL, "RenameAndFileDocuments")
g93 = leaf(AchieveGoal, "G-93", "DocumentsAutoClassifiedByType", "D:25 (gap: no reliable classification)",
           SYSTEM, "ClassifyDocuments", stated=False)
g91 = goal(AchieveGoal, "G-91", "DocumentsFiledByType", "D:25",
           refinements=[Refinement(False, [g92], "H6"),
                        Refinement(False, [g93], "H6")])
g95 = leaf(AchieveGoal, "G-95", "MissingRequiredDocumentFlaggedImmediatelyAndTrackedOnRecord",
           "D:22,25 | C[56][65]", SYSTEM, "TrackDocumentCompleteness")
g96 = leaf(AchieveGoal, "G-96", "UnreadableOrWrongPageFlagged <b>At</b> Upload", "D:28",
           SYSTEM, "CheckImageQuality")
g271 = leaf(AchieveGoal, "G-271", "LegibleImageOrPleadingRequestedFromApplicant <b>If</b> NoticeIllegible",
            "D[36][38][50]", PARALEGAL, "RequestLegibleCopy")
g272 = leaf(AchieveGoal, "G-272", "NoticeImageEnhancedForReadability <b>If</b> NoticeIllegible", "D[36][38][50]",
            SYSTEM, "EnhanceImage")
g273 = leaf(AchieveGoal, "G-273", "OriginalImageOrPleadingRetainedAndDocketVerified", "D[36][38][50]",
            PARALEGAL, "RetainOriginalAndVerify")
g270 = goal(AchieveGoal, "G-270", "LegibleEvictionNoticeInCaseRecord", "D[41][50]",
            refinements=[Refinement(True, [g271], "H4"),
                         Refinement(False, [g272, g273], "H6")])
dp4 = DomainProperty("DP-4: AttorneySeesDocumentQualityOnlyAtCaseReview", leaf=True)
g94 = goal(AchieveGoal, "G-94", "DocumentsCompleteAndLegible", "D:22,28",
           refinements=[Refinement(False, [g95, g96, g270, dp4], "P6")])
g274 = leaf(AchieveGoal, "G-274", "LeaseStoredTogetherWithNotice <b>If</b> ApplicantHasALease", "D[41][50][52]",
            PARALEGAL, "StoreLeaseWithNotice")
g283 = leaf(AchieveGoal, "G-283", "IntakeNotesStructuredForTriage <b>Before</b> NextCourtMorning", "D[10]",
            SYSTEM, "StructureTriageNotes")

# --- follow-up on missing information / documents ---
g245 = leaf(AchieveGoal, "G-245", "NeutralReminderSent <b>If</b> DocumentMissing", "C[65]", SYSTEM, "SendNeutralReminder")
g247 = leaf(AchieveGoal, "G-247", "HousingFollowUpsQueued", "C[38]", SYSTEM, "QueueHousingFollowUp")
g248 = leaf(AchieveGoal, "G-248", "FamilyFollowUpsQueued", "C[38]", SYSTEM, "QueueFamilyFollowUp")
g249 = leaf(AchieveGoal, "G-249", "BenefitsFollowUpsQueued", "C[38]", SYSTEM, "QueueBenefitsFollowUp")
g246 = goal(AchieveGoal, "G-246", "FollowUpQueuedWithNextActionAndDueDate", "C[38]",
            refinements=[Refinement(True, [g247, g248, g249], "P5")])
g280 = leaf(AchieveGoal, "G-280", "SpecificMessageLeftForApplicant <b>If</b> DocumentMissing", "D[58]",
            ATTORNEY, "LeaveSpecificMessage")
g282 = leaf(AchieveGoal, "G-282", "DocumentChasedByParalegal <b>If</b> ApplicantCannotSendElectronically",
            "D[13][56][58]", PARALEGAL, "ChaseDocument")
g329 = leaf(AchieveGoal, "G-329", "ClearPhotoAndUploadInstructionsGiven", "Gl[56][58][61]",
            SYSTEM, "ShowPhotoInstructions")
g330 = leaf(AchieveGoal, "G-330", "NoticePhotographedAndSentByHelper <b>If</b> ApplicantCannotUpload", "Gl[56][58]",
            HELPER, "SendNoticeForApplicant")
g332 = leaf(AchieveGoal, "G-332", "RentReceiptsProvided <b>If</b> Available", "Gl[53]", APPLICANT, "ProvideReceipts")
g331 = leaf(AchieveGoal, "G-331", "DocumentUnavailabilityRecorded <b>If</b> ApplicantNeverHadDocument", "Gl[53] (implied)",
            PARALEGAL, "RecordUnavailableDocument", stated=False)
g342 = leaf(AchieveGoal, "G-342", "MessageContentNeutral <b>Unless</b> ApplicantConsentedToDetailedMessages",
            "C[65] | Gl[77]", SYSTEM, "ApplyMessageConsent", stated=False)
g279 = goal(AchieveGoal, "G-279", "MissingDocumentRequestedAndReceivedFromApplicant <b>If</b> DocumentMissing",
            "D[13][56][58][64] | Gl[53][56][58][61]",
            refinements=[Refinement(False, [g280, g8, g282, g329, g330, g332, g331, g342], "P3")])
g47 = goal(AchieveGoal, "G-47", "MissingInfoOrDocumentFollowedUp <b>If</b> PendingOrIncomplete",
           "C:61,63,70 | D:7,22 | C[4][38][56][65] | D[13][56][58][64]",
           refinements=[Refinement(False, [g95, g245, g246, g279], "P7")])

# --- single intake record ---
g44 = leaf(AchieveGoal, "G-44", "ScreeningDataStoryAndDocumentsTransferredToClientFile <b>Without</b> Retyping",
           "C:22,24,50,70 | D:22,25 | C[8] | D[24][47] | Gl[31][33][66]", SYSTEM, "TransferToClientFile")
g212 = leaf(AvoidGoal, "G-212", "DuplicateIntakeRecordOpened", "C[30][38]", SYSTEM, "DetectDuplicateRecord")
g277 = leaf(AvoidGoal, "G-277", "AttorneyAndParalegalWorkingFromDifferentVersions", "D[24][47]",
            SYSTEM, "KeepSingleVersion")
g278 = leaf(AchieveGoal, "G-278", "CaseRecordAccessibleFromPhoneInCourt", "D[24][47]", SYSTEM, "ServeMobileRecord")
g57 = goal(AchieveGoal, "G-57", "SingleIntakeRecordIsSourceOfTruthForParalegalAttorneyAndApplicant",
           "C:22 | Gl:37,52 | C[8] | D[24][47]",
           refinements=[Refinement(True, [g44, g212, g277, g278], "H9")])

g89 = goal(AchieveGoal, "G-89", "CompleteIntakePacketWithKeyDocumentsInCaseRecord",
           "C:22,68 | D:22,25,91 | Gl:10 | D[41][47][50][54]",
           refinements=[Refinement(False, [g8, g91, g94, g274, g57, g47, g283], "H4")])

# ===========================================================================
# MILESTONE 6: disposition recorded and acted on
# ===========================================================================
g39 = leaf(AchieveGoal, "G-39", "AttorneyStatusShown (Assigned | Pending | Available)", "C:33",
           SYSTEM, "DisplayAttorneyStatus")
g40 = leaf(AchieveGoal, "G-40", "AvailabilityConfirmedWithUnitOrSupervisor", "C:35 | D:58",
           PARALEGAL, "ConfirmAvailability")
dp5 = DomainProperty("DP-5: AttorneyAvailabilityChangesOften", leaf=True)
g38 = goal(AchieveGoal, "G-38", "AttorneyCapacityConfirmed <b>If</b> Accepted", "C:33,35 | D:58,60",
           refinements=[Refinement(False, [g39, g40, dp5], "P6")])

g161 = leaf(AchieveGoal, "G-161", "RoutedByCaseTypeIssueAndGeography <b>If</b> SingleProblemType",
            "C:26,30,33 | D:30,38,40,60", PARALEGAL, "SelectPracticeUnit")
g120 = leaf(AchieveGoal, "G-120", "RoutedToUnitWithMostUrgentDeadline <b>If</b> ImmediateHousingDeadline",
            "D:72,74", PARALEGAL, "RouteByDeadline")
g121 = leaf(AchieveGoal, "G-121", "RoutedBySubstantiveProblem <b>If Not</b> ImmediateHousingDeadline", "D:74",
            PARALEGAL, "RouteByProblem")
g119 = goal(AchieveGoal, "G-119", "PrimaryIssueRouted", "D:72,74",
            refinements=[Refinement(True, [g120, g121], "H10")])
g122 = leaf(MaintainGoal, "G-122", "HousingDeadlineVisible <b>If</b> MultipleProblemTypes", "D:69,72",
            SYSTEM, "PinHousingDeadline")
g123 = leaf(AchieveGoal, "G-123", "AllIssuesNotedInFile", "D:74", PARALEGAL, "NoteAllIssues")
g118 = goal(AchieveGoal, "G-118", "MixedIssueMatterHandled <b>If</b> MultipleProblemTypes", "D:69,72,74",
            refinements=[Refinement(False, [g119, g122, g123], "H4")])
g42 = goal(AchieveGoal, "G-42", "MatterRoutedToPracticeUnit <b>After</b> Screening", "C:26,30,33 | D:30,38,40,60",
           refinements=[Refinement(False, [g161, g118], "P2")])
g43 = leaf(AchieveGoal, "G-43", "RoutingQueueShowsCaseSummary", "C:22,26,33,50 | D:91",
           SYSTEM, "DisplayRoutingQueue")
g114 = leaf(AchieveGoal, "G-114", "AssignedToAttorneyWhoCanActFastest <b>If</b> Urgent", "D:60",
            ATTORNEY, "TakeUrgentMatter")
g115 = leaf(AchieveGoal, "G-115", "AssignedByCourtGeographyAndCaseload <b>If Not</b> Urgent", "C:26,33 | D:58,60",
            ATTORNEY, "TakeRoutineMatter")
dp6 = DomainProperty("DP-6: Urgent <b>Or</b> NotUrgent", leaf=True)
g45 = goal(AchieveGoal, "G-45", "AttorneyAssigned", "C:26 | D:58,60",
           refinements=[Refinement(True, [g114, g115, dp6], "P3")])
g116 = leaf(AchieveGoal, "G-116", "ResponsibleAttorneyMarkedInFile", "D:63,66", ATTORNEY, "MarkResponsible")
g117 = leaf(AchieveGoal, "G-117", "NextActionAndDeadlineRecordedInFile", "D:63,66", ATTORNEY, "RecordNextAction")
g41 = goal(AchieveGoal, "G-41", "IntakeAssignedToResponsibleAttorney <b>If</b> Accepted <b>And</b> AttorneyHasCapacity",
           "C:26,33 | D:58,60,63,66",
           refinements=[Refinement(False, [g42, g43, g44, g45, g116, g117], "H11")])
g37 = goal(AchieveGoal, "G-37", "AcceptedIntakeAssigned <b>If</b> Accepted", "C:26,70 | D:38",
           refinements=[Refinement(True, [g38, g41], "P4")])

g72 = leaf(AchieveGoal, "G-72", "ReasonRecordedAndExplained <b>If</b> Declined <b>Or</b> Referred",
           "C:9,24,33,70", PARALEGAL, "ExplainDeclineOrReferral")
g48 = leaf(MaintainGoal, "G-48", "IntakeRestrictedToIntakeHistory <b>If</b> Declined", "C:24",
           SYSTEM, "RestrictDeclinedIntake")
g46 = goal(AchieveGoal, "G-46", "IntakeClosedOut <b>If</b> Declined <b>Or</b> Referred", "C:24,33,70",
           refinements=[Refinement(False, [g72, g48], "H4")])
g36 = goal(AchieveGoal, "G-36", "DispositionActedOn", "C:70", stated=False,
           refinements=[Refinement(False, [g37, g46, g47], "P2")])
g162 = leaf(AchieveGoal, "G-162", "IntakeMarkedAccepted <b>If</b> (ConflictCleared <b>And</b> EligibilityReviewed)",
            "C:9,85", PARALEGAL, "MarkIntakeAccepted")
g50 = leaf(AvoidGoal, "G-50", "IntakeMarkedAccepted <b>If Not</b> (ConflictCleared <b>And</b> EligibilityReviewed)",
           "C:83,85", SYSTEM, "BlockPrematureAcceptance")
g49 = goal(MaintainGoal, "G-49", "IntakeMarkedAccepted <b>Iff</b> (ConflictCleared <b>And</b> EligibilityReviewed)",
           "C:9,83,85",
           refinements=[Refinement(True, [g162, g50], "H9")])
g35 = goal(AchieveGoal, "G-35", "IntakeDispositionRecordedWithBasis (accepted | declined | referred | pending)",
           "C:24,28,33,70",
           refinements=[Refinement(False, [g36, g49], "H4")])

# ===========================================================================
# MILESTONE 7: applicant informed of status and next steps
# ===========================================================================
g325 = leaf(AchieveGoal, "G-325", "CallbackScheduledInApplicantsAvailableWindow", "Gl[39][50]",
            SYSTEM, "ScheduleCallback")
g326 = leaf(AchieveGoal, "G-326", "MessageLeft <b>If</b> ApplicantDoesNotAnswerCallback", "Gl[41][43]",
            PARALEGAL, "LeaveMessage")
g327 = leaf(AchieveGoal, "G-327", "ApplicantCallAnsweredOrReturnedSameDay", "Gl[22][39]",
            PARALEGAL, "ReturnCallSameDay")
g328 = leaf(AchieveGoal, "G-328", "CallbackRoutedThroughHelper <b>If</b> ApplicantConsents", "Gl[50] (implied)",
            SYSTEM, "RouteCallbackViaHelper", stated=False)
g53 = goal(AchieveGoal, "G-53", "ApplicantReachedViaPreferredMethodAndWindow",
           "C:14,70 | Gl[37][39][41][43][45][50]",
           refinements=[Refinement(False, [g325, g326, g327, g328], "P7")])
g320 = leaf(AchieveGoal, "G-320", "ApplicantToldImmediateNextStepAtFirstContact", "Gl[6][8]",
            PARALEGAL, "StateImmediateNextStep")
g142 = leaf(AchieveGoal, "G-142", "CurrentStageShownInPlainWords", "Gl:20,39,64", SYSTEM, "ShowStage")
g143 = leaf(AchieveGoal, "G-143", "NextApplicantActionShown", "C:70 | Gl:22,29,39,46", SYSTEM, "ShowNextStep")
g145 = leaf(AchieveGoal, "G-145", "NoticeReviewRecordedByAttorney", "Gl:39,62,64", ATTORNEY, "MarkNoticeReviewed")
g146 = leaf(AchieveGoal, "G-146", "ReviewStatusDisplayedToApplicant", "Gl:39,62,64", SYSTEM, "ShowReviewStatus")
g144 = goal(AchieveGoal, "G-144", "NoticeReviewStatusKnownToApplicant", "Gl:39,62,64",
            refinements=[Refinement(False, [g145, g146], "P6")])
g151 = leaf(AchieveGoal, "G-151", "ExpectedCallbackTimeframeShown", "Gl:12,17,34 | Gl[20][71][74]",
            SYSTEM, "ShowCallbackTimeframe")
g323 = leaf(AchieveGoal, "G-323", "WhoSeesInformationAndWhyStatedPlainly", "Gl[68][74][77]",
            SYSTEM, "ShowPrivacyNotice")
g147 = leaf(AchieveGoal, "G-147", "HelpContactShown <b>If</b> ApplicantConfused", "Gl:12,39",
            SYSTEM, "ShowHelpContact")
# --- replies to routine questions: AI draft, released only after human approval (Model B) ---
g232 = leaf(AchieveGoal, "G-232", "RoutineResponseDraftGenerated <b>If</b> RoutineInformationalQuestion",
            "C[16][18][24]", SYSTEM, "DraftRoutineResponse")
g236 = leaf(AchieveGoal, "G-236", "RoutineDraftReviewedByIntakeParalegal <b>If</b> RoutineAndDuringBusinessHours",
            "C[27]", PARALEGAL, "ReviewRoutineDraft")
g237 = leaf(AchieveGoal, "G-237", "ResponseReviewedByAttorney <b>If</b> EligibilityEmergencyConflictOrAmbiguous",
            "C[24][27]", SUPERVISOR, "ReviewSensitiveResponse")
g238 = leaf(AchieveGoal, "G-238", "RoutineDraftHeldForReview <b>If</b> OutsideBusinessHours", "C[27] (implied)",
            SYSTEM, "HoldDraft", stated=False)
g239 = leaf(AchieveGoal, "G-239", "PendingReviewEscalated <b>If</b> ReviewOverdue", "C[30] (implied)",
            SYSTEM, "EscalateOverdueReview", stated=False)
g240 = goal(AchieveGoal, "G-240", "EveryReviewItemHasAnOwner", "C[27][30]",
            refinements=[Refinement(False, [g238, g239], "H8")])
g233 = goal(AchieveGoal, "G-233", "ReviewAssignedThroughQueue", "C[27]",
            refinements=[Refinement(True, [g236, g237, g240], "H5")])
g234 = leaf(AchieveGoal, "G-234", "RuleVersionFactsAndDispositionValidated <b>Before</b> Release", "C[24]",
            REVIEWER, "ValidateResponse")
g235 = leaf(AchieveGoal, "G-235", "ApprovalRecordedInAuditTrail", "C[24][27]", SYSTEM, "LogApproval")
g205 = goal(AchieveGoal, "G-205", "CallerResponseReleased <b>After</b> HumanApproval", "C[18][24][27]",
            refinements=[Refinement(True, [g232, g233, g234, g235], "P1")])
g52 = goal(AchieveGoal, "G-52", "ApplicantInformedOfStatusAndNextSteps",
           "C:70 | Gl:25,29,34,39,46,64 | Gl[6][8][20][33][66]",
           refinements=[Refinement(False, [g53, g320, g142, g143, g144, g138, g151, g323, g147, g205], "H3")])

# Functional backbone: milestones in the order Carmen described (C:9,57, C[4]) plus Daniel's packet (D:91)
g2 = goal(AchieveGoal, "G-2", "EligibleApplicantRoutedToRightUnitAndAttorney", "C:5,22 | D:7,22,91 | C[4]",
          refinements=[Refinement(False, [g3, g11, g21, g27, g89, g35, g52], "P1")])

# ===========================================================================
# Applicant reaches a lawyer before the court date (Gloria)
# ===========================================================================
g150 = leaf(AchieveGoal, "G-150", "SubmissionSeenByRightStaffPromptly", "Gl:46,56,59", PARALEGAL, "ReviewSubmission")
g152 = leaf(AchieveGoal, "G-152", "ApplicantCalledByLawyer <b>Before</b> CourtDate",
            "D:80 | Gl:12,20,29,59 | Gl[31][80][83]", ATTORNEY, "CallApplicant")
g315 = leaf(AchieveGoal, "G-315", "LawyerSpeaksWithApplicantDirectly <b>Even If</b> HelperAssists", "Gl[80]",
            ATTORNEY, "SpeakWithApplicant")
g148 = goal(AchieveGoal, "G-148", "ApplicantConnectedWithLawyer <b>Before</b> CourtDate",
            "D:80,83 | Gl:6,12,20,29,34,59,62 | Gl[31][33][83]",
            refinements=[Refinement(False, [g80, g150, g151, g53, g152, g315], "P7")])

# ===========================================================================
# Attorney triage of housing matters before the court deadline (Daniel)
# ===========================================================================
g103 = leaf(AchieveGoal, "G-103", "MattersOrderedByNextCourtDate", "D:40,42,45,51 | D[61]", SYSTEM, "SortByCourtDate")
g105 = leaf(AchieveGoal, "G-105", "ImmediateActionTaken <b>If</b> MarshalEvictionScheduled", "D:55",
            ATTORNEY, "ActImmediately")
g106 = leaf(AchieveGoal, "G-106", "PostJudgmentDeadlinesTracked <b>If</b> JudgmentOrWarrantEntered", "D:51,55",
            ATTORNEY, "TrackPostJudgmentDeadlines")
g107 = leaf(AchieveGoal, "G-107", "MatterTreatedAsSeriousRisk <b>If</b> OnlyNoticeReceived", "D:55",
            ATTORNEY, "PrioritizeNoticeOnlyMatter")
g104 = goal(AchieveGoal, "G-104", "LockoutRiskActedOn", "D:42,45,51,55",
            refinements=[Refinement(False, [g105, g106, g107], "P2")])
g108 = leaf(AchieveGoal, "G-108", "HouseholdVulnerabilityAssessed", "D:42,45,53 | Gl:37",
            ATTORNEY, "RecordVulnerability")
g109 = leaf(AchieveGoal, "G-109", "ViableDefenseAndReliefAssessed <b>If</b> NoticeAndLeaseAvailable",
            "D:18,42,45,47 | D[10][52][54]", ATTORNEY, "AssessDefenses")
g110 = leaf(MaintainGoal, "G-110", "CourtDateControlsPriority <b>Over</b> Vulnerability", "D:53",
            SYSTEM, "RankCourtDateFirst")
g102 = goal(AchieveGoal, "G-102", "HousingMattersPrioritized (court date, then lockout risk, then actionability)",
            "D:40,42,45 | D[61]",
            refinements=[Refinement(False, [g103, g83, g104, g108, g109, g110], "H4")])
g126 = leaf(AchieveGoal, "G-126", "LegalAssessmentAndRecommendedReliefRecorded", "D:28,30",
            ATTORNEY, "RecordLegalAssessment")
g127 = leaf(AchieveGoal, "G-127", "ServiceDispositionRecordedForReporting (represent | refer | brief advice)",
            "D:28,30,32", ATTORNEY, "RecordServiceDisposition")
g294 = leaf(AchieveGoal, "G-294", "ApplicantConsultedAndDocketChecked <b>Before</b> Action", "D[10][52][54]",
            ATTORNEY, "ConsultAndCheckDocket")
g295 = leaf(AchieveGoal, "G-295", "CaseNegotiatedFiledOrReferredOut", "D[10][52][54]", ATTORNEY, "ActOnCase")
g296 = leaf(AchieveGoal, "G-296", "EmergencyPapersDrafted <b>If</b> ImmediateActionRequired", "D[10][52][54]",
            ATTORNEY, "DraftEmergencyPapers")
g124 = goal(AchieveGoal, "G-124", "AcceptedMatterAssessedPrioritizedAndActedOn <b>If</b> Accepted",
            "D:28,30,38 | D[10][52][54]",
            refinements=[Refinement(False, [g102, g126, g127, g294, g295, g296], "H5")])
g292 = leaf(AchieveGoal, "G-292", "UrgentFlagUpdated <b>If</b> CourtDateChanges", "D[13] (implied)",
            SYSTEM, "RecomputeUrgency", stated=False)
g265 = goal(AvoidGoal, "G-265", "CourtDateOrLockoutDeadlineDiscoveredTooLate", "D[10]",
            refinements=[Refinement(False, [g14, g292], "H8")])
g262 = goal(AchieveGoal, "G-262", "HousingCaseTriagedBeforeCourtDeadline", "D[10][28][61]",
            refinements=[Refinement(True, [g80, g89, g265, g124], "P1")])

# ===========================================================================
# Soft goals (quality)
# ===========================================================================
g55 = leaf(AchieveGoal, "G-55", "NextQuestionChosenFromCallerAnswers", "C:54,57,59", SYSTEM, "AdaptQuestionOrder")
g153 = leaf(AvoidGoal, "G-153", "ApplicantRetellsStoryToDifferentStaff", "Gl:37,52 | Gl[31][33][66]",
            SYSTEM, "ReuseRecordedNarrative")
g56 = goal(SoftGoal, "G-56", "InformationCapturedOnceAndReused", "C:37,39,43,70 | D:77 | Gl:37,52",
           refinements=[Refinement(False, [g57, g153], "H4")])
g58 = goal(SoftGoal, "G-58", "PhoneCallLoadReduced", "C:61,64-68",
           refinements=[Refinement(False, [g5], "H6")])
g242 = leaf(AchieveGoal, "G-242", "EmergencyIssueHandledDirectly <b>If</b> CallerReportsEmergency", "C[8]",
            PARALEGAL, "HandleEmergencyDirectly")
g54 = goal(SoftGoal, "G-54", "FastIntakeCalls (Minimize IntakeCallHandlingTime)", "C:37,54,77,83 | C[8][56][67]",
           refinements=[Refinement(False, [g55, g56, g58, g219, g242, g47], "H7")])

g128 = goal(SoftGoal, "G-128", "LessAttorneyTimeChasingMissingInfo", "D:7,25,28,77,91",
            refinements=[Refinement(False, [g93, g95, g96, g9], "H7")])

g60 = leaf(AchieveGoal, "G-60", "UnansweredCriticalQuestionsFlagged <b>Before</b> ScreeningClosed", "C:39,45,50",
           SYSTEM, "FlagMissingCriticalAnswers")
g59 = goal(SoftGoal, "G-59", "ConsistentEligibilityDecisions", "C:37,39,41,43,77",
           refinements=[Refinement(False, [g31, g60], "H4")])

g156 = leaf(AchieveGoal, "G-156", "FormCompletableOnPhoneInShortSteps", "Gl:10,37", SYSTEM, "SplitFormIntoShortSteps")
g157 = leaf(AchieveGoal, "G-157", "NoCostStatedUpFront", "Gl:37 (worry about cost)",
            SYSTEM, "StateServiceIsFree", stated=False)
g155 = goal(SoftGoal, "G-155", "IntakeUnderstandableAndLowEffortForNonExpertApplicant",
            "Gl:12,20,25,27,39,64 | Gl[26][28][33][64][83]",
            refinements=[Refinement(False, [g6, g7, g142, g156, g157, g317, g151], "H7")])

g129 = goal(SoftGoal, "G-129", "ClearOwnershipOfWhoIsWaitingOnWhat", "D:35,63,66",
            refinements=[Refinement(False, [g116, g117, g122], "H3")])

g297 = goal(SoftGoal, "G-297", "Minimize[TimeToConfirmReturnDate]", "D[19][30]",
            refinements=[Refinement(False, [g267, g268], "H6")])
g299 = leaf(AvoidGoal, "G-299", "ReturnDateReliedOn <b>Before</b> DocketVerification", "D[22][36]",
            ATTORNEY, "WaitForDocketCheck")
g298 = goal(MaintainGoal, "G-298", "OperativeFactsVerifiedBeforeReliance", "D[36][38]",
            refinements=[Refinement(False, [g299, g273], "H9")])

# ===========================================================================
# Non-functional: human judgment over automation (Model B)
# ===========================================================================
g251 = leaf(AvoidGoal, "G-251", "OutboundResponseSent <b>Without</b> StaffApproval", "C[16][18][24]",
            SYSTEM, "BlockUnapprovedSend")
g253 = leaf(AvoidGoal, "G-253", "DangerAssessmentMadeByAutomation", "C[50]", SYSTEM, "LeaveDangerToStaff")
g254 = leaf(AchieveGoal, "G-254", "CaseRoutedToStaff <b>If</b> EmergencyOrSituationDoesNotFitChecklist", "C[10][21]",
            SYSTEM, "RouteExceptionToStaff")
g255 = leaf(AchieveGoal, "G-255", "EligibilityRulesBehindEachFlagShownInAuditTrail", "C[21]",
            SYSTEM, "ExplainFlag")
g250 = goal(MaintainGoal, "G-250", "HumanJudgmentOverCallerOutcomes <b>Including</b> WhetherApplicantGetsHelp",
            "C[10][16][21][50][52] | Gl[68]",
            refinements=[Refinement(False, [g251, g51, g253, g254, g255], "H8")])

# ===========================================================================
# Non-functional: accountability, access control, confidentiality, safety
# ===========================================================================
g62 = leaf(MaintainGoal, "G-62", "ChangeHistoryRecorded (who, when, why)", "C:73,75", SYSTEM, "LogIntakeChanges")
g64 = leaf(AchieveGoal, "G-64", "ScreeningEditableOnlyByIntakeStaff", "C:75", SYSTEM, "EnforceIntakeStaffPermissions")
g65 = leaf(AchieveGoal, "G-65", "EligibilityAndRoutingReviewedBySupervisor", "C:75",
           SUPERVISOR, "ReviewEligibilityAndRouting")
g66 = leaf(AchieveGoal, "G-66", "AcceptedCaseEditableOnlyByAttorney", "C:75 | D:30", SYSTEM, "EnforceAttorneyPermissions")
g67 = leaf(AvoidGoal, "G-67", "IntakeStaffViewingUnrelatedClientRecords", "C:73,75", SYSTEM, "RestrictRecordVisibility")
g63 = goal(MaintainGoal, "G-63", "AccessLimitedByRole", "C:73,75 | C[30]",
           refinements=[Refinement(False, [g64, g65, g66, g67], "H5")])
g69 = leaf(AvoidGoal, "G-69", "ContactWithLegalAidRevealedToLandlordOrAbuser <b>Via</b> VoicemailTextOrOtherTrace",
           "C:90 | C[46][50] | Gl[77]", PARALEGAL, "UseSafeContactOnly")
g70 = leaf(AchieveGoal, "G-70", "SafetyFlagVisibleOnlyToAuthorizedStaff", "C:92,96", SYSTEM, "MaskSafetyFlag")
g71 = leaf(AchieveGoal, "G-71", "QuickExitAvailable <b>If</b> SafetyConcern", "C:90 (interpreted for online form)",
           SYSTEM, "ProvideQuickExit", stated=False)
g260 = leaf(AchieveGoal, "G-260",
            "ApplicantReachesPersonQuickly <b>If</b> RequestedOrInDanger, AndMayHangUp <b>Without</b> FinishingIntake",
            "C[50] | Gl[68]", PARALEGAL, "TransferToPerson")
g261 = leaf(AchieveGoal, "G-261", "ConcerningLanguageFlaggedForStaff", "C[50][52]", SYSTEM, "FlagConcerningLanguage")
g68 = goal(AvoidGoal, "G-68", "SafetySensitiveSituationExposed", "C:90,92,96 | C[46][50]",
           refinements=[Refinement(False, [g69, g70, g71, g260, g261], "H3")])
g335 = leaf(AchieveGoal, "G-335", "ApplicantToldWhetherInformationReachesBenefitAgencies", "Gl[77]",
            SYSTEM, "ExplainAgencySharing")
g61 = goal(MaintainGoal, "G-61", "IntakeRecordsAccountableConfidentialAndSafe",
           "C:73,75,92,96 | C[30][46][50][65] | Gl[68][74][77]",
           refinements=[Refinement(False, [g62, g63, g68, g245, g323, g335], "P5")])

# ===========================================================================
# Root (merges A:G-1 (incl. G-73, G-130) and B:G-140)
# ===========================================================================
g1 = goal(SoftGoal, "G-1", "EligibleApplicantsReceiveFreeLegalHelpBeforeDeadlinesPass",
          "C:22,77,85 | D:77,83,94 | Gl:6,29,34,59 | C[4] | D[10] | Gl[31][33][83]",
          refinements=[Refinement(False, [g2, g148, g262, g54, g128, g59, g155, g129, g297, g298, g250, g61],
                                  "H12")])

# ===========================================================================
# Obstacles and conflicts
# ===========================================================================
o_urgency = Obstacle("UrgencyMisreportedByApplicant", annotation="H8")
o_owner = Obstacle("AttorneysEachAssumeAnotherHasMatter", annotation="H8")
o_answers = Obstacle("AnswersChosenWithoutApplicantUnderstanding", annotation="H8")
o_session = Obstacle("SessionStoppedByPhoneStorage", annotation="H8")
links = [
    ObstructionLink(g14, o_urgency), ResolutionLink(g18, o_urgency),     # C:90
    ObstructionLink(g41, o_owner), ResolutionLink(g116, o_owner),        # D:63
    ObstructionLink(g132, o_answers), ResolutionLink(g7, o_answers),     # Gl:10,39
    ObstructionLink(g5, o_session), ResolutionLink(g10, o_session),      # Gl:10,17
    ConflictLink(g54, g21),     # K1
    ConflictLink(g326, g69),    # K2  (A:K2 + B:C3)
    ConflictLink(g42, g100),    # K3
    ConflictLink(g156, g7),     # K4
    ConflictLink(g134, g68),    # K5
    ConflictLink(g54, g227),    # K6  (B:C1)
    ConflictLink(g219, g51),    # K7  (B:C2, resolved)
    ConflictLink(g280, g245),   # K8  (B:C4)
    ConflictLink(g100, g21),    # K9  (B:C5)
    ConflictLink(g54, g207),    # K10 (B:C6)
]


def build():
    return generate_graph([g1], links)


def link(out):
    return generate_pako_link(out, "view", config={"theme": "default",
                                                   "themeVariables": {"fontFamily": "Tahoma"}})


def resolve(gid):
    """Follow MERGES until reaching a goal that is still in the model."""
    while gid in MERGES:
        gid = MERGES[gid][0]
    return gid


def origin(gid):
    """Which Assignment-2 model(s) a retained goal comes from."""
    models = {"A" if int(gid[2:]) < 200 else "B"}
    for old in MERGES:
        if resolve(old) == gid:
            models.add("A" if int(old[2:]) < 200 else "B")
    return "+".join(sorted(models))


def tables():
    trace = [("ID", "Type", "Goal", "Sources", "Origin", "Model")]
    trace += [(*row, origin(row[0])) for row in sorted(TRACE, key=lambda r: int(r[0][2:]))]
    merges = [("Retired", "MergedInto", "NowIn", "Stage", "Note")]
    merges += [(old, new, resolve(old), stage, note)
               for old, (new, stage, note) in sorted(MERGES.items(), key=lambda kv: int(kv[0][2:]))]
    bmap = [("ModelB_ID", "CombinedID")]
    bmap += [(f"B:G-{n}", resolve(f"G-{n + 200}")) for n in range(1, 143)]
    return {"combined_goal_trace.csv": trace, "combined_merge_log.csv": merges, "modelB_id_map.csv": bmap}


if __name__ == "__main__":
    out = build()
    print(out)
    print(link(out))
    if "--trace" in sys.argv:
        for name, rows in tables().items():
            print(f"\n# {name}")
            for row in rows:
                print("\t".join(row))
    if "--csv" in sys.argv:
        for name, rows in tables().items():
            with open(name, "w", newline="") as f:
                csv.writer(f).writerows(rows)
