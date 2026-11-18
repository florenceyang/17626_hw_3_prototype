import { useEffect, useRef } from "react";
import { OFFICE } from "../config/office";
import { useIntake } from "../state/intakeStore";
import { leaveTo } from "../state/navigation";

// T035: quick exit (FR-003, G-71) and help contact (FR-008, G-147) on every applicant screen.
export function SafetyBar() {
  const { reset } = useIntake();
  const escTimes = useRef<number[]>([]);

  const quickExit = () => {
    reset(); // clear all in-memory answers first
    leaveTo(OFFICE.quickExitUrl);
  };

  const quickExitRef = useRef(quickExit);
  quickExitRef.current = quickExit;

  useEffect(() => {
    // Pressing Escape three times within 2 seconds also exits.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = Date.now();
      escTimes.current = [...escTimes.current.filter((x) => t - x < 2000), t];
      if (escTimes.current.length >= 3) {
        escTimes.current = [];
        quickExitRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="safety-bar">
      <div className="help-contact" data-testid="help-contact">
        <span className="help-label">Need help from a person?</span>{" "}
        <a href={`tel:${OFFICE.helpContact.phone.replace(/[^\d]/g, "")}`}>{OFFICE.helpContact.phone}</a>{" "}
        <span className="help-hours">{OFFICE.helpContact.hours}</span>
      </div>
      <button type="button" className="quick-exit" data-testid="quick-exit" onClick={quickExit}>
        Quick exit
      </button>
    </header>
  );
}
