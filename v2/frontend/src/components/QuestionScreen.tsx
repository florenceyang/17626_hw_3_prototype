import { useId, useState } from "react";
import { COPY } from "../config/copy";
import type { Answer, AnswerValue, Question } from "../types";

// T028: one question per screen (FR-006), explanation before controls (FR-007, K4),
// "I'm not sure" on every question (FR-009).

export interface QuestionResult {
  value: AnswerValue;
  unsure: boolean;
}

interface Props {
  question: Question;
  answer: Answer | undefined;
  nextStep: string;
  nextStepForAnswer?: (result: QuestionResult) => string;
  noticeDate?: string;
  onSubmit: (result: QuestionResult) => void;
  onBack: () => void;
  /** Present only when saving is offered (FR-018, FR-019). */
  onSaveLater?: () => void;
  savedMessage?: string | null;
}

function initialValue(answer: Answer | undefined): string {
  if (!answer || answer.unsure || answer.value === null) return "";
  if (typeof answer.value === "boolean") return answer.value ? "yes" : "no";
  return String(answer.value);
}

function resultFromValue(question: Question, raw: string, unsure: boolean): QuestionResult | null {
  if (unsure) return { value: null, unsure: true };
  if (raw === "") return null;
  return {
    value: question.kind === "yesNo" ? raw === "yes" : question.kind === "number" ? Number(raw) : raw,
    unsure: false,
  };
}

export function QuestionScreen({
  question,
  answer,
  nextStep,
  nextStepForAnswer,
  noticeDate,
  onSubmit,
  onBack,
  onSaveLater,
  savedMessage,
}: Props) {
  const [raw, setRaw] = useState<string>(() => initialValue(answer));
  const [unsure, setUnsure] = useState<boolean>(() => answer?.unsure ?? false);
  const promptId = useId();
  const explainId = useId();

  const choose = (value: string) => {
    setRaw(value);
    setUnsure(false);
  };

  const dateOrderError =
    question.id === "Q-COURT-DATE" &&
    noticeDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(noticeDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(raw) &&
    raw < noticeDate;
  const valid =
    unsure ||
    (!dateOrderError && (question.kind === "number" ? raw !== "" && Number(raw) >= 0 : raw !== ""));
  const currentResult = resultFromValue(question, raw, unsure);
  const displayedNextStep =
    currentResult && nextStepForAnswer ? nextStepForAnswer(currentResult) : nextStep;

  const submit = () => {
    if (!valid) return;
    if (currentResult) onSubmit(currentResult);
  };

  const options =
    question.kind === "yesNo"
      ? [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]
      : (question.choices ?? []);

  return (
    <form
      className="question"
      data-testid="question"
      data-question-id={question.id}
      data-kind={question.kind}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h1 id={promptId} className="prompt">
        {question.prompt}
      </h1>

      {question.explanation && (
        <p id={explainId} className="explanation" data-testid="explanation">
          {question.explanation}
        </p>
      )}

      <div className="controls">
        {(question.kind === "choice" || question.kind === "yesNo") && (
          <fieldset aria-labelledby={promptId}>
            {options.map((o) => (
              <label key={o.value} className="option">
                <input
                  type="radio"
                  name={question.id}
                  value={o.value}
                  checked={!unsure && raw === o.value}
                  onChange={() => choose(o.value)}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </fieldset>
        )}
        {question.kind === "date" && (
          <input
            type="date"
            className="text-input"
            aria-labelledby={promptId}
            aria-describedby={question.explanation ? explainId : undefined}
            value={unsure ? "" : raw}
            onChange={(e) => choose(e.target.value)}
          />
        )}
        {question.kind === "number" && (
          <input
            type="number"
            inputMode="numeric"
            min={0}
            className="text-input"
            aria-labelledby={promptId}
            value={unsure ? "" : raw}
            onChange={(e) => choose(e.target.value)}
          />
        )}

        <button
          type="button"
          className={`unsure ${unsure ? "selected" : ""}`}
          data-testid="unsure"
          aria-pressed={unsure}
          onClick={() => {
            setUnsure(true);
            setRaw("");
          }}
        >
          {COPY.unsure}
        </button>
      </div>

      {dateOrderError && (
        <p className="notice warn" role="alert" data-testid="date-order-warning">
          The court date is before your notice date. Please check both dates. If you are not sure, choose "I'm not
          sure".
        </p>
      )}

      <p className="next-step" data-testid="next-step">
        {displayedNextStep}
      </p>

      <div className="actions">
        <button type="button" className="secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="primary" disabled={!valid}>
          Continue
        </button>
      </div>

      {onSaveLater && (
        <div className="save-later">
          <button type="button" className="link" data-testid="save-later" onClick={onSaveLater}>
            Save and finish later
          </button>
          {savedMessage && (
            <span role="status" className="saved">
              {savedMessage}
            </span>
          )}
        </div>
      )}
    </form>
  );
}
