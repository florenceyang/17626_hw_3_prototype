import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { QuestionScreen } from "../../src/components/QuestionScreen";
import { QUESTIONS } from "../../src/config/questions";

const q = (id: string) => QUESTIONS.find((x) => x.id === id)!;

function setup(id: string, nextStep = "Next: your court date") {
  const onSubmit = vi.fn();
  render(
    <QuestionScreen question={q(id)} answer={undefined} nextStep={nextStep} onSubmit={onSubmit} onBack={() => {}} />,
  );
  return { onSubmit };
}

describe("QuestionScreen", () => {
  test("US1-AS4 shows exactly one question and a next-step line starting with 'Next:'", () => {
    setup("Q-NOTICE-DATE");
    expect(screen.getAllByTestId("question")).toHaveLength(1);
    expect(screen.getByTestId("next-step").textContent).toMatch(/^Next:/);
  });

  test("US1-AS5 / FR-007 the plain-language explanation comes before the answer controls", () => {
    setup("Q-NOTICE-DATE");
    const explanation = screen.getByTestId("explanation");
    const control = screen.getByLabelText(/date/i);
    expect(explanation.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("US1-AS6 / FR-009 choosing 'I'm not sure' stores unsure: true, value: null and enables Continue", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup("Q-COURT-DATE");
    const cont = screen.getByRole("button", { name: "Continue" });
    expect(cont).toBeDisabled();
    await user.click(screen.getByTestId("unsure"));
    expect(cont).toBeEnabled();
    await user.click(cont);
    expect(onSubmit).toHaveBeenCalledWith({ value: null, unsure: true });
  });

  test("FR-009 every question kind offers 'I'm not sure'", () => {
    for (const question of QUESTIONS) {
      const { unmount } = render(
        <QuestionScreen question={question} answer={undefined} nextStep="Next: x" onSubmit={() => {}} onBack={() => {}} />,
      );
      expect(screen.getByTestId("unsure")).toBeInTheDocument();
      unmount();
    }
  });

  test("FR-009 a yes/no answer is submitted as a boolean", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup("Q-HAS-INCOME", "Next: x");
    await user.click(screen.getByLabelText("Yes"));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onSubmit).toHaveBeenCalledWith({ value: true, unsure: false });
  });

  test("FR-012 a court date before the notice date must be corrected or marked unsure", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <QuestionScreen
        question={q("Q-COURT-DATE")}
        answer={undefined}
        nextStep="Next: a safety question"
        noticeDate="2026-11-20"
        onSubmit={onSubmit}
        onBack={() => {}}
      />,
    );

    await user.type(screen.getByLabelText(/date you have to go to court/i), "2026-11-19");
    expect(screen.getByTestId("date-order-warning")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    await user.clear(screen.getByLabelText(/date you have to go to court/i));
    await user.type(screen.getByLabelText(/date you have to go to court/i), "2026-11-21");
    expect(screen.queryByTestId("date-order-warning")).toBeNull();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });
});
