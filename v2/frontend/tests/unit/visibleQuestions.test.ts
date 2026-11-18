import { describe, expect, test } from "vitest";
import { nextStepLabel, visibleQuestions } from "../../src/rules/visibleQuestions";
import { answers } from "./fixtures";

const ids = (qs: { id: string }[]) => qs.map((q) => q.id);
const SECTION_ORDER = ["problem", "helper", "deadline", "danger", "housing", "household", "income"];

describe("visibleQuestions (contracts/rules.md)", () => {
  test("FR-012 / US1-AS7 eviction asks notice date and court date as two separate questions", () => {
    const qs = ids(visibleQuestions("eviction", {}));
    expect(qs).toContain("Q-NOTICE-DATE");
    expect(qs).toContain("Q-COURT-DATE");
    expect(qs.indexOf("Q-NOTICE-DATE")).not.toBe(qs.indexOf("Q-COURT-DATE"));
  });

  test("FR-004 / US1-AS2 'other' excludes eviction-only questions", () => {
    const qs = visibleQuestions("other", {});
    expect(qs.every((q) => q.appliesTo === "all" || q.appliesTo.includes("other"))).toBe(true);
    expect(ids(qs)).not.toContain("Q-NOTICE-DATE");
    expect(ids(qs)).not.toContain("Q-SUBSIDY");
  });

  test("FR-004 / US1-AS2 eviction shows only questions tagged eviction or all", () => {
    const qs = visibleQuestions("eviction", {});
    expect(qs.every((q) => q.appliesTo === "all" || q.appliesTo.includes("eviction"))).toBe(true);
  });

  test("edge: unsure problem type gets only questions for all problem types", () => {
    const qs = visibleQuestions("unsure", {});
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every((q) => q.appliesTo === "all")).toBe(true);
  });

  test("edge: before a problem type is chosen, only general questions are listed", () => {
    expect(visibleQuestions(null, {}).every((q) => q.appliesTo === "all")).toBe(true);
  });

  test("FR-004 the problem-type question comes first", () => {
    for (const t of ["eviction", "other", "unsure"] as const) {
      expect(visibleQuestions(t, {})[0].id).toBe("Q-PROBLEM-TYPE");
    }
  });

  test("FR-005 / US1-AS3 deadline and danger questions come before any household or income question", () => {
    for (const t of ["eviction", "other", "unsure"] as const) {
      const qs = visibleQuestions(t, answers({ "Q-HAS-INCOME": true, "Q-SUBSIDY": "voucher" }));
      const lastUrgent = Math.max(...qs.map((q, i) => (["deadline", "danger"].includes(q.section) ? i : -1)));
      const firstLater = qs.findIndex((q) => ["household", "income"].includes(q.section));
      expect(lastUrgent).toBeGreaterThanOrEqual(0);
      expect(lastUrgent).toBeLessThan(firstLater);
      const order = qs.map((q) => SECTION_ORDER.indexOf(q.section));
      expect([...order].sort((a, b) => a - b)).toEqual(order);
    }
  });

  test("FR-017 recertification question appears only when a subsidy is reported", () => {
    expect(ids(visibleQuestions("eviction", answers({ "Q-SUBSIDY": "none" })))).not.toContain("Q-RECERT");
    expect(ids(visibleQuestions("eviction", answers({ "Q-SUBSIDY": "unsure" })))).not.toContain("Q-RECERT");
    expect(ids(visibleQuestions("eviction", answers({ "Q-SUBSIDY": "voucher" })))).toContain("Q-RECERT");
  });

  test("FR-005 income amount appears only when income is reported", () => {
    expect(ids(visibleQuestions("other", answers({ "Q-HAS-INCOME": false })))).not.toContain("Q-INCOME-AMOUNT");
    expect(ids(visibleQuestions("other", answers({ "Q-HAS-INCOME": true })))).toContain("Q-INCOME-AMOUNT");
  });

  test("FR-006 / US1-AS4 next-step labels start with 'Next:'", () => {
    const qs = visibleQuestions("eviction", {});
    qs.forEach((_, i) => expect(nextStepLabel(qs, i)).toMatch(/^Next: /));
    expect(nextStepLabel(qs, qs.length - 1)).toBe("Next: upload documents");
    expect(nextStepLabel(qs, qs.indexOf(qs.find((q) => q.id === "Q-NOTICE-DATE")!))).toBe("Next: your court date");
  });
});
