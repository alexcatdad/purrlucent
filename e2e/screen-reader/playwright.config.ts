import { fileURLToPath } from "node:url";
import { devices } from "@playwright/test";
import { withGuidepup } from "@guidepup/playwright";

// Real screen readers take over the machine's audio and keyboard: CI runners only.
if (!process.env.CI) {
  throw new Error("Screen reader tests run only in CI (CI=true).");
}

const port = 6006;

// VoiceOver on macOS pairs with WebKit; NVDA on Windows pairs with Chromium.
export default withGuidepup({
  testDir: ".",
  testMatch: "**/*.sr.ts",
  timeout: 5 * 60 * 1000,
  retries: 2,
  reportSlowTests: null,
  forbidOnly: true,
  reporter: [["github"], ["list"]],
  use: { baseURL: `http://localhost:${port}` },
  projects: [
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Serves a prebuilt storybook-static; run build-storybook first.
  webServer: {
    command: `bunx vite preview --outDir storybook-static --port ${port} --strictPort`,
    url: `http://localhost:${port}/iframe.html`,
    // Defaults to this config's directory; storybook-static and vite.config.ts live at the repo root.
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
  },
});
