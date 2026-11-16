import { QUESTIONS } from "../config/questions";
import type { Answers, ProblemType, Question, Section } from "../types";

// FR-004, FR-005, FR-006 (contracts/rules.md).
export const SECTION_ORDER: Section[] = ["problem", "helper", "deadline", "danger", "housing", "household", "income"];

export function visibleQuestions(problemType: ProblemType | null, answers: Answers): Question[] {
  return QUESTIONS.filter((q) => {
    if (q.appliesTo !== "all") {
      if (problemType === null || problemType === "unsure") return false;
      if (!q.appliesTo.includes(problemType)) return false;
    }
    return q.showIf ? q.showIf(answers) : true;
  })
    .map((q, i) => ({ q, i }))
    .sort((a, b) => SECTION_ORDER.indexOf(a.q.section) - SECTION_ORDER.indexOf(b.q.section) || a.i - b.i)
    .map(({ q }) => q);
}

export function nextStepLabel(questions: Question[], index: number): string {
  const next = questions[index + 1];
  return next ? `Next: ${next.shortLabel}` : "Next: upload documents";
}
