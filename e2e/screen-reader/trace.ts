import type { Page } from "@playwright/test";

type Reader = {
  lastSpokenPhrase(): Promise<string>;
  itemTextLog(): Promise<string[]>;
};

/** Diagnostic: logs what the screen reader last said and where browser focus is. */
export async function traceState(
  label: string,
  page: Page,
  reader: Reader,
): Promise<void> {
  const focus = await page.evaluate(() => {
    let el: Element | null = document.activeElement;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
    return {
      hasFocus: document.hasFocus(),
      active: el
        ? `${el.localName}${el.getAttribute("role") ? `[role=${el.getAttribute("role")}]` : ""} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40)}"`
        : "none",
    };
  });
  const items = await reader.itemTextLog();
  console.log(
    `[sr-trace] ${label} | spoke: ${JSON.stringify(await reader.lastSpokenPhrase())} | item: ${JSON.stringify(items.at(-1) ?? "")} | pageFocus: ${focus.hasFocus} | active: ${focus.active}`,
  );
}
