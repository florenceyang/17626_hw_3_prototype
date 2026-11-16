import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { StaffList } from "../../src/pages/StaffList";
import { saveRequest } from "../../src/state/storage";
import { ans, makeRequest } from "../unit/fixtures";

const ELIGIBILITY_WORDS = ["qualify", "eligible", "approved", "denied", "accepted"];

function seed() {
  saveRequest(
    makeRequest({
      id: "a",
      confirmationNumber: "LA-261117-AAAA",
      status: "waitingForStaffReview",
      submittedAt: "2026-11-17T15:00:00.000Z",
      urgent: { isUrgent: true, reasons: ["date", "danger"] },
      missingDocuments: ["lease"],
      answers: {
        "Q-COURT-DATE": ans("Q-COURT-DATE", "2026-11-20", { source: "reported" }),
        "Q-DANGER-AFRAID": ans("Q-DANGER-AFRAID", true, { private: true }),
        "Q-DANGER-HOME": ans("Q-DANGER-HOME", "unsure", { private: true }),
        "Q-HOUSEHOLD-SIZE": ans("Q-HOUSEHOLD-SIZE", "unsure"),
      },
    }),
  );
  saveRequest(
    makeRequest({
      id: "b",
      confirmationNumber: "LA-261117-BBBB",
      status: "waitingForStaffReview",
      submittedAt: "2026-11-17T14:00:00.000Z",
    }),
  );
}

const row = (n: string) => screen.getAllByTestId("staff-row").find((r) => r.dataset.confirmation === n)!;

describe("StaffList (mock)", () => {
  test("US4-AS4 each row shows urgency with reasons, unsure answers, missing documents, and an unverified court date", () => {
    seed();
    render(<StaffList />);
    const a = within(row("LA-261117-AAAA"));
    expect(a.getByTestId("staff-urgent")).toHaveTextContent("Yes (court date, danger reported)");
    expect(a.getByTestId("staff-unsure")).toHaveAttribute("data-count", "2");
    expect(a.getByTestId("staff-unsure")).toHaveTextContent("How many people live in your home");
    expect(a.getByTestId("staff-unsure")).toHaveTextContent("Safety concern: feeling unsafe at home");
    expect(a.getByTestId("staff-missing")).toHaveTextContent("Lease");
    expect(a.getByTestId("staff-court")).toHaveTextContent("November 20, 2026 (Reported by applicant, not verified)");

    const b = within(row("LA-261117-BBBB"));
    expect(b.getByTestId("staff-urgent")).toHaveTextContent("No");
    expect(b.getByTestId("staff-missing")).toHaveTextContent("None");
  });

  test("US4-AS4 rows are newest first", () => {
    seed();
    render(<StaffList />);
    expect(screen.getAllByTestId("staff-row").map((r) => r.dataset.confirmation)).toEqual([
      "LA-261117-AAAA",
      "LA-261117-BBBB",
    ]);
  });

  test("US4-AS5 / FR-026 the list is labeled as a mock and shows no eligibility decision", () => {
    seed();
    render(<StaffList />);
    expect(screen.getByTestId("mock-banner")).toBeInTheDocument();
    const text = document.body.textContent!.toLowerCase();
    for (const w of ELIGIBILITY_WORDS) expect(text).not.toContain(w);
  });

  test("FR-011 private danger answer values and prompts are not rendered", () => {
    seed();
    render(<StaffList />);
    expect(document.body.textContent).not.toMatch(/afraid|threatening/i);
  });

  test("storage: clear prototype data empties the list", async () => {
    seed();
    render(<StaffList />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Clear prototype data" }));
    expect(screen.queryAllByTestId("staff-row")).toHaveLength(0);
    expect(localStorage.getItem("lai.v1.requests")).toBeNull();
  });
});
