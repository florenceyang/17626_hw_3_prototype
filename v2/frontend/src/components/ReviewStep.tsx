import { COPY } from "../config/copy";
import { DOCUMENT_RULES_BY_TYPE } from "../config/documents";
import { formatAnswer } from "../format";
import type { DocumentType, HelpRequest, Question } from "../types";

// T030/T039/T046: FR-013 (reported dates labeled), FR-011 (private answers never shown),
// FR-017 (missing documents named; Submit stays available).
interface Props {
  draft: HelpRequest;
  questions: Question[];
  missing: DocumentType[];
  onBack: () => void;
  onSubmit: () => void;
  onSaveLater: () => void;
  savedMessage: string | null;
}

export function ReviewStep({ draft, questions, missing, onBack, onSubmit, onSaveLater, savedMessage }: Props) {
  const readableTypes = [
    ...new Set(draft.documents.filter((d) => d.readability === "readable").map((d) => d.type)),
  ];
  return (
    <section className="review" data-testid="review-step">
      <h1>Check your answers</h1>

      {missing.length > 0 && (
        <div className="notice warn" data-testid="missing-docs" role="status">
          <strong>Some documents are missing:</strong>
          <ul>
            {missing.map((t) => (
              <li key={t}>{DOCUMENT_RULES_BY_TYPE[t].label}</li>
            ))}
          </ul>
          <p>You can still send your request. Staff may ask you for these later.</p>
        </div>
      )}

      <dl className="answers">
        {questions.map((q) => {
          const a = draft.answers[q.id];
          if (!a || a.private) return null; // FR-011: no placeholder that reveals private answers
          return (
            <div key={q.id} className="answer-row" data-testid={`review-${q.id}`}>
              <dt>{q.prompt}</dt>
              <dd>
                {formatAnswer(a)}
              </dd>
            </div>
          );
        })}
      </dl>

      <h2>Documents</h2>
      <p>
        {readableTypes.length
          ? readableTypes.map((type) => DOCUMENT_RULES_BY_TYPE[type].label).join(", ")
          : COPY.confirmation.none}
      </p>

      <p className="next-step" data-testid="next-step">
        Next: send your request
      </p>
      <div className="actions">
        <button type="button" className="secondary" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary" onClick={onSubmit}>
          Send my request
        </button>
      </div>
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
    </section>
  );
}
