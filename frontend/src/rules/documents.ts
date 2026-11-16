import { DOCUMENT_RULES } from "../config/documents";
import type { Answers, DocumentRule, DocumentType, ProblemType, UploadedDocument, Urgency } from "../types";

// FR-015, FR-017 (contracts/rules.md and the spec's Document Requirements table).

type Condition = true | false | "unknown";

const SUBSIDIES = ["voucher", "publicHousing", "otherSubsidy"];

function yesNo(answers: Answers, id: string): Condition {
  const a = answers[id];
  if (!a) return false;
  if (a.unsure) return "unknown";
  return a.value === true;
}

function subsidy(answers: Answers): string | "unknown" | null {
  const a = answers["Q-SUBSIDY"];
  if (!a) return null;
  if (a.unsure) return "unknown";
  return typeof a.value === "string" ? a.value : null;
}

function condition(rule: DocumentRule, answers: Answers, urgent: Urgency): Condition {
  const s = subsidy(answers);
  switch (rule.requiredWhen) {
    case "always":
      return true;
    case "never":
      return "unknown"; // listed as optional, never missing
    case "hasIncome":
      return yesNo(answers, "Q-HAS-INCOME");
    case "urgentByDate":
      return urgent.reasons.includes("date");
    case "hasVoucherOrPublicHousing":
      return s === "unknown" ? "unknown" : s === "voucher" || s === "publicHousing";
    case "hasSubsidy":
      return s === "unknown" ? "unknown" : s !== null && SUBSIDIES.includes(s);
    case "subsidyAndRecertIssues": {
      if (s === "unknown") return "unknown";
      if (s === null || !SUBSIDIES.includes(s)) return false;
      return yesNo(answers, "Q-RECERT");
    }
  }
}

export interface ApplicableDocument {
  rule: DocumentRule;
  required: boolean;
}

/** Documents to list on the upload step: required ones, plus optional ones whose condition is unknown. */
export function applicableDocuments(
  problemType: ProblemType | null,
  answers: Answers,
  urgent: Urgency,
): ApplicableDocument[] {
  const isEviction = problemType === "eviction";
  // Eviction-specific documents are listed first, so the eviction notice and lease lead the upload step.
  const ordered = isEviction
    ? [...DOCUMENT_RULES.filter((r) => r.appliesTo === "eviction"), ...DOCUMENT_RULES.filter((r) => r.appliesTo === "all")]
    : DOCUMENT_RULES.filter((r) => r.appliesTo === "all");
  return ordered
    .filter((r) => !(isEviction && r.type === "problemNotice")) // the eviction notice stands in for it
    .map((rule) => ({ rule, c: condition(rule, answers, urgent) }))
    .filter(({ c }) => c !== false)
    .map(({ rule, c }) => ({ rule, required: c === true }));
}

export function requiredDocuments(problemType: ProblemType | null, answers: Answers, urgent: Urgency): DocumentRule[] {
  return applicableDocuments(problemType, answers, urgent)
    .filter((d) => d.required)
    .map((d) => d.rule);
}

export function missingDocuments(required: DocumentRule[], documents: UploadedDocument[]): DocumentType[] {
  const readable = new Set(documents.filter((d) => d.readability === "readable").map((d) => d.type));
  return required
    .filter((r) => r.requiredWhen !== "never")
    .filter((r) => !readable.has(r.type) && !r.satisfiedBy.some((t) => readable.has(t)))
    .map((r) => r.type);
}
