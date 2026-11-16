import { describe, expect, test } from "vitest";
import { applicableDocuments, missingDocuments, requiredDocuments } from "../../src/rules/documents";
import type { DocumentType, Readability, UploadedDocument, Urgency } from "../../src/types";
import { answers } from "./fixtures";

const NOT_URGENT: Urgency = { isUrgent: false, reasons: [] };
const URGENT_DATE: Urgency = { isUrgent: true, reasons: ["date"] };
const types = (rules: { type: DocumentType }[]) => rules.map((r) => r.type).sort();
const doc = (type: DocumentType, readability: Readability = "readable"): UploadedDocument => ({
  type,
  fileName: `${type}.jpg`,
  mimeType: "image/jpeg",
  sizeBytes: 1000,
  readability,
});
const optional = (problemType: "eviction" | "other", a: ReturnType<typeof answers>, u: Urgency) =>
  applicableDocuments(problemType, a, u)
    .filter((d) => !d.required)
    .map((d) => d.rule.type)
    .sort();

describe("requiredDocuments / missingDocuments (contracts/rules.md)", () => {
  test("US3-AS5 eviction + Section 8 + recertification issues + no income + not urgent", () => {
    const a = answers({ "Q-SUBSIDY": "voucher", "Q-RECERT": true, "Q-HAS-INCOME": false });
    expect(types(requiredDocuments("eviction", a, NOT_URGENT))).toEqual(
      ["evictionNotice", "inspectionNotices", "lease", "recertPaperwork", "rentHistory"].sort(),
    );
    expect(optional("eviction", a, NOT_URGENT)).toEqual(["courtPapers"]);
  });

  test("US3-AS6 eviction, no subsidy, no income, court date far away: notice and lease only", () => {
    const a = answers({ "Q-SUBSIDY": "none", "Q-HAS-INCOME": false });
    const required = requiredDocuments("eviction", a, NOT_URGENT);
    expect(types(required)).toEqual(["evictionNotice", "lease"]);
    expect(optional("eviction", a, NOT_URGENT)).toEqual(["courtPapers"]);
    expect(missingDocuments(required, [doc("evictionNotice"), doc("lease")])).toEqual([]);
  });

  test("edge: subsidy unsure makes subsidy documents optional, not required", () => {
    const a = answers({ "Q-SUBSIDY": "unsure", "Q-HAS-INCOME": false });
    expect(types(requiredDocuments("eviction", a, NOT_URGENT))).toEqual(["evictionNotice", "lease"]);
    expect(optional("eviction", a, NOT_URGENT)).toEqual(
      ["courtPapers", "inspectionNotices", "recertPaperwork", "rentHistory"].sort(),
    );
  });

  test("FR-017 other problem, income reported, urgent by date", () => {
    const a = answers({ "Q-HAS-INCOME": true });
    expect(types(requiredDocuments("other", a, URGENT_DATE))).toEqual(
      ["deadlinePaperwork", "incomeProof", "problemNotice"].sort(),
    );
  });

  test("FR-017 eviction urgent by date: court papers satisfy the deadline-paperwork requirement", () => {
    const a = answers({ "Q-SUBSIDY": "none", "Q-HAS-INCOME": false });
    const required = requiredDocuments("eviction", a, URGENT_DATE);
    expect(types(required)).toContain("deadlinePaperwork");
    expect(missingDocuments(required, [doc("evictionNotice"), doc("lease"), doc("courtPapers")])).toEqual([]);
    expect(missingDocuments(required, [doc("evictionNotice"), doc("lease")])).toEqual(["deadlinePaperwork"]);
  });

  test("FR-017 for eviction the eviction notice stands in for the general problem notice", () => {
    const a = answers({ "Q-SUBSIDY": "none" });
    expect(types(requiredDocuments("eviction", a, NOT_URGENT))).not.toContain("problemNotice");
  });

  test("FR-017 voucher vs public housing vs other subsidy", () => {
    expect(types(requiredDocuments("eviction", answers({ "Q-SUBSIDY": "publicHousing" }), NOT_URGENT))).toContain(
      "rentHistory",
    );
    const other = types(requiredDocuments("eviction", answers({ "Q-SUBSIDY": "otherSubsidy" }), NOT_URGENT));
    expect(other).toContain("inspectionNotices");
    expect(other).not.toContain("rentHistory");
  });

  test("FR-016 / FR-017 only readable uploads count toward required documents", () => {
    const required = requiredDocuments("eviction", answers({ "Q-SUBSIDY": "none" }), NOT_URGENT);
    expect(missingDocuments(required, [doc("evictionNotice", "unreadable"), doc("lease", "wrongPage")])).toEqual([
      "evictionNotice",
      "lease",
    ]);
  });

  test("FR-017 'never' rules (court papers) are never reported missing", () => {
    const all = applicableDocuments("eviction", answers({ "Q-SUBSIDY": "none" }), NOT_URGENT).map((d) => d.rule);
    expect(missingDocuments(all, [])).not.toContain("courtPapers");
  });

  test("FR-017 income answered 'not sure' lists proof of income as optional", () => {
    const a = answers({ "Q-HAS-INCOME": "unsure" });
    expect(types(requiredDocuments("other", a, NOT_URGENT))).toEqual(["problemNotice"]);
    expect(optional("other", a, NOT_URGENT)).toEqual(["incomeProof"]);
  });
});
