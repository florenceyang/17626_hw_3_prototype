import { COPY } from "../config/copy";
import { DOCUMENT_RULES_BY_TYPE } from "../config/documents";
import { navigate } from "../router";
import { useIntake } from "../state/intakeStore";

// T032/T047: FR-021 (number and its purpose, documents received, callback), FR-022 (no eligibility outcome),
// FR-011 (no private answers are shown here at all).
export function Confirmation() {
  const { lastSubmitted: request, loggedInNickname } = useIntake().state;

  if (!request) {
    return (
      <section>
        <h1>No request to show</h1>
        <button type="button" className="primary" onClick={() => navigate("welcome")}>
          Go to the start
        </button>
      </section>
    );
  }

  const received = request.documents.filter((d) => d.readability === "readable");

  return (
    <section className="confirmation">
      <h1>{COPY.confirmation.title}</h1>

      <div className="card">
        <p className="conf-number" data-testid="confirmation-number">
          {request.confirmationNumber}
        </p>
        <p>{COPY.confirmation.numberPurpose}</p>
      </div>

      <h2>When we will call</h2>
      <p className="callback" data-testid="callback">
        {request.callbackMessage}
      </p>

      <h2>{COPY.confirmation.docsTitle}</h2>
      <div data-testid="docs-received">
        {received.length === 0 ? (
          COPY.confirmation.none
        ) : (
          <ul>
            {received.map((d) => (
              <li key={d.type}>{DOCUMENT_RULES_BY_TYPE[d.type].label}</li>
            ))}
          </ul>
        )}
      </div>

      <h2>{COPY.confirmation.statusTitle}</h2>
      <p className="status" data-testid="status">
        {COPY.confirmation.status}
      </p>
      <p>{COPY.confirmation.statusExplain}</p>

      {loggedInNickname && (
        <button type="button" className="link" onClick={() => navigate("account")}>
          See my status
        </button>
      )}
    </section>
  );
}
