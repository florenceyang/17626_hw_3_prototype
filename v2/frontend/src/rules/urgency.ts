import { QUESTIONS } from "../config/questions";
import { daysBetween, officeIsoDate } from "../state/clock";
import type { Answers, OfficeConfig, Urgency, UrgencyReason } from "../types";

// FR-014, FR-024, R8: compare calendar dates in the office time zone.
const DANGER_IDS = QUESTIONS.filter((q) => q.section === "danger").map((q) => q.id);

export function computeUrgency(answers: Answers, submittedAt: Date, office: OfficeConfig): Urgency {
  const reasons: UrgencyReason[] = [];

  const court = answers["Q-COURT-DATE"];
  if (court && !court.unsure && typeof court.value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(court.value)) {
    const submittedDay = officeIsoDate(submittedAt, office.timeZone);
    if (daysBetween(submittedDay, court.value) <= 7) reasons.push("date");
  }

  const dangerReported = DANGER_IDS.some((id) => {
    const a = answers[id];
    return a !== undefined && (a.unsure || a.value === true);
  });
  if (dangerReported) reasons.push("danger");

  return { isUrgent: reasons.length > 0, reasons };
}
