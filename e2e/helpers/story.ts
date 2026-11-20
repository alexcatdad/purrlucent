import type { Locator, Page } from "@playwright/test";

/** Opens a Storybook story in its isolated iframe and returns the story root. */
export async function gotoStory(page: Page, storyId: string): Promise<Locator> {
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
  const root = page.locator("#storybook-root");
  await root.waitFor();
  return root;
}
