import { expect, test } from "@playwright/test";
import {
  SATURDAY_10AM,
  TUESDAY_10AM,
  TUESDAY_9PM,
  answerCurrent,
  chooseUnsure,
  evictionPlan,
  expectNoEligibilityWords,
  fillUntilUpload,
  fixTime,
  goToStep,
  passPrivateGate,
  plusDays,
  resetApp,
  reviewAndSubmit,
  startForm,
} from "./helpers";

// User Story 1 - Submit a help request without an account (P1).

test.beforeEach(async ({ page }) => {
  await fixTime(page, TUESDAY_10AM);
  await resetApp(page);
});

test("US1-AS1 / FR-002 first screen says the service is free and who sees the information; Start needs no login", async ({ page }) => {
  await expect(page.getByText(/This service is free/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who will see your answers" })).toBeVisible();
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q-PROBLEM-TYPE");
  await expect(page.getByLabel(/nickname/i)).toHaveCount(0);
});

test("US1-AS2 eviction shows only eviction or general questions; 'other' never sees eviction questions", async ({ page }) => {
  await startForm(page);
  const evictionIds = await fillUntilUpload(page, evictionPlan(plusDays(TUESDAY_10AM, 30)));
  expect(evictionIds).toContain("Q-NOTICE-DATE");
  expect(evictionIds).toContain("Q-SUBSIDY");

  await resetApp(page);
  await startForm(page);
  const otherIds = await fillUntilUpload(page, { "Q-PROBLEM-TYPE": "other" });
  expect(otherIds).not.toContain("Q-NOTICE-DATE");
  expect(otherIds).not.toContain("Q-SUBSIDY");
  expect(otherIds).not.toContain("Q-RECERT");
});

test("US1-AS3 deadline and danger questions come before household and income", async ({ page }) => {
  await startForm(page);
  const ids = await fillUntilUpload(page, evictionPlan(plusDays(TUESDAY_10AM, 30)));
  const lastUrgent = Math.max(ids.indexOf("Q-COURT-DATE"), ids.indexOf("Q-DANGER-HOME"));
  expect(lastUrgent).toBeLessThan(ids.indexOf("Q-HOUSEHOLD-SIZE"));
  expect(lastUrgent).toBeLessThan(ids.indexOf("Q-HAS-INCOME"));
});

test("FR-005 a reported danger answer shows an urgent notice before the applicant continues", async ({ page }) => {
  await startForm(page);
  await goToStep(page, "Q-DANGER-AFRAID", {
    "Q-PROBLEM-TYPE": "eviction",
    "Q-HELPER": "alone",
    "Q-NOTICE-DATE": "2026-11-02",
    "Q-COURT-DATE": plusDays(TUESDAY_10AM, 30),
  });

  await answerCurrent(page, "yes");
  await expect(page.getByTestId("safety-urgency-notice")).toContainText("urgent staff review");
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q-DANGER-HOME");
  await answerCurrent(page, "no");
  await expect(page.getByTestId("safety-urgency-notice")).toHaveCount(0);
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q-SUBSIDY");
});

test("US1-AS4 each question screen shows exactly one question and a 'Next:' line", async ({ page }) => {
  await startForm(page);
  for (let i = 0; i < 6; i++) {
    // "Not sure" about a helper counts as a helper being present (K5), so the private screen appears.
    if (await passPrivateGate(page)) continue;
    await expect(page.getByTestId("question")).toHaveCount(1);
    await expect(page.getByTestId("next-step")).toHaveText(/^Next: /);
    await chooseUnsure(page);
  }
});

test("FR-006 conditional follow-up questions each get their own screen and updated next step", async ({ page }) => {
  await startForm(page);
  await goToStep(page, "Q-SUBSIDY", {
    "Q-PROBLEM-TYPE": "eviction",
    "Q-HELPER": "alone",
    "Q-NOTICE-DATE": "2026-11-02",
    "Q-COURT-DATE": plusDays(TUESDAY_10AM, 30),
    "Q-DANGER-AFRAID": "no",
    "Q-DANGER-HOME": "no",
  });
  await expect(page.getByTestId("next-step")).toHaveText("Next: who lives with you");
  await page.getByLabel("Section 8 or another voucher").check();
  await expect(page.getByTestId("next-step")).toHaveText("Next: your recertification");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q-RECERT");
  await answerCurrent(page, "no");
  await answerCurrent(page, 3);
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q-HAS-INCOME");
  await answerCurrent(page, "yes");
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q-INCOME-AMOUNT");
  await expect(page.getByTestId("next-step")).toHaveText("Next: upload documents");
});

test("US1-AS5 a legal term is explained above the answer controls", async ({ page }) => {
  await startForm(page);
  await goToStep(page, "Q-NOTICE-DATE", { "Q-PROBLEM-TYPE": "eviction", "Q-HELPER": "alone" });
  const explanation = page.getByTestId("explanation");
  await expect(explanation).toContainText(/eviction notice/i);
  const explanationBox = await explanation.boundingBox();
  const inputBox = await page.getByTestId("question").locator("input[type=date]").boundingBox();
  expect(explanationBox!.y).toBeLessThan(inputBox!.y);
});

test("US1-AS6 'I'm not sure' is saved with an unsure tag and the applicant can continue", async ({ page }) => {
  await startForm(page);
  await goToStep(page, "Q-COURT-DATE", { "Q-PROBLEM-TYPE": "eviction", "Q-HELPER": "alone", "Q-NOTICE-DATE": "2026-11-02" });
  await chooseUnsure(page);
  await expect(page.getByTestId("question")).not.toHaveAttribute("data-question-id", "Q-COURT-DATE");
  await fillUntilUpload(page, evictionPlan(""));
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expect(page.getByTestId("review-Q-COURT-DATE")).toContainText("Not sure");
});

test("US1-AS7 notice date and court date are asked on two separate screens", async ({ page }) => {
  await startForm(page);
  await goToStep(page, "Q-NOTICE-DATE", { "Q-PROBLEM-TYPE": "eviction", "Q-HELPER": "alone" });
  await answerCurrent(page, "2026-11-02");
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q-COURT-DATE");
});

test("US1-AS8 / FR-013 the unverified court-date label is staff-only", async ({ page }) => {
  await startForm(page);
  await fillUntilUpload(page, evictionPlan(plusDays(TUESDAY_10AM, 20)));
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expect(page.getByTestId("review-Q-COURT-DATE")).not.toContainText("Reported by applicant, not verified");
  await expect(page.getByTestId("review-Q-NOTICE-DATE")).not.toContainText("Reported by applicant, not verified");
  await page.getByRole("button", { name: "Send my request" }).click();
  await page.goto("/#/staff");
  await expect(page.getByTestId("staff-court").first()).toContainText("Reported by applicant, not verified");
});

test("FR-012 a court date before the notice date must be corrected or marked unsure", async ({ page }) => {
  await startForm(page);
  await goToStep(page, "Q-NOTICE-DATE", { "Q-PROBLEM-TYPE": "eviction", "Q-HELPER": "alone" });
  await answerCurrent(page, "2026-11-20");
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q-COURT-DATE");

  const date = page.getByTestId("question").locator('input[type="date"]');
  await date.fill("2026-11-19");
  await expect(page.getByTestId("date-order-warning")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await date.fill("2026-11-21");
  await expect(page.getByTestId("date-order-warning")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
});

test("US1-AS9 / SC-005 non-urgent submission shows confirmation number, 'None' documents, and 2 business days", async ({ page }) => {
  await startForm(page);
  await fillUntilUpload(page, evictionPlan(plusDays(TUESDAY_10AM, 30)));
  await reviewAndSubmit(page);
  await expect(page.getByTestId("confirmation-number")).toHaveText(/^LA-261117-[A-Z0-9]{4}$/);
  await expect(page.getByText(/This is your confirmation number/)).toBeVisible();
  await expect(page.getByTestId("docs-received")).toHaveText("None");
  await expect(page.getByTestId("callback")).toHaveText("Expect a call within 2 business days");
});

test("US1-AS10 / SC-005 urgent request during office hours says 'Expect a call today'", async ({ page }) => {
  await startForm(page);
  await fillUntilUpload(page, evictionPlan(plusDays(TUESDAY_10AM, 3)));
  await reviewAndSubmit(page);
  await expect(page.getByTestId("callback")).toHaveText("Expect a call today");
});

test("US1-AS11 / FR-022 / SC-006 no screen states or implies eligibility; status is 'Waiting for staff review'", async ({ page }) => {
  await expectNoEligibilityWords(page);
  await startForm(page);
  for (let i = 0; i < 30; i++) {
    await expectNoEligibilityWords(page);
    if (await page.getByTestId("upload-step").isVisible()) break;
    if (await page.getByTestId("private-gate").isVisible()) {
      await page.getByRole("button", { name: "I'm alone now, continue" }).click();
      continue;
    }
    await chooseUnsure(page);
  }
  await expectNoEligibilityWords(page);
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expectNoEligibilityWords(page);
  await page.getByRole("button", { name: "Send my request" }).click();
  await expect(page.getByTestId("status")).toHaveText("Waiting for staff review");
  await expectNoEligibilityWords(page);
});

test("US1-AS12 urgent request on Saturday 10:00 says next business day", async ({ page }) => {
  await fixTime(page, SATURDAY_10AM);
  await resetApp(page);
  await startForm(page);
  await fillUntilUpload(page, evictionPlan(plusDays(SATURDAY_10AM, 2)));
  await reviewAndSubmit(page);
  await expect(page.getByTestId("callback")).toHaveText("Expect a call by the end of the next business day");
});

test("US1-AS12 urgent request on Tuesday 21:00 says next business day", async ({ page }) => {
  await fixTime(page, TUESDAY_9PM);
  await resetApp(page);
  await startForm(page);
  await fillUntilUpload(page, evictionPlan(plusDays(TUESDAY_9PM, 30), { "Q-DANGER-AFRAID": "yes" }));
  await reviewAndSubmit(page);
  await expect(page.getByTestId("callback")).toHaveText("Expect a call by the end of the next business day");
});

test("FR-001 no login or account prompt appears anywhere before submitting", async ({ page }) => {
  await startForm(page);
  await fillUntilUpload(page, evictionPlan(plusDays(TUESDAY_10AM, 30)));
  await reviewAndSubmit(page);
  await expect(page).toHaveURL(/#\/confirmation$/);
});

test("R4 an anonymous draft is never written to localStorage", async ({ page }) => {
  await startForm(page);
  await answerCurrent(page, "eviction");
  await answerCurrent(page, "alone");
  await answerCurrent(page, "2026-11-02");
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual([]);
  const sessionKeys = await page.evaluate(() => Object.keys(sessionStorage));
  expect(sessionKeys).toEqual([]);
});

test("edge: leaving the form through its own navigation warns that answers will not be saved", async ({ page }) => {
  await startForm(page);
  await answerCurrent(page, "eviction");
  await page.getByRole("button", { name: "Back" }).click(); // back to problem type
  await page.getByRole("button", { name: "Back" }).click(); // leave the form
  await expect(page.getByTestId("leave-warning")).toContainText("If you leave now, your answers will not be saved.");
  await page.getByRole("button", { name: "Stay" }).click();
  await expect(page.getByTestId("question")).toBeVisible();
});
