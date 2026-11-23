import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

const wcag22aa = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Storybook's accessibility addon runs axe in the same frame when a story
 * loads, and axe refuses a second concurrent run ("Axe is already running").
 * Retry until the addon's run has finished, for at most about five seconds.
 */
async function analyzeWhenAxeIsFree(builder: AxeBuilder, page: Page) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await builder.analyze();
    } catch (error) {
      const busy = String(error).includes("Axe is already running");
      if (!busy || attempt >= 25) throw error;
      await page.waitForTimeout(200);
    }
  }
}

/** Runs axe with WCAG 2.2 AA tags on the locator's subtree and fails on any violation. */
export async function expectAccessible(locator: Locator): Promise<void> {
  // Colors read mid-transition are neither the start nor the end state.
  await locator.page().evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
  await locator.evaluate((el) => el.setAttribute("data-axe-target", ""));
  try {
    const { violations } = await analyzeWhenAxeIsFree(
      new AxeBuilder({ page: locator.page() })
        .include("[data-axe-target]")
        .withTags(wcag22aa),
      locator.page(),
    );
    expect(violations).toEqual([]);
  } finally {
    await locator.evaluate((el) => el.removeAttribute("data-axe-target"));
  }
}

/** Emulates 200% text zoom (WCAG 1.4.4) and fails if anything in the subtree, shadow DOM included, overflows horizontally. */
export async function expectNoOverflowAtTextZoom(
  locator: Locator,
  percent = 200,
): Promise<void> {
  await locator
    .page()
    .addStyleTag({ content: `html { font-size: ${percent}% !important; }` });
  const overflowing = await locator.evaluate((root) => {
    const found: string[] = [];
    const walk = (node: Element) => {
      // Inline boxes cannot scroll; Firefox still reports a scrollWidth for them.
      if (
        getComputedStyle(node).display !== "inline" &&
        node.scrollWidth > node.clientWidth
      )
        found.push(node.localName);
      for (const child of node.shadowRoot?.children ?? []) walk(child);
      for (const child of node.children) walk(child);
    };
    walk(root);
    return found;
  });
  expect(overflowing).toEqual([]);
}

const virtualScreenReader = fileURLToPath(
  import.meta.resolve("@guidepup/virtual-screen-reader/browser.js"),
);

/** Walks the whole page (document.body) with the virtual screen reader and returns everything it spoke. */
export async function spokenPhrases(page: Page): Promise<string[]> {
  await page.route("**/__virtual-screen-reader.js", async (route) =>
    route.fulfill({
      body: await readFile(virtualScreenReader),
      contentType: "text/javascript",
    }),
  );
  return page.evaluate(async () => {
    const url = "/__virtual-screen-reader.js";
    const { virtual } = (await import(
      url
    )) as typeof import("@guidepup/virtual-screen-reader");
    await virtual.start({ container: document.body });
    for (
      let i = 0;
      i < 100 && (await virtual.lastSpokenPhrase()) !== "end of document";
      i++
    ) {
      await virtual.next();
    }
    const log = await virtual.spokenPhraseLog();
    await virtual.stop();
    return log;
  });
}
