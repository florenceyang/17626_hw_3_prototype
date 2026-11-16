import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SafetyBar } from "../../src/components/SafetyBar";
import { OFFICE } from "../../src/config/office";
import { IntakeProvider } from "../../src/state/intakeStore";
import { leaveTo } from "../../src/state/navigation";

vi.mock("../../src/state/navigation", () => ({ leaveTo: vi.fn() }));

const renderBar = () =>
  render(
    <IntakeProvider>
      <SafetyBar />
    </IntakeProvider>,
  );

describe("SafetyBar", () => {
  beforeEach(() => vi.mocked(leaveTo).mockClear());

  test("US2-AS1 renders a quick-exit button labeled 'Quick exit'", () => {
    renderBar();
    expect(screen.getByTestId("quick-exit")).toHaveTextContent("Quick exit");
  });

  test("US2-AS3 / FR-008 shows the help contact", () => {
    renderBar();
    const help = screen.getByTestId("help-contact");
    expect(help).toHaveTextContent(OFFICE.helpContact.phone);
    expect(help).toHaveTextContent(OFFICE.helpContact.hours);
  });

  test("FR-003 clicking quick exit leaves for the neutral page in one action", async () => {
    renderBar();
    await userEvent.setup().click(screen.getByTestId("quick-exit"));
    expect(leaveTo).toHaveBeenCalledTimes(1);
    expect(leaveTo).toHaveBeenCalledWith(OFFICE.quickExitUrl);
  });

  test("FR-003 pressing Escape three times also exits", async () => {
    renderBar();
    const user = userEvent.setup();
    await user.keyboard("{Escape}{Escape}");
    expect(leaveTo).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    expect(leaveTo).toHaveBeenCalledWith(OFFICE.quickExitUrl);
  });
});
