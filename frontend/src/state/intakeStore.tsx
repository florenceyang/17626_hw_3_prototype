import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import { QUESTIONS_BY_ID } from "../config/questions";
import { OFFICE } from "../config/office";
import { callbackMessage } from "../rules/callback";
import { newConfirmationNumber } from "../rules/confirmationNumber";
import { missingDocuments, requiredDocuments } from "../rules/documents";
import { computeUrgency } from "../rules/urgency";
import { visibleQuestions } from "../rules/visibleQuestions";
import { navigate } from "../router";
import type { Answer, AnswerValue, Answers, HelpRequest, ProblemType, UploadedDocument } from "../types";
import { addSubmitted, loadDraft, saveDraft } from "./accounts";
import { now } from "./clock";
import { loadRequests, saveRequest } from "./storage";

// T013 in-memory intake store. The anonymous draft lives only in memory (R4):
// nothing here writes a draft to storage unless the applicant is logged in to a mock account.

export type StepKey = `q:${string}` | "private-gate" | "upload" | "review";

export interface IntakeState {
  draft: HelpRequest | null;
  step: StepKey | null;
  loggedInNickname: string | null;
  lastSubmitted: HelpRequest | null;
  /** The applicant chose "Save and finish later" while logged out (FR-019). */
  pendingSave: boolean;
  savedMessage: string | null;
}

const INITIAL: IntakeState = {
  draft: null,
  step: null,
  loggedInNickname: null,
  lastSubmitted: null,
  pendingSave: false,
  savedMessage: null,
};

function newDraft(): HelpRequest {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
    confirmationNumber: null,
    problemType: null,
    helperPresent: null,
    answers: {},
    documents: [],
    missingDocuments: [],
    urgent: { isUrgent: false, reasons: [] },
    callbackMessage: null,
    status: "draft",
    ownerNickname: null,
    createdAt: now().toISOString(),
    submittedAt: null,
  };
}

/** Ordered steps for a draft: questions, the private-answers screen before danger questions (FR-011), upload, review. */
export function buildSteps(draft: HelpRequest): StepKey[] {
  const steps: StepKey[] = [];
  let gateAdded = false;
  for (const q of visibleQuestions(draft.problemType, draft.answers)) {
    if (q.section === "danger" && !gateAdded && draft.helperPresent !== false) {
      steps.push("private-gate");
      gateAdded = true;
    }
    steps.push(`q:${q.id}`);
  }
  steps.push("upload", "review");
  return steps;
}

/** First step without an answer, used when resuming a saved draft (FR-018, US5-AS2). */
export function firstUnansweredStep(draft: HelpRequest): StepKey {
  const steps = buildSteps(draft);
  const i = steps.findIndex((s) => s.startsWith("q:") && !draft.answers[s.slice(2)]);
  if (i === -1) return "upload";
  return i > 0 && steps[i - 1] === "private-gate" ? "private-gate" : steps[i];
}

function isPrivate(questionId: string, helperPresent: HelpRequest["helperPresent"]): boolean {
  return Boolean(QUESTIONS_BY_ID[questionId]?.private) && helperPresent !== false;
}

type Action =
  | { type: "start" }
  | { type: "answer"; questionId: string; value: AnswerValue; unsure: boolean }
  | { type: "next" }
  | { type: "back" }
  | { type: "setDocuments"; documents: UploadedDocument[] }
  | { type: "submitted"; request: HelpRequest }
  | { type: "discardDraft" }
  | { type: "reset" }
  | { type: "login"; nickname: string; savedDraft: HelpRequest | null }
  | { type: "logout" }
  | { type: "pendingSave"; value: boolean }
  | { type: "savedMessage"; value: string | null };

function move(state: IntakeState, delta: 1 | -1): IntakeState {
  if (!state.draft || !state.step) return state;
  const steps = buildSteps(state.draft);
  const i = steps.indexOf(state.step);
  const next = steps[Math.min(Math.max(i + delta, 0), steps.length - 1)];
  return { ...state, step: next, savedMessage: null };
}

