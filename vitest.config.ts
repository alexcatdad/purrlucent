import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Story tests start Playwright browsers, which run in CI only.
if (!process.env.CI)
  throw new Error(
    "Story tests run in CI only. Push the branch and read the unit job.",
  );

export default defineConfig({
  // Pre-bundle Lit modules that stories import lazily; otherwise Vite discovers
  // them mid-run and reloads, which breaks every browser test file.
  optimizeDeps: {
    include: ["lit/directives/if-defined.js"],
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: `${import.meta.dirname}/.storybook`,
            storybookScript: "bun run storybook --ci",
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            // Reduced motion makes the token durations zero. The accessibility
            // check reads colors right after a story plays, so no popup may
            // be caught in the middle of its fade.
            provider: playwright({
              contextOptions: { reducedMotion: "reduce" },
            }),
            // Firefox runs in CI only: Playwright's Firefox cannot launch on the maintainer's macOS 27 machine.
            instances: [
              { browser: "chromium" },
              ...(process.env.CI ? [{ browser: "firefox" as const }] : []),
              { browser: "webkit" },
            ],
          },
        },
      },
    ],
  },
});
