import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator } from "@playwright/test";

const wcag22aa = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Runs axe with WCAG 2.2 AA tags on the locator's subtree and fails on any violation. */
export async function expectAccessible(locator: Locator): Promise<void> {
  await locator.evaluate((el) => el.setAttribute("data-axe-target", ""));
  const { violations } = await new AxeBuilder({ page: locator.page() })
    .include("[data-axe-target]")
    .withTags(wcag22aa)
    .analyze();
  await locator.evaluate((el) => el.removeAttribute("data-axe-target"));
  expect(violations).toEqual([]);
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
      if (node.scrollWidth > node.clientWidth) found.push(node.localName);
      for (const child of node.shadowRoot?.children ?? []) walk(child);
      for (const child of node.children) walk(child);
    };
    walk(root);
    return found;
  });
  expect(overflowing).toEqual([]);
}

const virtualScreenReader = resolve(
  "node_modules/@guidepup/virtual-screen-reader/lib/esm/index.browser.js",
);

/** Walks the page with the virtual screen reader and returns everything it spoke. */
export async function spokenPhrases(locator: Locator): Promise<string[]> {
  const page = locator.page();
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
