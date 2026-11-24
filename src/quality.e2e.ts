import { readFileSync } from "node:fs";
import { test as base, expect, type Page } from "@playwright/test";
import { ignoresSpacing, lowContrastText } from "../e2e/helpers/rendered.ts";
import { gotoStory, switchStory } from "../e2e/helpers/story.ts";

// Checks that apply to every story, so a new component is covered without
// writing them again. The story list comes from the built Storybook. CI runs
// them in their own jobs (tag @quality), apart from the component tests.
const index = JSON.parse(
  readFileSync("storybook-static/index.json", "utf8"),
) as { entries: Record<string, { id: string; type: string }> };
const stories = Object.values(index.entries)
  .filter((entry) => entry.type === "story")
  .map((entry) => entry.id);

// The checks only read the page, so one page per worker switches from story
// to story in place instead of loading the preview for every test.
const test = base.extend<object, { shared: Page }>({
  shared: [
    async ({ browser }, use, workerInfo) => {
      const context = await browser.newContext({
        baseURL: workerInfo.project.use.baseURL,
        // Resting state only: no transition may be caught halfway.
        reducedMotion: "reduce",
      });
      await use(await context.newPage());
      await context.close();
    },
    { scope: "worker" },
  ],
});

// Stories that leave the page in a state an in-place switch does not reset
// (a scroll position settled on load), so they load fresh.
const freshLoad = new Set(["components-message-scroller--last-anchor"]);

const settle = (page: Page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const frame = () => new Promise(requestAnimationFrame);
    await frame();
    await frame();
  });

const show = async (page: Page, id: string) => {
  await (freshLoad.has(id) ? gotoStory(page, id) : switchStory(page, id));
  await settle(page);
};

// The theme global stays "system", so the emulated color scheme picks the
// theme, and one render is measured in both.
for (const id of stories)
  test(
    `text in ${id} holds its contrast in light and dark, measured from pixels`,
    {
      tag: "@quality",
    },
    async ({ shared: page }) => {
      await page.emulateMedia({
        colorScheme: "light",
        reducedMotion: "reduce",
      });
      await show(page, id);
      for (const theme of ["light", "dark"] as const) {
        await page.emulateMedia({
          colorScheme: theme,
          reducedMotion: "reduce",
        });
        await settle(page);
        expect.soft(await lowContrastText(page), theme).toEqual([]);
      }
    },
  );

// It checks how the CSS derives sizes from the spacing token, which does not
// depend on the engine, so one browser is enough: playwright.config.ts leaves
// these out of the other projects.
for (const id of stories)
  test(
    `components in ${id} follow the spacing base`,
    {
      tag: "@quality",
    },
    async ({ shared: page }) => {
      await page.emulateMedia({
        colorScheme: "light",
        reducedMotion: "reduce",
      });
      await show(page, id);
      expect(await ignoresSpacing(page)).toEqual([]);
    },
  );
