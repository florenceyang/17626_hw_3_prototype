import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { TUESDAY_10AM, evictionPlan, fillUntilUpload, fixTime, plusDays, resetApp, startForm } from "./helpers";

// T058 (R10, G-155): no serious or critical accessibility violations on any screen.

async function expectAccessible(page: Page, where: string) {
  const results = await new AxeBuilder({ page }).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${where}: ${v.id} — ${v.help}`)).toEqual([]);
}

test("R10 accessibility scan of every screen", async ({ page }) => {
  await fixTime(page, TUESDAY_10AM);
  await resetApp(page);
  await expectAccessible(page, "welcome");
  await startForm(page);
  await expectAccessible(page, "question");
  await fillUntilUpload(page, evictionPlan(plusDays(TUESDAY_10AM, 30), { "Q-HELPER": "helper" }));
  await expectAccessible(page, "upload");
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expectAccessible(page, "review");
  await page.getByRole("button", { name: "Send my request" }).click();
  await expectAccessible(page, "confirmation");
  await page.goto("/#/account");
  await expectAccessible(page, "account");
  await page.goto("/#/staff");
  await expectAccessible(page, "staff");
});

test("R10 accessibility scan of the private-answers screen", async ({ page }) => {
  await resetApp(page);
  await startForm(page);
  for (const v of ["eviction", "helper"]) {
    await page.getByTestId("question").locator(`input[value="${v}"]`).check();
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByTestId("unsure").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByTestId("unsure").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("private-gate")).toBeVisible();
  await expectAccessible(page, "private gate");
});
