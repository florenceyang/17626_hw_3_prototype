import { CALLBACK } from "../config/copy";
import { officeDateParts } from "../state/clock";
import type { OfficeConfig, Urgency } from "../types";

// FR-021, FR-025, R7. Opening hour included, closing hour excluded.
export function callbackMessage(urgent: Urgency, submittedAt: Date, office: OfficeConfig): string {
  if (!urgent.isUrgent) return CALLBACK.twoBusinessDays;
  const p = officeDateParts(submittedAt, office.timeZone);
  const inHours = office.businessDays.includes(p.weekday) && p.hour >= office.openHour && p.hour < office.closeHour;
  return inHours ? CALLBACK.today : CALLBACK.nextBusinessDay;
}
