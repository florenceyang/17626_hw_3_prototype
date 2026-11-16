import type { Answer, AnswerValue, Answers, HelpRequest } from "../../src/types";

/** Fictional test data only (Constitution: Prototype Constraints). */
export function makeRequest(overrides: Partial<HelpRequest> = {}): HelpRequest {
  return {
    id: "req-1",
    confirmationNumber: null,
    problemType: "eviction",
    helperPresent: false,
    answers: {},
    documents: [],
    missingDocuments: [],
    urgent: { isUrgent: false, reasons: [] },
    callbackMessage: null,
    status: "draft",
    ownerNickname: null,
    createdAt: "2026-11-17T15:00:00.000Z",
    submittedAt: null,
    ...overrides,
  };
}

export function ans(questionId: string, value: AnswerValue | "unsure", extra: Partial<Answer> = {}): Answer {
  return value === "unsure"
    ? { questionId, value: null, unsure: true, private: false, ...extra }
    : { questionId, value, unsure: false, private: false, ...extra };
}

export function answers(map: Record<string, AnswerValue | "unsure">): Answers {
  const out: Answers = {};
  for (const [id, v] of Object.entries(map)) out[id] = ans(id, v);
  return out;
}

/** A Date for a wall-clock time in New York (EST, UTC-5, valid for November 2026 fixtures). */
export function ny(iso: string): Date {
  return new Date(`${iso}-05:00`);
}
