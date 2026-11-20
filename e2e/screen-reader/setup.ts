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
 * move through these widgets with the arrow keys instead, so the test does too.
 * Re-focusing the first item makes NVDA announce the group's name, which
 * Guidepup's setup otherwise clears from the log.
 */
export async function walkCompositeWithArrows(
  page: Page,
  reader: ArrowReader,
  firstItem: string,
  steps: number,
): Promise<string> {
  await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.blur(),
  );
  await page.locator(firstItem).first().focus();
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
