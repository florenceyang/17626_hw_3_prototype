import type { Answers, Question } from "../types";

// T022: the question set. Order inside the array is the order within each section;
// sections are ordered by rules/visibleQuestions.ts (FR-005).
// "I'm not sure" is offered by QuestionScreen for every question (FR-009).

const answered = (answers: Answers, id: string) => answers[id] && !answers[id].unsure;

export const QUESTIONS: Question[] = [
  {
    id: "Q-PROBLEM-TYPE",
    section: "problem",
    appliesTo: "all",
    kind: "choice",
    prompt: "What kind of problem do you need help with?",
    shortLabel: "what kind of problem you have",
    explanation: "We ask this first so we only show you the questions that matter for your problem.",
    choices: [
      { value: "eviction", label: "Eviction or housing" },
      { value: "other", label: "Something else" },
    ],
    traces: { fr: ["FR-004"], goals: ["G-6"] },
  },
  {
    id: "Q-HELPER",
    section: "helper",
    appliesTo: "all",
    kind: "choice",
    prompt: "Is someone helping you fill in this form?",
    shortLabel: "whether someone is helping you",
    explanation: "It is fine to have a relative or friend help you. Some questions will ask you to answer on your own.",
    choices: [
      { value: "alone", label: "I'm filling this in myself" },
      { value: "helper", label: "Someone is helping me" },
    ],
    traces: { fr: ["FR-010"], goals: ["G-133", "G-134"] },
  },
  {
    id: "Q-NOTICE-DATE",
    section: "deadline",
    appliesTo: ["eviction"],
    kind: "date",
    prompt: "What date is on your eviction notice?",
    shortLabel: "the date on your eviction notice",
    explanation:
      "An eviction notice is a letter from your landlord saying they want you to leave or pay. It may be called a rent demand, a termination notice, or a holdover notice. It is not the same as court papers.",
    reported: true,
    traces: { fr: ["FR-012", "FR-013"], goals: ["G-81", "G-30"] },
  },
  {
    id: "Q-COURT-DATE",
    section: "deadline",
    appliesTo: "all",
    kind: "date",
    prompt: "What is the date you have to go to court?",
    shortLabel: "your court date",
    explanation:
      "Your court appearance date is the day you must be at court (or online with the court). It is usually printed on court papers. If you do not have a court date, choose \"I'm not sure\".",
    reported: true,
    traces: { fr: ["FR-012", "FR-013", "FR-014"], goals: ["G-81", "G-30", "G-406"] },
  },
  {
    // TODO: staff review — placeholder wording (spec Assumptions).
    id: "Q-DANGER-AFRAID",
    section: "danger",
    appliesTo: "all",
    kind: "yesNo",
    prompt: "Are you afraid someone may hurt you if they find out you contacted us?",
    shortLabel: "a safety question",
    explanation: "We ask so we can contact you safely. Your answer will not be shown again on this form.",
    private: true,
    traces: { fr: ["FR-005", "FR-011", "FR-014", "FR-024"], goals: ["G-15", "G-68", "G-406"] },
  },
  {
    // TODO: staff review — placeholder wording (spec Assumptions).
    id: "Q-DANGER-HOME",
    section: "danger",
    appliesTo: "all",
    kind: "yesNo",
    prompt: "Is anyone where you live threatening you or making you feel unsafe right now?",
    shortLabel: "a safety question",
    explanation: "We ask so we can help you quickly. Your answer will not be shown again on this form.",
    private: true,
    traces: { fr: ["FR-005", "FR-011", "FR-014", "FR-024"], goals: ["G-15", "G-68", "G-406"] },
  },
  {
    id: "Q-SUBSIDY",
    section: "housing",
    appliesTo: ["eviction"],
    kind: "choice",
    prompt: "Does your household get help paying rent?",
    shortLabel: "help paying rent",
    explanation:
      "A housing subsidy is help from the government to pay rent. Examples are a Section 8 voucher, living in public housing, or another rent program.",
    choices: [
      { value: "voucher", label: "Section 8 or another voucher" },
      { value: "publicHousing", label: "Public housing" },
      { value: "otherSubsidy", label: "Another housing subsidy" },
      { value: "none", label: "None" },
    ],
    traces: { fr: ["FR-017"], goals: ["G-95"] },
  },
  {
    id: "Q-RECERT",
    section: "housing",
    appliesTo: ["eviction"],
    showIf: (a) => answered(a, "Q-SUBSIDY") && a["Q-SUBSIDY"].value !== "none",
    kind: "yesNo",
    prompt: "Are there problems with your recertification?",
    shortLabel: "your recertification",
    explanation:
      "Recertification is the yearly paperwork you send to the housing program to show your income and who lives with you, so they can set your rent.",
    traces: { fr: ["FR-017"], goals: ["G-95"] },
  },
  {
    id: "Q-HOUSEHOLD-SIZE",
    section: "household",
    appliesTo: "all",
    kind: "number",
    prompt: "How many people live in your home, including you?",
    shortLabel: "who lives with you",
    traces: { fr: ["FR-005"], goals: ["G-15"] },
  },
  {
    id: "Q-HAS-INCOME",
    section: "income",
    appliesTo: "all",
    kind: "yesNo",
    prompt: "Does anyone in your home get money from a job, benefits, or anything else?",
    shortLabel: "household income",
    explanation: "Income means any money coming in: pay from work, benefits, child support, or help from family.",
    traces: { fr: ["FR-005", "FR-017"], goals: ["G-15", "G-95"] },
  },
  {
    id: "Q-INCOME-AMOUNT",
    section: "income",
    appliesTo: "all",
    showIf: (a) => answered(a, "Q-HAS-INCOME") && a["Q-HAS-INCOME"].value === true,
    kind: "number",
    prompt: "About how much money comes into your home each month, in dollars?",
    shortLabel: "how much money comes in",
    explanation: "A rough guess is fine. Add up everyone's income for one month.",
    traces: { fr: ["FR-005"], goals: ["G-15"] },
  },
];

export const QUESTIONS_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
