import { expect, type Page } from "@playwright/test";

// T015 (R2, SC-006). Fictional data only.

export const ELIGIBILITY_WORDS = ["qualify", "eligible", "approved", "denied", "accepted"];

/** Tuesday 17 November 2026, 10:00 New York time: inside office hours. */
export const TUESDAY_10AM = "2026-11-17T10:00:00";
export const TUESDAY_9PM = "2026-11-17T21:00:00";
export const SATURDAY_10AM = "2026-11-21T10:00:00";

/** Fix the browser clock to a New York wall-clock time (EST, UTC-5 in November 2026). */
export async function fixTime(page: Page, isoInNewYork: string): Promise<void> {
  await page.clock.setFixedTime(new Date(`${isoInNewYork}-05:00`));
}

/** YYYY-MM-DD for `days` after the date part of a New York ISO time. */
export function plusDays(isoInNewYork: string, days: number): string {
  const [y, m, d] = isoInNewYork.slice(0, 10).split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

export async function resetApp(page: Page): Promise<void> {
  await page.goto("/#/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/#/");
  await page.reload();
}

export async function startForm(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByTestId("question")).toBeVisible();
}

export async function currentQuestionId(page: Page): Promise<string | null> {
  const q = page.getByTestId("question");
  if ((await q.count()) === 0) return null;
  return q.getAttribute("data-question-id");
}

/**
 * Answer the visible question and press Continue.
 * Choice and yes/no values are the option values ("eviction", "helper", "yes", "no", "voucher" …).
 */
export async function answerCurrent(page: Page, value: string | number): Promise<void> {
  const q = page.getByTestId("question");
  const kind = await q.getAttribute("data-kind");
  if (kind === "choice" || kind === "yesNo") {
    await q.locator(`input[type="radio"][value="${value}"]`).check();
  } else {
    await q.locator("input").first().fill(String(value));
  }
  await page.getByRole("button", { name: "Continue" }).click();
}

export async function chooseUnsure(page: Page): Promise<void> {
  await page.getByTestId("unsure").click();
  await page.getByRole("button", { name: "Continue" }).click();
}

/** Passes the private-answers screen if it is showing. */
export async function passPrivateGate(page: Page): Promise<boolean> {
  const gate = page.getByTestId("private-gate");
  if (await gate.isVisible()) {
    await page.getByRole("button", { name: "I'm alone now, continue" }).click();
    return true;
  }
  return false;
}

export type Plan = Record<string, string | number>; // value, or "unsure"

/**
 * Answer questions in order using `plan` (question id → value or "unsure") until the upload step.
 * Questions missing from `plan` are answered "unsure".
 */
export async function fillUntilUpload(page: Page, plan: Plan): Promise<string[]> {
  const seen: string[] = [];
  for (let i = 0; i < 30; i++) {
    if (await page.getByTestId("upload-step").isVisible()) return seen;
    if (await passPrivateGate(page)) continue;
    const id = await currentQuestionId(page);
    if (!id) throw new Error("No question, gate, or upload step visible");
    seen.push(id);
    const v = plan[id] ?? "unsure";
    if (v === "unsure") await chooseUnsure(page);
    else await answerCurrent(page, v);
  }
  throw new Error("Form did not reach the upload step");
}

/** Advance until the given question is showing, answering earlier ones from `plan`. */
export async function goToStep(page: Page, questionId: string, plan: Plan = {}): Promise<void> {
  for (let i = 0; i < 30; i++) {
    if (await passPrivateGate(page)) continue;
    const id = await currentQuestionId(page);
    if (id === questionId) return;
    if (!id) throw new Error(`Did not reach ${questionId}`);
    const v = plan[id] ?? "unsure";
    if (v === "unsure") await chooseUnsure(page);
    else await answerCurrent(page, v);
  }
  throw new Error(`Did not reach ${questionId}`);
}

/** From the upload step: continue to review, then submit. */
export async function reviewAndSubmit(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Continue to review" }).click();
  await page.getByRole("button", { name: "Send my request" }).click();
  await expect(page.getByTestId("confirmation-number")).toBeVisible();
}

export function evictionPlan(courtDate: string, extra: Plan = {}): Plan {
  return {
    "Q-PROBLEM-TYPE": "eviction",
    "Q-HELPER": "alone",
    "Q-NOTICE-DATE": "2026-11-02",
    "Q-COURT-DATE": courtDate,
    "Q-DANGER-AFRAID": "no",
    "Q-DANGER-HOME": "no",
    "Q-SUBSIDY": "none",
    "Q-HOUSEHOLD-SIZE": 3,
    "Q-HAS-INCOME": "no",
    ...extra,
  };
}

export async function expectNoEligibilityWords(page: Page): Promise<void> {
  const text = (await page.locator("body").innerText()).toLowerCase();
  for (const word of ELIGIBILITY_WORDS) expect(text, `found "${word}"`).not.toContain(word);
}
