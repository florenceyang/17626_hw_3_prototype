import { describe, expect, test } from "vitest";
import { CALLBACK } from "../../src/config/copy";
import { OFFICE } from "../../src/config/office";
import { callbackMessage } from "../../src/rules/callback";
import { ny } from "./fixtures";

const URGENT = { isUrgent: true, reasons: ["danger" as const] };
const NOT_URGENT = { isUrgent: false, reasons: [] };

describe("callbackMessage (contracts/rules.md, America/New_York)", () => {
  test("US1-AS10 urgent, Tuesday 10:00 → today", () => {
    expect(callbackMessage(URGENT, ny("2026-11-17T10:00:00"), OFFICE)).toBe(CALLBACK.today);
  });

  test("FR-025 urgent, Tuesday 9:00 (opening is inside hours) → today", () => {
    expect(callbackMessage(URGENT, ny("2026-11-17T09:00:00"), OFFICE)).toBe(CALLBACK.today);
  });

  test("FR-025 edge: urgent, Tuesday 17:00 (closing is after hours) → next business day", () => {
    expect(callbackMessage(URGENT, ny("2026-11-17T17:00:00"), OFFICE)).toBe(CALLBACK.nextBusinessDay);
  });

  test("US1-AS12 urgent, Tuesday 21:00 → next business day", () => {
    expect(callbackMessage(URGENT, ny("2026-11-17T21:00:00"), OFFICE)).toBe(CALLBACK.nextBusinessDay);
  });

  test("US1-AS12 urgent, Saturday 10:00 → next business day", () => {
    expect(callbackMessage(URGENT, ny("2026-11-21T10:00:00"), OFFICE)).toBe(CALLBACK.nextBusinessDay);
  });

  test("FR-025 urgent, Tuesday 8:59 (before opening) → next business day", () => {
    expect(callbackMessage(URGENT, ny("2026-11-17T08:59:00"), OFFICE)).toBe(CALLBACK.nextBusinessDay);
  });

  test("US1-AS9 not urgent, any time → within 2 business days", () => {
    for (const t of ["2026-11-17T10:00:00", "2026-11-17T21:00:00", "2026-11-21T10:00:00"]) {
      expect(callbackMessage(NOT_URGENT, ny(t), OFFICE)).toBe(CALLBACK.twoBusinessDays);
    }
  });
});
