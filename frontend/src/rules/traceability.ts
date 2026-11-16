import type { DocumentRule, Question } from "../types";

// R9, Constitution Principle II: every configured question and document rule cites an FR.
export function allConfigTraced(questions: Question[], documentRules: DocumentRule[]): string[] {
  return [
    ...questions.filter((q) => q.traces.fr.length === 0).map((q) => q.id),
    ...documentRules.filter((d) => d.traces.fr.length === 0).map((d) => d.type),
  ];
}
