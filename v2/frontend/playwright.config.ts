import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5173);
const baseURL = `http://127.0.0.1:${port}`;

// R2, R10: one phone-sized Chromium project; tests are named by US#-AS# / FR-### IDs.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL,
    viewport: { width: 360, height: 640 },
    hasTouch: true,
    timezoneId: "America/New_York",
  },
  projects: [{ name: "phone-chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
  },
});
