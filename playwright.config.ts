import { defineConfig, devices } from "@playwright/test";

// PURR_PORT lets several checkouts run their browser tests at the same time.
const port = Number(process.env.PURR_PORT ?? 6006);

// Browser tests start Playwright, which runs in CI only.
if (!process.env.CI)
  throw new Error(
    "Browser tests run in CI only. Push the branch and read the e2e job.",
  );

export default defineConfig({
  globalSetup: "./e2e/helpers/fresh-storybook.ts",
  testDir: "src",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The JSON report feeds the per-job time summary (scripts/e2e-timing.ts).
  reporter: process.env.CI
    ? [
        ["github"],
        ["html", { open: "never" }],
        ["json", { outputFile: "e2e-report.json" }],
      ]
    : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: { animations: "disabled" },
  },
  // Firefox runs only in CI; locally Chromium and WebKit.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    ...(process.env.CI
      ? [{ name: "firefox", use: { ...devices["Desktop Firefox"] } }]
      : []),
  ],
  // Serves a prebuilt storybook-static; run build-storybook before test:e2e.
  webServer: {
    command: `bunx vite preview --outDir storybook-static --port ${port} --strictPort`,
    url: `http://localhost:${port}/iframe.html`,
    reuseExistingServer: !process.env.CI,
  },
});
