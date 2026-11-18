import type { ReactNode } from "react";
import { SafetyBar } from "./SafetyBar";

// T011/T036: phone-first shell. Applicant routes always show the SafetyBar (FR-003, FR-008).
export function Layout({ children, applicant }: { children: ReactNode; applicant: boolean }) {
  return (
    <div className={applicant ? "app applicant" : "app staff"}>
      {applicant && <SafetyBar />}
      <main className="page">{children}</main>
    </div>
  );
}
