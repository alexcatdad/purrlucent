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
    browserName,
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto(`/kits/${route}.html`);
    if (route === "admin/index")
      await expect(page.locator("#queue-results")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Axe crashes the Firefox CI tab on the loaded admin queue, so this case
    // checks accessible roles, names, states, and keyboard focus directly.
    if (browserName === "firefox" && route === "admin/index") {
      const main = page.getByRole("main");
      await expect(main).toBeVisible();
      await expect(
        main.getByRole("heading", { name: "Support queue", level: 1 }),
      ).toBeVisible();

      const search = main.getByRole("searchbox", { name: "Search requests" });
      const status = main.getByRole("combobox", { name: "Status" });
      const selectAll = main.getByRole("checkbox", {
        name: "Select open requests",
        checked: false,
      });
      await expect(
        main.getByRole("button", { name: "Resolve selected" }),
      ).toBeDisabled();

      const rows = main
        .getByRole("list", { name: "Requests" })
        .getByRole("listitem");
      await expect(rows).toHaveCount(5);
      const firstRow = rows.first();
      const selectRequest = firstRow.getByRole("checkbox", {
        name: "Select Invite link expired",
        checked: false,
      });
      const openRequest = firstRow.getByRole("button", {
        name: "Invite link expired",
      });
      await search.focus();
      await expect(search).toBeFocused();
      for (const control of [status, selectAll, selectRequest, openRequest]) {
        await page.keyboard.press("Tab");
        await expect(control).toBeFocused();
      }
    } else {
      await expectAccessible(page.locator("body"));
    }
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
