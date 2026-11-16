import { officeDateParts } from "../state/clock";

// FR-021: LA-YYMMDD-XXXX, unique among stored requests.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newConfirmationNumber(date: Date, existing: string[], timeZone: string, random = Math.random): string {
  const p = officeDateParts(date, timeZone);
  const ymd = `${String(p.year % 100).padStart(2, "0")}${String(p.month).padStart(2, "0")}${String(p.day).padStart(2, "0")}`;
  const taken = new Set(existing);
  for (;;) {
    let suffix = "";
    for (let i = 0; i < 4; i++) suffix += ALPHABET[Math.floor(random() * ALPHABET.length)];
    const candidate = `LA-${ymd}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}
