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
  // A CI runner is all ours: one worker per core.
  workers: process.env.CI ? "100%" : undefined,
  // Each CI shard writes a blob report; the e2e-report job merges them.
  reporter: process.env.CI ? [["github"], ["blob"]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  // Firefox runs only in CI; locally Chromium and WebKit. The spacing-base
  // check runs in Chromium only; leaving it out here, not skipping it at run
  // time, keeps it out of the other projects' shard balancing. The pattern
  // layout check is the same.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      grepInvert: /follow the spacing base|overflows its parent/,
    },
    ...(process.env.CI
      ? [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
            grepInvert: /follow the spacing base|overflows its parent/,
          },
        ]
      : []),
  ],
  // Serves a prebuilt storybook-static; run build-storybook before test:e2e.
  webServer: {
    command: `bunx vite preview --outDir storybook-static --port ${port} --strictPort`,
    url: `http://localhost:${port}/iframe.html`,
    reuseExistingServer: !process.env.CI,
  },
});
