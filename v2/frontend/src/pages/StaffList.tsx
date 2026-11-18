import { useState } from "react";
import { COPY } from "../config/copy";
import { DOCUMENT_RULES_BY_TYPE } from "../config/documents";
import { QUESTIONS_BY_ID } from "../config/questions";
import { MockBanner } from "../components/MockBanner";
import { formatAnswer } from "../format";
import { clearPrototypeData, loadRequests } from "../state/storage";
import type { HelpRequest } from "../types";

// T050: mock staff list (FR-023, FR-026). Shows urgency, unsure answers, missing documents and
// unverified court dates. Never shows an eligibility decision or private danger answer values.

function unsureLabels(r: HelpRequest): string[] {
  return Object.values(r.answers)
    .filter((a) => a.unsure)
    .map((a) => {
      const q = QUESTIONS_BY_ID[a.questionId];
      if (!q) return a.questionId;
      return q.private ? q.staffLabel ?? "A safety question" : q.prompt;
    });
}

export function StaffList() {
  const [requests, setRequests] = useState<HelpRequest[]>(() =>
    [...loadRequests()].sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")),
  );

  return (
    <section className="staff">
      <MockBanner />
      <h1>Requests waiting for staff review</h1>
      <p>Staff list for the prototype. It shows requests sent from this browser only.</p>

      {requests.length === 0 && <p>No requests yet.</p>}

      <div className="staff-rows">
        {requests.map((r) => {
          const court = r.answers["Q-COURT-DATE"];
          const unsure = unsureLabels(r);
          const reasons = r.urgent.reasons.map((x) => (x === "date" ? "court date" : "danger reported"));
          return (
            <article key={r.id} className="staff-row" data-testid="staff-row" data-confirmation={r.confirmationNumber ?? ""}>
              <h2>{r.confirmationNumber}</h2>
              <p className="muted">Sent {r.submittedAt ? new Date(r.submittedAt).toLocaleString("en-US") : ""}</p>
              <dl>
                <dt>Urgent</dt>
                <dd data-testid="staff-urgent" data-urgent={String(r.urgent.isUrgent)}>
                  {r.urgent.isUrgent ? `Yes (${reasons.join(", ")})` : "No"}
                </dd>
                <dt>Not sure</dt>
                <dd data-testid="staff-unsure" data-count={unsure.length}>
                  {unsure.length}
                  {unsure.length > 0 && (
                    <ul>
                      {unsure.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  )}
                </dd>
                <dt>Missing documents</dt>
                <dd data-testid="staff-missing">
                  {r.missingDocuments.length ? r.missingDocuments.map((t) => DOCUMENT_RULES_BY_TYPE[t].label).join(", ") : "None"}
                </dd>
                <dt>Court date</dt>
                <dd data-testid="staff-court">
                  {!court ? "Not given" : court.unsure ? COPY.notSure : `${formatAnswer(court)} (${COPY.reported})`}
                </dd>
                <dt>Status</dt>
                <dd>{COPY.confirmation.status}</dd>
              </dl>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        className="secondary"
        onClick={() => {
          clearPrototypeData();
          setRequests([]);
        }}
      >
        Clear prototype data
      </button>
    </section>
  );
}
