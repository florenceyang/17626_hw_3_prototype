// Entity types from specs/001-legal-aid-intake-form/data-model.md (enables FR-001 to FR-026).

export type ProblemType = "eviction" | "other" | "unsure";

export type Section =
  | "problem"
  | "helper"
  | "deadline"
  | "danger"
  | "housing"
  | "household"
  | "income";

export type QuestionKind = "choice" | "date" | "number" | "yesNo";

export type DocumentType =
  | "problemNotice"
  | "incomeProof"
  | "deadlinePaperwork"
  | "evictionNotice"
  | "lease"
  | "courtPapers"
  | "rentHistory"
  | "inspectionNotices"
  | "recertPaperwork";

export type RequiredWhen =
  | "always"
  | "hasIncome"
  | "urgentByDate"
  | "hasVoucherOrPublicHousing"
  | "hasSubsidy"
  | "subsidyAndRecertIssues"
  | "never";

export type Readability = "readable" | "unreadable" | "wrongPage";

export type Status = "draft" | "waitingForStaffReview";

export type UrgencyReason = "date" | "danger";

export interface Traces {
  fr: string[];
  goals: string[];
}

/** `null` when the applicant chose "I'm not sure" (FR-009). */
export type AnswerValue = string | number | boolean | null;

export interface Answer {
  questionId: string;
  value: AnswerValue;
  unsure: boolean;
  /** Set on court and notice dates (FR-013, G-30). */
  source?: "reported";
  /** Danger answers given while a helper may be present (FR-011). */
  private: boolean;
}

export type Answers = Record<string, Answer>;

export interface Choice {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  section: Section;
  appliesTo: "all" | Exclude<ProblemType, "unsure">[];
  showIf?: (answers: Answers) => boolean;
  kind: QuestionKind;
  prompt: string;
  /** Used in next-step lines, for example "Next: your court date" (FR-006). */
  shortLabel: string;
  explanation?: string;
  choices?: Choice[];
  private?: boolean;
  /** Answer is applicant-reported and must be labeled unverified (FR-013). */
  reported?: boolean;
  traces: Traces;
}

export interface DocumentRule {
  type: DocumentType;
  appliesTo: "all" | "eviction";
  requiredWhen: RequiredWhen;
  satisfiedBy: DocumentType[];
  label: string;
  explanation: string;
  source: string;
  traces: Traces;
}

/** Metadata only; file contents are never stored (R4). */
export interface UploadedDocument {
  type: DocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  readability: Readability;
}

export interface Urgency {
  isUrgent: boolean;
  reasons: UrgencyReason[];
}

export interface HelpRequest {
  id: string;
  confirmationNumber: string | null;
  problemType: ProblemType | null;
  /** "unsure" is treated as a helper being present (K5). */
  helperPresent: boolean | "unsure" | null;
  answers: Answers;
  documents: UploadedDocument[];
  missingDocuments: DocumentType[];
  urgent: Urgency;
  callbackMessage: string | null;
  status: Status;
  ownerNickname: string | null;
  createdAt: string;
  submittedAt: string | null;
}

export interface MockAccount {
  /** string, 1–30 characters, unique in this browser (R5). */
  nickname: string;
  draft: HelpRequest | null;
  submittedConfirmationNumbers: string[];
}

export interface OfficeConfig {
  timeZone: string;
  /** Included. */
  openHour: number;
  /** Excluded: 5:00 pm is after hours. */
  closeHour: number;
  /** 0 = Sunday … 6 = Saturday. */
  businessDays: number[];
  helpContact: { phone: string; hours: string };
  quickExitUrl: string;
}
