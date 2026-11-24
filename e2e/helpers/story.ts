import type { Locator, Page } from "@playwright/test";

/**
 * Opens a Storybook story in its isolated iframe and returns the story root. `globals` is a Storybook globals string such as "theme:dark".
 *
 * The accessibility addon's own axe run on every load is switched off: no test
 * reads it, it competes with expectAccessible, and it slows every load.
 */
export async function gotoStory(
  page: Page,
  storyId: string,
  globals = "",
): Promise<Locator> {
  const all = [globals, "a11y.manual:!true"].filter(Boolean).join(";");
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story&globals=${all}`);
  const root = page.locator("#storybook-root");
  await root.waitFor();
  return root;
}

type Channel = {
  on(event: string, listener: (payload: unknown) => void): void;
  off(event: string, listener: (payload: unknown) => void): void;
  emit(event: string, payload: unknown): void;
};

/**
 * Shows a story on a page that already has the preview loaded, through
 * Storybook's channel, without reloading the preview. Much faster than
 * gotoStory, but the page keeps whatever an earlier story left behind, so it
 * suits read-only checks only. The first call on a fresh page loads it.
 */
export async function switchStory(page: Page, storyId: string): Promise<void> {
  if (!page.url().includes("/iframe.html")) {
    await gotoStory(page, storyId);
    return;
  }
  await page.evaluate(
    (id) =>
      new Promise<void>((resolve, reject) => {
        const channel = (
          window as unknown as { __STORYBOOK_ADDONS_CHANNEL__: Channel }
        ).__STORYBOOK_ADDONS_CHANNEL__;
        const failures = [
          "storyErrored",
          "storyThrewException",
          "storyMissing",
        ];
        const timer = setTimeout(() => fail("not rendered within 10s"), 10_000);
        const stop = () => {
          clearTimeout(timer);
          channel.off("storyRendered", done);
          channel.off("storyUnchanged", done);
          for (const event of failures) channel.off(event, fail);
        };
        function done(rendered: unknown) {
          if (rendered !== id) return;
          stop();
          resolve();
        }
        function fail(error: unknown) {
          stop();
          reject(new Error(`${id}: ${JSON.stringify(error)}`));
        }
        channel.on("storyRendered", done);
        channel.on("storyUnchanged", done);
        for (const event of failures) channel.on(event, fail);
        channel.emit("setCurrentStory", { storyId: id, viewMode: "story" });
      }),
    storyId,
  );
}
