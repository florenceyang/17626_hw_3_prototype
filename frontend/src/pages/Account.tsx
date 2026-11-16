import { useState } from "react";
import { MockBanner } from "../components/MockBanner";
import { navigate } from "../router";
import { createAccount, logIn, statusesFor } from "../state/accounts";
import { useIntake } from "../state/intakeStore";

// T055: simulated account (FR-018–FR-020, FR-026, R5). Nickname only: no password, email, or phone.
// Open issues K13 and K14 are unresolved; the applicant can always decline (FR-019).
export function Account() {
  const intake = useIntake();
  const { draft, loggedInNickname, pendingSave } = intake.state;
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const finish = (result: { ok: boolean; error?: string }) => {
    if (!result.ok) return setError(result.error ?? "Something went wrong.");
    setError(null);
    setJustSaved(Boolean(draft && pendingSave));
    intake.completeLogin(nickname.trim());
  };

  if (!loggedInNickname) {
    return (
      <section className="account">
        <MockBanner />
        <h1>{pendingSave ? "Save your answers" : "Log in or create an account"}</h1>
        <p>
          To save your answers and finish later, or to check your status, log in or create an account. You do not need
          an account to send a request.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            finish(logIn(nickname));
          }}
        >
          <label htmlFor="nickname">Nickname</label>
          <input
            id="nickname"
            className="text-input"
            data-testid="nickname"
            value={nickname}
            maxLength={30}
            autoComplete="off"
            onChange={(e) => setNickname(e.target.value)}
          />
          {error && (
            <p className="notice warn" role="alert">
              {error}
            </p>
          )}
          <div className="actions stacked">
            <button type="button" className="primary" onClick={() => finish(createAccount(nickname))}>
              Create account
            </button>
            <button type="submit" className="secondary">
              Log in
            </button>
          </div>
        </form>
        <button
          type="button"
          className="link"
          data-testid="decline-account"
          onClick={() => {
            intake.cancelPendingSave();
            navigate(draft ? "form" : "welcome");
          }}
        >
          {draft ? "Continue without saving" : "Back to the start"}
        </button>
      </section>
    );
  }

  const statuses = statusesFor(loggedInNickname);
  return (
    <section className="account">
      <MockBanner />
      <h1>Hello, {loggedInNickname}</h1>
      {justSaved && (
        <p className="notice ok" role="status">
          Your answers are saved. You can come back and finish later.
        </p>
      )}
      {draft && (
        <button type="button" className="primary" onClick={() => navigate("form")}>
          Continue my form
        </button>
      )}
      <h2>My requests</h2>
      {statuses.length === 0 ? (
        <p>You have not sent a request yet.</p>
      ) : (
        <ul data-testid="account-status">
          {statuses.map((s) => (
            <li key={s.confirmationNumber}>
              {s.confirmationNumber}: {s.status}
            </li>
          ))}
        </ul>
      )}
      <div className="actions stacked">
        {!draft && (
          <button type="button" className="secondary" onClick={() => navigate("welcome")}>
            Go to the start
          </button>
        )}
        <button type="button" className="link" onClick={intake.logout}>
          Log out
        </button>
      </div>
    </section>
  );
}
