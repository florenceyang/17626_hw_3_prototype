import { expect, test } from "vitest";
import { newConfirmationNumber } from "../../src/rules/confirmationNumber";
import { ny } from "./fixtures";

test("FR-021 confirmation number has the form LA-YYMMDD-XXXX in office time", () => {
  // 22:00 New York on 17 Nov is already 18 Nov in UTC; the office date must be used.
  expect(newConfirmationNumber(ny("2026-11-17T22:00:00"), [], "America/New_York")).toMatch(/^LA-261117-[A-Z0-9]{4}$/);
});

test("FR-021 confirmation number is unique among existing ones", () => {
  const seq = [0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5];
  let i = 0;
  const random = () => seq[i++ % seq.length];
  const first = newConfirmationNumber(ny("2026-11-17T10:00:00"), [], "America/New_York", () => 0);
  const second = newConfirmationNumber(ny("2026-11-17T10:00:00"), [first], "America/New_York", random);
  expect(second).not.toBe(first);
});
