import { defineConfig } from "@playwright/test";

// R2, R10: one phone-sized Chromium project; tests are named by US#-AS# / FR-### IDs.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 360, height: 640 },
    hasTouch: true,
    timezoneId: "America/New_York",
  },
  projects: [{ name: "phone-chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
