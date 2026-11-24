import { expect, type Page } from "@playwright/test";

/** The Widths story renders four hosts at 24, 40 and 60 spacing units, then 100%: each must be wider than the one before. */
export async function expectWidthsIncrease(page: Page, host: string) {
  const widths = await page
    .locator(host)
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
  expect(widths).toHaveLength(4);
  for (let i = 1; i < widths.length; i++)
    expect(widths[i]).toBeGreaterThan(widths[i - 1]!);
}
