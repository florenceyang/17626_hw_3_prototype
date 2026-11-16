import { COPY } from "../config/copy";
import type { HelpRequest } from "../types";
import { loadAccounts, saveAccounts } from "./storage";

// Simulated, nickname-only accounts (FR-018, FR-020, R5). No password, email, or phone.
// Open issues K13 and K14 may change this design.

export type Result = { ok: true } | { ok: false; error: string };

export function validateNickname(raw: string): Result {
  const nickname = raw.trim();
  if (nickname.length < 1) return { ok: false, error: "Please type a nickname." };
  if (nickname.length > 30) return { ok: false, error: "Please use 30 characters or fewer." };
  return { ok: true };
}

export function createAccount(raw: string): Result {
  const valid = validateNickname(raw);
  if (!valid.ok) return valid;
  const nickname = raw.trim();
  const accounts = loadAccounts();
  if (accounts[nickname]) return { ok: false, error: "That nickname is already used in this browser. Try another." };
  accounts[nickname] = { nickname, draft: null, submittedConfirmationNumbers: [] };
  saveAccounts(accounts);
  return { ok: true };
}

export function logIn(raw: string): Result {
  const nickname = raw.trim();
  if (!loadAccounts()[nickname]) return { ok: false, error: "We could not find that nickname in this browser." };
  return { ok: true };
}

export function saveDraft(nickname: string, draft: HelpRequest | null): void {
  const accounts = loadAccounts();
  const account = accounts[nickname];
  if (!account) return;
  account.draft = draft ? { ...draft, ownerNickname: nickname } : null;
  saveAccounts(accounts);
}

export function loadDraft(nickname: string): HelpRequest | null {
  return loadAccounts()[nickname]?.draft ?? null;
}

export function addSubmitted(nickname: string, confirmationNumber: string): void {
  const accounts = loadAccounts();
  const account = accounts[nickname];
  if (!account) return;
  if (!account.submittedConfirmationNumbers.includes(confirmationNumber)) {
    account.submittedConfirmationNumbers.push(confirmationNumber);
  }
  saveAccounts(accounts);
}

export function statusesFor(nickname: string): { confirmationNumber: string; status: string }[] {
  const account = loadAccounts()[nickname];
  return (account?.submittedConfirmationNumbers ?? []).map((confirmationNumber) => ({
    confirmationNumber,
    status: COPY.confirmation.status,
  }));
}
