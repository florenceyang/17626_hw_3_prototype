import { expect, test, type Page } from "@playwright/test";
import {
  TUESDAY_10AM,
  answerCurrent,
  evictionPlan,
  fillUntilUpload,
  fixTime,
  goToStep,
  plusDays,
  resetApp,
  startForm,
} from "./helpers";

// User Story 2 - Stay safe and get help while filling in the form (P1).

test.beforeEach(async ({ page }) => {
  await fixTime(page, TUESDAY_10AM);
  await resetApp(page);
});

async function expectSafetyInViewport(page: Page, where: string) {
  for (const id of ["quick-exit", "help-contact"]) {
    const el = page.getByTestId(id);
    await expect(el, `${id} on ${where}`).toBeInViewport();
  }
}

test("US2-AS1 / US2-AS3 / SC-002 quick exit and help contact are visible without scrolling on every applicant screen", async ({ page }) => {
  await expectSafetyInViewport(page, "welcome");
  await startForm(page);
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); // even when scrolled
    await expectSafetyInViewport(page, `step ${i}`);
    if (await page.getByTestId("upload-step").isVisible()) break;
    if (await page.getByTestId("private-gate").isVisible()) {
      await page.getByRole("button", { name: "I'm alone now, continue" }).click();
      continue;
    }
    const id = await page.getByTestId("question").getAttribute("data-question-id");
    const plan = evictionPlan(plusDays(TUESDAY_10AM, 30), { "Q-HELPER": "helper" });
    await answerCurrent(page, plan[id!] ?? 1);
  }
  await expectSafetyInViewport(page, "upload");
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expectSafetyInViewport(page, "review");
  await page.getByRole("button", { name: "Send my request" }).click();
  await expectSafetyInViewport(page, "confirmation");
  await page.goto("/#/account");
  await expectSafetyInViewport(page, "account");
});

test("US2-AS2 / SC-003 quick exit replaces the form, and Back does not show answers", async ({ page }) => {
  await startForm(page);
  await goToStep(page, "Q-COURT-DATE", { "Q-PROBLEM-TYPE": "eviction", "Q-HELPER": "alone", "Q-NOTICE-DATE": "2026-11-02" });
  await page.getByTestId("question").locator("input").fill("2026-11-20");

  const started = Date.now();
  await page.getByTestId("quick-exit").click();
  await page.waitForURL(/\/neutral\.html$/);
  expect(Date.now() - started).toBeLessThan(1000);
  await expect(page.getByRole("heading", { name: "Local weather" })).toBeVisible();

  await page.goBack();
  await page.waitForLoadState();
  await expect(page.getByTestId("question")).toHaveCount(0);
  const text = await page.locator("body").innerText();
  expect(text).not.toContain("2026");
  expect(text).not.toContain("November");
  expect(text).not.toContain("Eviction or housing");
});

test("US2-AS2 quick exit works from the welcome, upload, review and confirmation screens", async ({ page }) => {
  await page.getByTestId("quick-exit").click();
  await page.waitForURL(/\/neutral\.html$/);

  for (const target of ["upload", "review", "confirmation"] as const) {
    await resetApp(page);
    await startForm(page);
    await fillUntilUpload(page, evictionPlan(plusDays(TUESDAY_10AM, 30)));
    if (target !== "upload") await page.getByRole("button", { name: "Continue to review" }).click();
    if (target === "confirmation") await page.getByRole("button", { name: "Send my request" }).click();
    await page.getByTestId("quick-exit").click();
    await page.waitForURL(/\/neutral\.html$/);
    await page.goBack();
    await page.waitForLoadState();
    await expect(page.getByTestId("review-step")).toHaveCount(0);
    await expect(page.getByTestId("confirmation-number")).toHaveCount(0);
  }
});

test("US2-AS4 / FR-010 the applicant can say they are alone or have a helper", async ({ page }) => {
  await startForm(page);
  await answerCurrent(page, "eviction");
  const q = page.getByTestId("question");
  await expect(q).toHaveAttribute("data-question-id", "Q-HELPER");
  await expect(q.getByLabel("I'm filling this in myself")).toBeVisible();
  await expect(q.getByLabel("Someone is helping me")).toBeVisible();
});

test("US2-AS5 with a helper, a private-answers screen appears before the danger questions", async ({ page }) => {
  await startForm(page);
  await goToStep(page, "Q-COURT-DATE", { "Q-PROBLEM-TYPE": "eviction", "Q-HELPER": "helper", "Q-NOTICE-DATE": "2026-11-02" });
  await answerCurrent(page, plusDays(TUESDAY_10AM, 30));
  await expect(page.getByTestId("private-gate")).toBeVisible();
  await expect(page.getByTestId("private-gate")).toContainText("Please answer them on your own");
  await page.getByRole("button", { name: "I'm alone now, continue" }).click();
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q-DANGER-AFRAID");
});

test("US2-AS6 / SC-007 with a helper, danger answers never appear on later screens", async ({ page }) => {
  await startForm(page);
  await fillUntilUpload(page, evictionPlan(plusDays(TUESDAY_10AM, 30), { "Q-HELPER": "helper", "Q-DANGER-AFRAID": "yes", "Q-DANGER-HOME": "unsure" }));
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expect(page.getByTestId("review-step")).toBeVisible();
  await expect(page.getByTestId("review-Q-DANGER-AFRAID")).toHaveCount(0);
  await expect(page.getByTestId("review-Q-DANGER-HOME")).toHaveCount(0);
  const review = await page.locator("body").innerText();
  expect(review).not.toMatch(/afraid|threatening|unsafe/i);
  await page.getByRole("button", { name: "Send my request" }).click();
  await expect(page.getByTestId("confirmation-number")).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(/afraid|threatening|unsafe|danger/i);
});

test("edge: helper path with quick exit does not reveal danger answers", async ({ page }) => {
  await startForm(page);
  await goToStep(page, "Q-DANGER-HOME", {
    "Q-PROBLEM-TYPE": "eviction",
    "Q-HELPER": "helper",
    "Q-NOTICE-DATE": "2026-11-02",
    "Q-COURT-DATE": plusDays(TUESDAY_10AM, 30),
    "Q-DANGER-AFRAID": "yes",
  });
  await page.getByTestId("quick-exit").click();
  await page.waitForURL(/\/neutral\.html$/);
  await page.goBack();
  await page.waitForLoadState();
  expect(await page.locator("body").innerText()).not.toMatch(/afraid|threatening/i);
});
