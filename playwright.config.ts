import { defineConfig, devices } from "@playwright/test";

const port = 6006;

export default defineConfig({
  testDir: "src",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: { animations: "disabled" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Serves a prebuilt storybook-static; run build-storybook before test:e2e.
  webServer: {
    command: `bunx vite preview --outDir storybook-static --port ${port} --strictPort`,
    url: `http://localhost:${port}/iframe.html`,
    reuseExistingServer: !process.env.CI,
  },
});