function reducer(state: IntakeState, action: Action): IntakeState {
  switch (action.type) {
    case "start": {
      const draft = newDraft();
      return { ...state, draft, step: buildSteps(draft)[0], lastSubmitted: null, savedMessage: null };
    }
    case "answer": {
      if (!state.draft) return state;
      const draft: HelpRequest = { ...state.draft, answers: { ...state.draft.answers } };
      const { questionId, value, unsure } = action;
      if (questionId === "Q-PROBLEM-TYPE") draft.problemType = unsure ? "unsure" : (value as ProblemType);
      if (questionId === "Q-HELPER") draft.helperPresent = unsure ? "unsure" : value === "helper";
      const answer: Answer = { questionId, value: unsure ? null : value, unsure, private: false };
      if (QUESTIONS_BY_ID[questionId]?.reported && !unsure) answer.source = "reported";
      draft.answers[questionId] = answer;
      // Recompute privacy for every answer, since the helper answer may have changed (FR-011, K5).
      for (const id of Object.keys(draft.answers)) {
        draft.answers[id] = { ...draft.answers[id], private: isPrivate(id, draft.helperPresent) };
      }
      return move({ ...state, draft }, 1);
    }
    case "next":
      return move(state, 1);
    case "back":
      return move(state, -1);
    case "setDocuments":
      return state.draft ? { ...state, draft: { ...state.draft, documents: action.documents } } : state;
    case "submitted":
      return { ...state, draft: null, step: null, lastSubmitted: action.request, pendingSave: false, savedMessage: null };
    case "discardDraft":
      return { ...state, draft: null, step: null, pendingSave: false, savedMessage: null };
    case "reset":
      return INITIAL;
    case "login": {
      const base = { ...state, loggedInNickname: action.nickname };
      if (!state.draft && action.savedDraft) {
        return { ...base, draft: action.savedDraft, step: firstUnansweredStep(action.savedDraft) };
      }
      return base;
    }
    case "logout":
      return { ...state, loggedInNickname: null };
    case "pendingSave":
      return { ...state, pendingSave: action.value };
    case "savedMessage":
      return { ...state, savedMessage: action.value };
  }
}

/** Answers for questions the applicant can still see; stale answers from a changed path are dropped. */
function visibleAnswers(draft: HelpRequest): Answers {
  const ids = new Set(visibleQuestions(draft.problemType, draft.answers).map((q) => q.id));
  return Object.fromEntries(Object.entries(draft.answers).filter(([id]) => ids.has(id)));
}

interface IntakeApi {
  state: IntakeState;
  start: () => void;
  answer: (questionId: string, value: AnswerValue, unsure: boolean) => void;
  next: () => void;
  back: () => void;
  setDocuments: (documents: UploadedDocument[]) => void;
  submit: () => void;
  discardDraft: () => void;
  reset: () => void;
  saveLater: () => void;
  completeLogin: (nickname: string) => void;
  logout: () => void;
  cancelPendingSave: () => void;
}

const IntakeContext = createContext<IntakeApi | null>(null);

export function IntakeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const submit = useCallback(() => {
    if (!state.draft) return;
    const submittedAt = now();
    const answers = visibleAnswers(state.draft);
    const urgent = computeUrgency(answers, submittedAt, OFFICE);
    const required = requiredDocuments(state.draft.problemType, answers, urgent);
    const existing = loadRequests()
      .map((r) => r.confirmationNumber)
      .filter((n): n is string => Boolean(n));
    const request: HelpRequest = {
      ...state.draft,
      answers,
      urgent,
      missingDocuments: missingDocuments(required, state.draft.documents),
      callbackMessage: callbackMessage(urgent, submittedAt, OFFICE),
      confirmationNumber: newConfirmationNumber(submittedAt, existing, OFFICE.timeZone),
      status: "waitingForStaffReview",
      ownerNickname: state.loggedInNickname,
      submittedAt: submittedAt.toISOString(),
    };
    saveRequest(request);
    if (state.loggedInNickname) {
      addSubmitted(state.loggedInNickname, request.confirmationNumber!);
      saveDraft(state.loggedInNickname, null);
    }
    dispatch({ type: "submitted", request });
    navigate("confirmation");
  }, [state.draft, state.loggedInNickname]);

  const saveLater = useCallback(() => {
    if (!state.draft) return;
    if (state.loggedInNickname) {
      saveDraft(state.loggedInNickname, state.draft);
      dispatch({ type: "savedMessage", value: "Saved. You can come back and finish later." });
    } else {
      dispatch({ type: "pendingSave", value: true });
      navigate("account");
    }
  }, [state.draft, state.loggedInNickname]);

  const completeLogin = useCallback(
    (nickname: string) => {
      if (state.draft && state.pendingSave) {
        saveDraft(nickname, state.draft);
        dispatch({ type: "pendingSave", value: false });
      }
      dispatch({ type: "login", nickname, savedDraft: state.draft ? null : loadDraft(nickname) });
    },
    [state.draft, state.pendingSave],
  );

  const api = useMemo<IntakeApi>(
    () => ({
      state,
      start: () => dispatch({ type: "start" }),
      answer: (questionId, value, unsure) => dispatch({ type: "answer", questionId, value, unsure }),
      next: () => dispatch({ type: "next" }),
      back: () => dispatch({ type: "back" }),
      setDocuments: (documents) => dispatch({ type: "setDocuments", documents }),
      submit,
      discardDraft: () => dispatch({ type: "discardDraft" }),
      reset: () => dispatch({ type: "reset" }),
      saveLater,
      completeLogin,
      logout: () => dispatch({ type: "logout" }),
      cancelPendingSave: () => dispatch({ type: "pendingSave", value: false }),
    }),
    [state, submit, saveLater, completeLogin],
  );

  return <IntakeContext.Provider value={api}>{children}</IntakeContext.Provider>;
}

export function useIntake(): IntakeApi {
  const api = useContext(IntakeContext);
  if (!api) throw new Error("useIntake must be used inside IntakeProvider");
  return api;
}
