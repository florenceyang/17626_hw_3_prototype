import { expect, test, type Page } from "@playwright/test";
import {
  TUESDAY_10AM,
  evictionPlan,
  fillUntilUpload,
  fixTime,
  plusDays,
  resetApp,
  reviewAndSubmit,
  startForm,
  type Plan,
} from "./helpers";

// User Story 4 - Staff see which requests are urgent and what needs follow-up (P2).

async function submit(page: Page, plan: Plan): Promise<string> {
  await page.goto("/#/");
  await startForm(page);
  await fillUntilUpload(page, plan);
  await reviewAndSubmit(page);
  return (await page.getByTestId("confirmation-number").textContent())!;
}

test("US4-AS1 / US4-AS2 / US4-AS3 / FR-023 / SC-004 / SC-009 staff list flags urgency and follow-up items correctly", async ({ page }) => {
  await fixTime(page, TUESDAY_10AM);
  await resetApp(page);

  const in7 = await submit(page, evictionPlan(plusDays(TUESDAY_10AM, 7)));
  const in8 = await submit(page, evictionPlan(plusDays(TUESDAY_10AM, 8)));
  const dangerUnsure = await submit(page, evictionPlan(plusDays(TUESDAY_10AM, 30), { "Q-DANGER-AFRAID": "unsure" }));

  await page.goto("/#/staff");
  await expect(page.getByTestId("mock-banner")).toBeVisible();
  await expect(page.getByTestId("staff-row")).toHaveCount(3);
  const row = (n: string) => page.locator(`[data-testid="staff-row"][data-confirmation="${n}"]`);

  // US4-AS1: court date in 7 days → urgent (date)
  await expect(row(in7).getByTestId("staff-urgent")).toHaveAttribute("data-urgent", "true");
  await expect(row(in7).getByTestId("staff-urgent")).toContainText("court date");
  // US4-AS3: court date in 8 days, no danger → not urgent
  await expect(row(in8).getByTestId("staff-urgent")).toHaveAttribute("data-urgent", "false");
  // US4-AS2: danger "not sure" → urgent (danger)
  await expect(row(dangerUnsure).getByTestId("staff-urgent")).toHaveAttribute("data-urgent", "true");
  await expect(row(dangerUnsure).getByTestId("staff-urgent")).toContainText("danger reported");

  // US4-AS4 / SC-009: unsure count, missing documents, unverified court date
  await expect(row(dangerUnsure).getByTestId("staff-unsure")).toHaveAttribute("data-count", "1");
  await expect(row(dangerUnsure).getByTestId("staff-unsure")).toContainText("Safety concern: someone finding out");
  await expect(row(in8).getByTestId("staff-unsure")).toHaveAttribute("data-count", "0");
  for (const n of [in7, in8, dangerUnsure]) {
    await expect(row(n).getByTestId("staff-missing")).toContainText("Eviction notice");
    await expect(row(n).getByTestId("staff-missing")).toContainText("Lease");
    await expect(row(n).getByTestId("staff-court")).toContainText("Reported by applicant, not verified");
  }
  // Urgent by date also needs deadline paperwork (FR-017).
  await expect(row(in7).getByTestId("staff-missing")).toContainText("deadline");
});

test("US4-AS5 the staff list is labeled a mock, shows no eligibility decision, and has no quick-exit bar", async ({ page }) => {
  await page.goto("/#/staff");
  await expect(page.getByTestId("mock-banner")).toBeVisible();
  await expect(page.getByTestId("quick-exit")).toHaveCount(0);
  const text = (await page.locator("body").innerText()).toLowerCase();
  for (const w of ["qualify", "eligible", "approved", "denied", "accepted"]) expect(text).not.toContain(w);
});
