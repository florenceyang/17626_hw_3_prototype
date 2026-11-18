import type { OfficeConfig } from "../types";

// R3, R7, FR-008, FR-025. All values are prototype placeholders; the phone number is fictional.
export const OFFICE: OfficeConfig = {
  timeZone: "America/New_York",
  openHour: 9,
  closeHour: 17,
  businessDays: [1, 2, 3, 4, 5],
  helpContact: { phone: "(555) 010-0199", hours: "Mon–Fri 9am–5pm" },
  quickExitUrl: "/neutral.html",
};
