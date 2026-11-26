import { expect, test } from "@playwright/test";
import { expectAccessible } from "../../e2e/helpers/a11y.ts";

for (const route of [
  "product-site/index",
  "product-site/centered",
  "docs/index",
  "docs/theming",
  "onboarding/index",
  "admin/index",
  "billing/index",
]) {
  test(`the ${route} starter passes a phone accessibility check and reflows at 200% text size`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto(`/kits/${route}.html`);
    if (route === "admin/index")
      await expect(page.locator("#queue-results")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectAccessible(page.locator("body"), { singleDocument: true });
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
