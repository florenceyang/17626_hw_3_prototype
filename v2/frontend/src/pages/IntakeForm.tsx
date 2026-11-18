import { useEffect, useState } from "react";
import { COPY } from "../config/copy";
import { OFFICE } from "../config/office";
import { PrivateGate } from "../components/PrivateGate";
import { QuestionScreen, type QuestionResult } from "../components/QuestionScreen";
import { ReviewStep } from "../components/ReviewStep";
import { UploadStep } from "../components/UploadStep";
import { applicableDocuments, missingDocuments, requiredDocuments } from "../rules/documents";
import { computeUrgency } from "../rules/urgency";
import { nextStepLabel, visibleQuestions } from "../rules/visibleQuestions";
import { navigate } from "../router";
import { now } from "../state/clock";
import { buildSteps, useIntake } from "../state/intakeStore";
import { QUESTIONS_BY_ID } from "../config/questions";

// T029/T038/T046: steps through visible questions (FR-004–FR-006), the private-answers screen (FR-011),
// the upload step (FR-015–FR-017), then review and submit. Steps never touch browser history (R3).
export function IntakeForm() {
  const intake = useIntake();
  const { draft, step, savedMessage } = intake.state;
  const [leaving, setLeaving] = useState(false);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);

  useEffect(() => {
    // Nothing in progress (e.g. after quick exit and Back): go to the welcome screen without adding history.
    // Only when still on #/form: submit and quick exit clear the draft while moving elsewhere.
    if (!draft && window.location.hash === "#/form") navigate("welcome", true);
  }, [draft]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLeaving(false);
  }, [step]);

  if (!draft || !step) return null;

  const steps = buildSteps(draft);
  const index = steps.indexOf(step);
  const questions = visibleQuestions(draft.problemType, draft.answers);

  const back = () => {
    setShowSafetyNotice(false);
    if (index <= 0) {
      if (Object.keys(draft.answers).length > 0) setLeaving(true);
      else {
        intake.discardDraft();
        navigate("welcome");
      }
    } else intake.back();
  };

  if (leaving) {
    return (
      <section className="leave" data-testid="leave-warning">
        <h1>Leave the form?</h1>
        <p>{COPY.leaveWarning}</p>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setLeaving(false)}>
            Stay
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => {
              intake.discardDraft();
              navigate("welcome");
            }}
          >
            Leave
          </button>
        </div>
      </section>
    );
  }

  const safetyNotice = showSafetyNotice && (
    <p className="notice warn" role="status" data-testid="safety-urgency-notice">
      We will mark your request for urgent staff review. Continue with the rest of the form when you are ready.
    </p>
  );

  if (step === "private-gate") {
    return (
      <>
        {safetyNotice}
        <PrivateGate onContinue={intake.next} onBack={back} />
      </>
    );
  }

  const preview = () => computeUrgency(draft.answers, now(), OFFICE);

  if (step === "upload") {
    return (
      <>
        {safetyNotice}
        <UploadStep
          items={applicableDocuments(draft.problemType, draft.answers, preview())}
          documents={draft.documents}
          onChange={intake.setDocuments}
          onBack={back}
          onContinue={intake.next}
          onSaveLater={intake.saveLater}
          savedMessage={savedMessage}
        />
      </>
    );
  }

  if (step === "review") {
    const urgent = preview();
    const missing = missingDocuments(requiredDocuments(draft.problemType, draft.answers, urgent), draft.documents);
    return (
      <>
        {safetyNotice}
        <ReviewStep
          draft={draft}
          questions={questions}
          missing={missing}
          onBack={back}
          onSubmit={intake.submit}
          onSaveLater={intake.saveLater}
          savedMessage={savedMessage}
        />
      </>
    );
  }

  const questionId = step.slice(2);
  const question = QUESTIONS_BY_ID[questionId];
  const qIndex = questions.findIndex((q) => q.id === questionId);
  const following = steps[index + 1];
  const nextStep =
    following === "private-gate" ? "Next: private questions" : nextStepLabel(questions, qIndex);
  const nextStepForAnswer = (result: QuestionResult) => {
    const problemType =
      questionId === "Q-PROBLEM-TYPE"
        ? result.unsure
          ? "unsure"
          : result.value === "eviction" || result.value === "other"
            ? result.value
            : draft.problemType
        : draft.problemType;
    const helperPresent =
      questionId === "Q-HELPER"
        ? result.unsure
          ? "unsure"
          : result.value === "helper"
            ? true
            : result.value === "alone"
              ? false
              : draft.helperPresent
        : draft.helperPresent;
    const previewDraft = {
      ...draft,
      problemType,
      helperPresent,
      answers: {
        ...draft.answers,
        [questionId]: {
          questionId,
          value: result.value,
          unsure: result.unsure,
          private: Boolean(question.private && helperPresent !== false),
        },
      },
    };
    const previewSteps = buildSteps(previewDraft);
    const next = previewSteps[previewSteps.indexOf(`q:${questionId}`) + 1];
    if (next === "private-gate") return "Next: private questions";
    if (next?.startsWith("q:")) return `Next: ${QUESTIONS_BY_ID[next.slice(2)].shortLabel}`;
    return "Next: upload documents";
  };
  const noticeAnswer = draft.answers["Q-NOTICE-DATE"];
  const noticeDate =
    draft.problemType === "eviction" &&
    noticeAnswer &&
    !noticeAnswer.unsure &&
    typeof noticeAnswer.value === "string"
      ? noticeAnswer.value
      : undefined;

  return (
    <>
      {safetyNotice}
      <QuestionScreen
        key={questionId}
        question={question}
        answer={draft.answers[questionId]}
        nextStep={nextStep}
        nextStepForAnswer={nextStepForAnswer}
        noticeDate={noticeDate}
        onSubmit={(r) => {
          setShowSafetyNotice(question.section === "danger" && (r.unsure || r.value === true));
          intake.answer(questionId, r.value, r.unsure);
        }}
        onBack={back}
        onSaveLater={intake.saveLater}
        savedMessage={savedMessage}
      />
    </>
  );
}
