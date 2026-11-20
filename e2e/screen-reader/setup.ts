import type { Page } from "@playwright/test";

/**
 * Guidepup's navigateToWebContent() clicks the centre of <body> and then
 * presses Tab. Without this, the click lands on the story's own controls
 * (selecting a segment, focusing a toolbar button), or on empty space below the
 * last focusable element, after which Tab leaves the page for the browser UI.
 * A tall, empty, non-focusable spacer at the top takes the click, so Tab moves
 * to the story's first focusable element.
 */
type ArrowReader = {
  press(key: string): Promise<void>;
  spokenPhraseLog(): Promise<string[]>;
};

/**
 * NVDA switches to focus mode inside composite widgets (radio group, toolbar),
 * where its "next item" key is a plain Down arrow sent to the widget. NVDA users
 * Tab into these widgets, which announces the group's name and current item,
 * then move with the arrow keys. The test does the same, from a plain button
 * placed just before the widget.
 */
export async function walkCompositeWithArrows(
  page: Page,
  reader: ArrowReader,
  widget: string,
  steps: number,
  /** Item to make the widget's tab stop first (roving focus remembers the last one). */
  tabStop?: string,
): Promise<string> {
  if (tabStop) await page.locator(tabStop).first().focus();
  await page.evaluate((selector) => {
    const before = document.createElement("button");
    before.type = "button";
    before.id = "sr-before";
    before.textContent = "Before";
    document.querySelector(selector)?.before(before);
  }, widget);
  await page.locator("#sr-before").focus();
  await reader.press("Tab");
  for (let i = 0; i < steps; i++) await reader.press("ArrowRight");
  return (await reader.spokenPhraseLog()).join(" ");
}

export async function addClickSpacer(page: Page): Promise<void> {
  await page.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.setAttribute("aria-hidden", "true");
    spacer.style.height = "100vh";
    document.body.prepend(spacer);
  });
}
