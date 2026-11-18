import type { DocumentRule } from "../types";

// T043: one rule per row of the spec's Document Requirements table (FR-015, FR-017; G-8, G-95).
const traces = { fr: ["FR-015", "FR-017"], goals: ["G-8", "G-95"] };

export const DOCUMENT_RULES: DocumentRule[] = [
  {
    type: "problemNotice",
    appliesTo: "all",
    requiredWhen: "always",
    satisfiedBy: ["evictionNotice"],
    label: "A notice about your problem",
    explanation: "Any letter or notice you got about this problem, plus any other papers you think matter.",
    source: "C14, C68",
    traces,
  },
  {
    type: "incomeProof",
    appliesTo: "all",
    requiredWhen: "hasIncome",
    satisfiedBy: [],
    label: "Pay stubs or other proof of income",
    explanation: "A recent pay stub, benefits letter, or anything that shows money coming in.",
    source: "C45, C68",
    traces,
  },
  {
    type: "deadlinePaperwork",
    appliesTo: "all",
    requiredWhen: "urgentByDate",
    satisfiedBy: ["courtPapers"],
    label: "Notice or hearing paperwork showing your deadline",
    explanation: "The paper that shows your court date or deadline. Court papers count.",
    source: "C90",
    traces,
  },
  {
    type: "evictionNotice",
    appliesTo: "eviction",
    requiredWhen: "always",
    satisfiedBy: [],
    label: "Eviction notice",
    explanation:
      "The letter from your landlord: a rent demand, termination notice, or holdover notice. We need it to check how and when it was given to you.",
    source: "D22, D25, Gl10",
    traces,
  },
  {
    type: "lease",
    appliesTo: "eviction",
    requiredWhen: "always",
    satisfiedBy: [],
    label: "Lease",
    explanation: "Your rental agreement with your landlord. Take a photo of every page if you can.",
    source: "D22, D25",
    traces,
  },
  {
    type: "courtPapers",
    appliesTo: "eviction",
    requiredWhen: "never",
    satisfiedBy: [],
    label: "Court papers (if you have them)",
    explanation: "Papers from the court, such as a petition. They show your court date and an index number.",
    source: "D22, D25",
    traces,
  },
  {
    type: "rentHistory",
    appliesTo: "eviction",
    requiredWhen: "hasVoucherOrPublicHousing",
    satisfiedBy: [],
    label: "Rent payment history",
    explanation: "A record of the rent you paid, such as receipts or a ledger from your landlord or housing office.",
    source: "D15, D20",
    traces,
  },
  {
    type: "inspectionNotices",
    appliesTo: "eviction",
    requiredWhen: "hasSubsidy",
    satisfiedBy: [],
    label: "Inspection notices",
    explanation: "Letters about inspections of your home by the housing program.",
    source: "D20",
    traces,
  },
  {
    type: "recertPaperwork",
    appliesTo: "eviction",
    requiredWhen: "subsidyAndRecertIssues",
    satisfiedBy: [],
    label: "Recertification paperwork",
    explanation: "The forms and letters about your yearly recertification with the housing program.",
    source: "D20",
    traces,
  },
];

export const DOCUMENT_RULES_BY_TYPE = Object.fromEntries(DOCUMENT_RULES.map((r) => [r.type, r])) as Record<
  DocumentRule["type"],
  DocumentRule
>;
