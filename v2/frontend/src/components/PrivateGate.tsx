// T038: FR-011, K5 (safety over helper convenience), US2-AS5.
export function PrivateGate({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return (
    <section className="private-gate" data-testid="private-gate">
      <h1>The next questions are private</h1>
      <p>The next questions are private. Please answer them on your own.</p>
      <p>If someone is with you, ask them to step away for a moment. Your answers will not be shown again on this form.</p>
      <p className="next-step" data-testid="next-step">
        Next: private questions
      </p>
      <div className="actions">
        <button type="button" className="secondary" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary" onClick={onContinue}>
          I'm alone now, continue
        </button>
      </div>
    </section>
  );
}
