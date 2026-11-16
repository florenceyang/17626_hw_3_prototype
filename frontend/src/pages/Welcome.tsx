import { COPY } from "../config/copy";
import { navigate } from "../router";
import { useIntake } from "../state/intakeStore";

// T027: FR-001 (no login to start), FR-002 (free, and who sees the information), US1-AS1.
export function Welcome() {
  const { start, state } = useIntake();
  return (
    <section className="welcome">
      <h1>{COPY.welcome.title}</h1>
      <p className="free">{COPY.welcome.free}</p>
      <h2>{COPY.welcome.whoSeesTitle}</h2>
      <p>{COPY.welcome.whoSees}</p>
      <p>{COPY.welcome.howLong}</p>
      <div className="actions stacked">
        <button
          type="button"
          className="primary"
          onClick={() => {
            if (!state.draft) start();
            navigate("form");
          }}
        >
          {state.draft ? "Continue my form" : COPY.welcome.start}
        </button>
        <button type="button" className="link" onClick={() => navigate("account")}>
          {COPY.welcome.checkStatus}
        </button>
      </div>
    </section>
  );
}
