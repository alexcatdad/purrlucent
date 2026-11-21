import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { ignoresSpacing, lowContrastText } from "../e2e/helpers/rendered.ts";
import { gotoStory } from "../e2e/helpers/story.ts";

// Checks that apply to every story, so a new component is covered without
// writing them again. The story list comes from the built Storybook.
const index = JSON.parse(
  readFileSync("storybook-static/index.json", "utf8"),
) as { entries: Record<string, { id: string; type: string }> };
const stories = Object.values(index.entries)
  .filter((entry) => entry.type === "story")
  .map((entry) => entry.id);

// Resting state only: no transition may be caught halfway.
test.use({ reducedMotion: "reduce" });

for (const id of stories)
  for (const theme of ["light", "dark"] as const)
    test(`text in ${id} holds its contrast in ${theme}, measured from pixels`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await gotoStory(page, id, `theme:${theme}`);
      await page.evaluate(() => document.fonts.ready);
      expect(await lowContrastText(page)).toEqual([]);
    });

for (const id of stories)
  test(`components in ${id} follow the spacing base`, async ({ page }) => {
    await gotoStory(page, id);
    await page.evaluate(() => document.fonts.ready);
    expect(await ignoresSpacing(page)).toEqual([]);
  });
