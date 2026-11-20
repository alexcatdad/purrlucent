import type { Locator, Page } from "@playwright/test";

/** Opens a Storybook story in its isolated iframe and returns the story root. `globals` is a Storybook globals string such as "theme:dark". */
export async function gotoStory(
  page: Page,
  storyId: string,
  globals = "",
): Promise<Locator> {
  await page.goto(
    `/iframe.html?id=${storyId}&viewMode=story${globals && `&globals=${globals}`}`,
  );
  const root = page.locator("#storybook-root");
  await root.waitFor();
  return root;
}
