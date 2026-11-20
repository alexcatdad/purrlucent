import type { Page } from "@playwright/test";

/**
 * Guidepup's navigateToWebContent() clicks the centre of <body> and then
 * presses Tab. Without this, the click lands on the story's own controls
 * (selecting a segment, focusing a toolbar button), or on empty space below the
 * last focusable element, after which Tab leaves the page for the browser UI.
 * A tall, empty, non-focusable spacer at the top takes the click, so Tab moves
 * to the story's first focusable element.
 */
export async function addClickSpacer(page: Page): Promise<void> {
  await page.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.setAttribute("aria-hidden", "true");
    spacer.style.height = "100vh";
    document.body.prepend(spacer);
  });
}
