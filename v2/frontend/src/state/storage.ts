import type { HelpRequest, MockAccount } from "../types";

// contracts/storage.md (R4). Browser storage only; nothing is sent over the network.
export const REQUESTS_KEY = "lai.v1.requests";
export const ACCOUNTS_KEY = "lai.v1.accounts";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota): the prototype keeps working without it.
  }
}

export function loadRequests(): HelpRequest[] {
  const value = read<unknown>(REQUESTS_KEY, []);
  return Array.isArray(value) ? (value as HelpRequest[]) : [];
}

export function saveRequest(request: HelpRequest): void {
  const others = loadRequests().filter((r) => r.id !== request.id);
  write(REQUESTS_KEY, [...others, request]);
}

export function loadAccounts(): Record<string, MockAccount> {
  const value = read<unknown>(ACCOUNTS_KEY, {});
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, MockAccount>)
    : {};
}

export function saveAccounts(accounts: Record<string, MockAccount>): void {
  write(ACCOUNTS_KEY, accounts);
}

export function clearPrototypeData(): void {
  try {
    localStorage.removeItem(REQUESTS_KEY);
    localStorage.removeItem(ACCOUNTS_KEY);
  } catch {
    // ignore
  }
}
