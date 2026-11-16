import { describe, expect, test } from "vitest";
import {
  ACCOUNTS_KEY,
  REQUESTS_KEY,
  clearPrototypeData,
  loadAccounts,
  loadRequests,
  saveAccounts,
  saveRequest,
} from "../../src/state/storage";
import { makeRequest } from "./fixtures";

describe("contracts/storage.md", () => {
  test("storage: saveRequest appends and replaces by id under lai.v1.requests", () => {
    const a = makeRequest({ id: "a" });
    const b = makeRequest({ id: "b" });
    saveRequest(a);
    saveRequest(b);
    saveRequest({ ...a, confirmationNumber: "LA-261117-ZZZZ" });
    const stored = loadRequests();
    expect(stored.map((r) => r.id).sort()).toEqual(["a", "b"]);
    expect(stored.find((r) => r.id === "a")?.confirmationNumber).toBe("LA-261117-ZZZZ");
    expect(localStorage.getItem(REQUESTS_KEY)).not.toBeNull();
  });

  test("storage: corrupt JSON is treated as empty and never throws", () => {
    localStorage.setItem(REQUESTS_KEY, "{not json");
    localStorage.setItem(ACCOUNTS_KEY, "[1,2");
    expect(loadRequests()).toEqual([]);
    expect(loadAccounts()).toEqual({});
  });

  test("storage: wrong shapes are treated as empty", () => {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify({ a: 1 }));
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([1]));
    expect(loadRequests()).toEqual([]);
    expect(loadAccounts()).toEqual({});
  });

  test("storage: clearPrototypeData removes both keys", () => {
    saveRequest(makeRequest({ id: "a" }));
    saveAccounts({ x: { nickname: "x", draft: null, submittedConfirmationNumbers: [] } });
    clearPrototypeData();
    expect(localStorage.getItem(REQUESTS_KEY)).toBeNull();
    expect(localStorage.getItem(ACCOUNTS_KEY)).toBeNull();
  });
});
