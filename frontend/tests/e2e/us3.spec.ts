import { expect, test, type Page } from "@playwright/test";
import {
  TUESDAY_10AM,
  evictionPlan,
  fillUntilUpload,
  fixTime,
  plusDays,
  resetApp,
  startForm,
} from "./helpers";

// User Story 3 - Upload documents with the form (P2).

const FAR = plusDays(TUESDAY_10AM, 30);

test.beforeEach(async ({ page }) => {
  await fixTime(page, TUESDAY_10AM);
  await resetApp(page);
  await startForm(page);
});

async function upload(page: Page, type: string, readability = "readable") {
  await page.getByTestId(`simulate-${type}`).selectOption(readability);
  await page.getByTestId(`file-${type}`).setInputFiles({
    name: `${type}.jpg`,
    mimeType: "image/jpeg",
    buffer: Buffer.from("fictional test image"),
  });
}

test("US3-AS3 a missing required document is named after the upload step, and Submit stays available", async ({ page }) => {
  await fillUntilUpload(page, evictionPlan(FAR));
  await upload(page, "evictionNotice");
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expect(page.getByTestId("missing-docs")).toContainText("Lease");
  await expect(page.getByTestId("missing-docs")).not.toContainText("Eviction notice");
  await expect(page.getByRole("button", { name: "Send my request" })).toBeEnabled();
  await page.getByRole("button", { name: "Send my request" }).click();
  await expect(page.getByTestId("confirmation-number")).toBeVisible();
});

test("US3-AS4 the confirmation screen lists each document received by type", async ({ page }) => {
  await fillUntilUpload(page, evictionPlan(FAR));
  await upload(page, "evictionNotice");
  await upload(page, "lease");
  await upload(page, "courtPapers", "unreadable");
  await page.getByRole("button", { name: "Continue to review" }).click();
  await page.getByRole("button", { name: "Send my request" }).click();
  const received = page.getByTestId("docs-received");
  await expect(received).toContainText("Eviction notice");
  await expect(received).toContainText("Lease");
  await expect(received).not.toContainText("Court papers"); // unreadable uploads are not "received"
});

test("US3-AS5 Section 8 with recertification issues lists five required documents and optional court papers", async ({ page }) => {
  await fillUntilUpload(page, evictionPlan(FAR, { "Q-SUBSIDY": "voucher", "Q-RECERT": "yes" }));
  for (const t of ["evictionNotice", "lease", "rentHistory", "inspectionNotices", "recertPaperwork"]) {
    await expect(page.getByTestId(`doc-slot-${t}`)).toHaveAttribute("data-required", "true");
  }
  await expect(page.getByTestId("doc-slot-courtPapers")).toHaveAttribute("data-required", "false");
  await expect(page.getByTestId(/^doc-slot-/)).toHaveCount(6);
});

test("US3-AS6 no subsidy, no income, far court date: notice and lease are enough", async ({ page }) => {
  await fillUntilUpload(page, evictionPlan(FAR));
  await upload(page, "evictionNotice");
  await upload(page, "lease");
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expect(page.getByTestId("missing-docs")).toHaveCount(0);
});

test("US3-AS2 an unreadable upload is flagged immediately on the upload step", async ({ page }) => {
  await fillUntilUpload(page, evictionPlan(FAR));
  await upload(page, "lease", "unreadable");
  await expect(page.getByTestId("doc-problem-lease")).toBeVisible();
});

test("R4 stored request records contain only file metadata, never file contents", async ({ page }) => {
  await fillUntilUpload(page, evictionPlan(FAR));
  await upload(page, "lease");
  await page.getByRole("button", { name: "Continue to review" }).click();
  await page.getByRole("button", { name: "Send my request" }).click();
  const raw = await page.evaluate(() => localStorage.getItem("lai.v1.requests") ?? "");
  expect(raw).toContain("lease.jpg");
  expect(raw).not.toContain("fictional test image");
  expect(raw).not.toMatch(/data:image|base64/);
});
