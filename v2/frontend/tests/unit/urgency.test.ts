import { describe, expect, test } from "vitest";
import { OFFICE } from "../../src/config/office";
import { computeUrgency } from "../../src/rules/urgency";
import { answers, ny } from "./fixtures";

// Submission: Tuesday 17 November 2026, 10:00 New York.
const SUBMITTED = ny("2026-11-17T10:00:00");
const court = (iso: string | "unsure", danger: boolean | "unsure" = false) =>
  computeUrgency(
    answers({ "Q-COURT-DATE": iso, "Q-DANGER-AFRAID": danger, "Q-DANGER-HOME": false }),
    SUBMITTED,
    OFFICE,
  );

describe("computeUrgency (contracts/rules.md)", () => {
  test("FR-014 edge: court date exactly 7 days away is urgent (inclusive)", () => {
    expect(court("2026-11-24")).toEqual({ isUrgent: true, reasons: ["date"] });
  });

  test("FR-014 / US4-AS3 court date 8 days away with no danger is not urgent", () => {
    expect(court("2026-11-25")).toEqual({ isUrgent: false, reasons: [] });
  });

  test("FR-014 edge: court date in the past is urgent", () => {
    expect(court("2026-11-14")).toEqual({ isUrgent: true, reasons: ["date"] });
  });

  test("FR-014 edge: court date 'not sure' with no date is not urgent by date", () => {
    expect(court("unsure")).toEqual({ isUrgent: false, reasons: [] });
  });

  test("FR-014 / US4-AS2 danger reported is urgent", () => {
    expect(court("2026-12-17", true)).toEqual({ isUrgent: true, reasons: ["danger"] });
  });

  test("FR-024 danger answered 'not sure' counts as danger reported", () => {
    expect(court("2026-12-17", "unsure")).toEqual({ isUrgent: true, reasons: ["danger"] });
  });

  test("FR-014 court date 2 days away and danger reported records both reasons", () => {
    expect(court("2026-11-19", true)).toEqual({ isUrgent: true, reasons: ["date", "danger"] });
  });

  test("FR-014 the date is compared in the office time zone, not UTC", () => {
    // 23:30 Monday 23 Nov in New York is already Tuesday 24 Nov in UTC.
    const lateMonday = ny("2026-11-23T23:30:00");
    const r = computeUrgency(answers({ "Q-COURT-DATE": "2026-12-01" }), lateMonday, OFFICE);
    expect(r.isUrgent).toBe(false); // 8 days from Mon 23 Nov
    const r2 = computeUrgency(answers({ "Q-COURT-DATE": "2026-11-30" }), lateMonday, OFFICE);
    expect(r2.isUrgent).toBe(true); // 7 days
  });

  test("FR-014 no answers at all is not urgent", () => {
    expect(computeUrgency({}, SUBMITTED, OFFICE)).toEqual({ isUrgent: false, reasons: [] });
  });
});
