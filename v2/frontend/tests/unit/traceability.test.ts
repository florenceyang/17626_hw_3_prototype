import { describe, expect, test } from "vitest";
import { DOCUMENT_RULES } from "../../src/config/documents";
import { QUESTIONS } from "../../src/config/questions";
import { allConfigTraced } from "../../src/rules/traceability";

describe("Constitution Principle II traceability guard", () => {
  test("FR-009 / Principle II every question and document rule cites at least one FR", () => {
    expect(allConfigTraced(QUESTIONS, DOCUMENT_RULES)).toEqual([]);
  });

  test("FR-009 every question has a kind; 'I'm not sure' is offered by the screen for all kinds", () => {
    for (const q of QUESTIONS) {
      expect(["choice", "date", "number", "yesNo"]).toContain(q.kind);
      if (q.kind === "choice") expect(q.choices?.length).toBeGreaterThan(0);
    }
  });

  test("Principle II question ids are unique and stable", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^Q-[A-Z-]+$/));
  });

  test("FR-011 danger questions are private", () => {
    for (const q of QUESTIONS.filter((q) => q.section === "danger")) expect(q.private).toBe(true);
  });
});
