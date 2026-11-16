import { describe, expect, test } from "vitest";
import { addSubmitted, createAccount, loadDraft, logIn, saveDraft, statusesFor } from "../../src/state/accounts";
import { makeRequest } from "./fixtures";

describe("mock accounts (R5)", () => {
  test("FR-018 create account accepts a nickname of 1–30 characters", () => {
    expect(createAccount("tester1")).toEqual({ ok: true });
    expect(createAccount("x".repeat(30))).toEqual({ ok: true });
  });

  test("FR-018 create account rejects empty, over-30, and duplicate nicknames", () => {
    expect(createAccount("").ok).toBe(false);
    expect(createAccount("   ").ok).toBe(false);
    expect(createAccount("x".repeat(31)).ok).toBe(false);
    createAccount("tester1");
    expect(createAccount("tester1").ok).toBe(false);
  });

  test("FR-018 log in works only for an existing nickname", () => {
    expect(logIn("nobody").ok).toBe(false);
    createAccount("tester1");
    expect(logIn("tester1").ok).toBe(true);
  });

  test("FR-018 save the draft, then load the draft (at most one draft)", () => {
    createAccount("tester1");
    saveDraft("tester1", makeRequest({ id: "d1" }));
    saveDraft("tester1", makeRequest({ id: "d2" }));
    expect(loadDraft("tester1")?.id).toBe("d2");
    saveDraft("tester1", null);
    expect(loadDraft("tester1")).toBeNull();
  });

  test("FR-020 adding a submitted confirmation number shows 'Waiting for staff review'", () => {
    createAccount("tester1");
    addSubmitted("tester1", "LA-261117-ABCD");
    expect(statusesFor("tester1")).toEqual([{ confirmationNumber: "LA-261117-ABCD", status: "Waiting for staff review" }]);
  });
});
