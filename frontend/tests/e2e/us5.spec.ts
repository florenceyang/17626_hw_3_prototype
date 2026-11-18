import { expect, test } from "@playwright/test";
import {
  TUESDAY_10AM,
  answerCurrent,
  evictionPlan,
  fillUntilUpload,
  fixTime,
  plusDays,
  resetApp,
  reviewAndSubmit,
  startForm,
} from "./helpers";

// User Story 5 - Save progress and check status with an account (P3). Accounts are simulated (FR-026).

test.beforeEach(async ({ page }) => {
  await fixTime(page, TUESDAY_10AM);
  await resetApp(page);
});

test("US5-AS1 / FR-019 'Save and finish later' while logged out asks for an account and can be declined", async ({ page }) => {
  await startForm(page);
  await answerCurrent(page, "eviction");
  await answerCurrent(page, "alone");
  await page.getByTestId("save-later").click();
  await expect(page).toHaveURL(/#\/account$/);
  await expect(page.getByRole("heading", { name: "Save your answers" })).toBeVisible();

  await page.getByTestId("decline-account").click();
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q-NOTICE-DATE");
  // answers were kept: going back shows the earlier answer still selected
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("I'm filling this in myself")).toBeChecked();
});

test("US5-AS1 'Check my status' while logged out asks for an account", async ({ page }) => {
  await page.getByRole("button", { name: "Check my status" }).click();
  await expect(page.getByRole("heading", { name: "Log in or create an account" })).toBeVisible();
});

test("US5-AS2 a saved form resumes at the first unanswered question after reload and log in", async ({ page }) => {
  await startForm(page);
  await answerCurrent(page, "eviction");
  await answerCurrent(page, "alone");
  await answerCurrent(page, "2026-11-02");
  await page.getByTestId("save-later").click();
  await page.getByTestId("nickname").fill("tester1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Your answers are saved.")).toBeVisible();

  await page.reload(); // everything in memory is gone
  await page.goto("/#/account");
  await page.getByTestId("nickname").fill("tester1");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByRole("button", { name: "Continue my form" }).click();
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q-COURT-DATE");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByTestId("question").locator("input")).toHaveValue("2026-11-02");
});

test("US5-AS3 after submitting while logged in, the status reads 'Waiting for staff review'", async ({ page }) => {
  await page.goto("/#/account");
  await page.getByTestId("nickname").fill("tester2");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.goto("/#/");
  await startForm(page);
  await fillUntilUpload(page, evictionPlan(plusDays(TUESDAY_10AM, 30)));
  await reviewAndSubmit(page);
  const number = await page.getByTestId("confirmation-number").textContent();
  await page.getByRole("button", { name: "See my status" }).click();
  await expect(page.getByTestId("account-status")).toContainText(`${number}: Waiting for staff review`);
});

test("US5-AS4 / FR-026 account screens are labeled simulated; nickname is the only input", async ({ page }) => {
  await page.goto("/#/account");
  await expect(page.getByTestId("mock-banner")).toBeVisible();
  const inputs = page.locator("main input");
  await expect(inputs).toHaveCount(1);
  await expect(inputs.first()).toHaveAttribute("data-testid", "nickname");
  await expect(page.locator('input[type="password"], input[type="email"], input[type="tel"]')).toHaveCount(0);
  await page.getByTestId("nickname").fill("tester3");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByTestId("mock-banner")).toBeVisible();
});
