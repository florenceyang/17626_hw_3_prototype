import { COPY } from "./config/copy";
import { QUESTIONS_BY_ID } from "./config/questions";
import type { Answer } from "./types";

/** Human-readable answer text for review and staff screens. */
export function formatAnswer(answer: Answer): string {
  if (answer.unsure) return COPY.notSure;
  const q = QUESTIONS_BY_ID[answer.questionId];
  const v = answer.value;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (q?.kind === "choice") return q.choices?.find((c) => c.value === v)?.label ?? String(v);
  if (q?.kind === "date" && typeof v === "string") return formatDate(v);
  return String(v);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}
