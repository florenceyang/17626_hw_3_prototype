// Plain-language screen text (FR-002, FR-021, FR-026, G-155, G-157, G-323).
// Applicant-facing text must never state or imply an eligibility outcome (FR-022, SC-006).

export const COPY = {
  welcome: {
    title: "Get free legal help",
    free: "This service is free. You will not be asked to pay anything.",
    whoSeesTitle: "Who will see your answers",
    whoSees:
      "Only legal aid staff and lawyers at our office will see your answers. They use them to understand your problem and call you back. We do not share your answers with your landlord or the court.",
    howLong: "Most people finish in about 10 minutes. You can say \"I'm not sure\" to any question.",
    start: "Start",
    checkStatus: "Check my status",
  },
  confirmation: {
    title: "We have your request",
    numberPurpose:
      "This is your confirmation number. Keep it. If you call us, give this number so we can find your request quickly.",
    docsTitle: "Documents we received",
    none: "None",
    statusTitle: "What happens next",
    status: "Waiting for staff review",
    statusExplain: "A person on our staff will read your request. Nothing is decided by a computer.",
  },
  mockBanner: "Simulated for this prototype. Do not enter real information.",
  leaveWarning: "If you leave now, your answers will not be saved.",
  reported: "Reported by applicant, not verified",
  unsure: "I'm not sure",
  notSure: "Not sure",
} as const;

export const CALLBACK = {
  today: "Expect a call today",
  nextBusinessDay: "Expect a call by the end of the next business day",
  twoBusinessDays: "Expect a call within 2 business days",
} as const;
