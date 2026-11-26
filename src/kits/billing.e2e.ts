import { expect, test } from "@playwright/test";

const kit = "/kits/billing/index.html";

test("confirms a plan change, retains invoice history, and restores the prior plan", async ({
  page,
}) => {
  await page.goto(kit);
  await expect(page.locator("#current-plan")).toHaveText("Team · Monthly");
  await page.getByRole("radio", { name: "Monthly" }).press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Yearly" })).toBeChecked();
  await expect(
    page.getByRole("status").filter({ hasText: "Billed yearly" }),
  ).toBeVisible();

  const choose = page.getByRole("button", { name: "Choose Scale" });
  await choose.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Switch to Scale?" });
  await expect(dialog.getByText(/\$480 per year/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(choose).toBeFocused();
  await expect(page.locator("#current-plan")).toHaveText("Team · Monthly");

  await choose.press("Enter");
  await dialog.getByRole("button", { name: "Confirm plan change" }).click();
  await expect(
    page.getByRole("heading", { name: "Demo billing" }),
  ).toBeFocused();
  await expect(page.locator("#current-plan")).toHaveText("Scale · Yearly");
  await expect(page.locator("#current-rate")).toHaveText("$480 per year");
  await page.getByText("Nov 1, 2026", { exact: true }).click();
  await expect(page.getByText("FW-014", { exact: true })).toBeVisible();
  await expect(
    page.locator("details[open]").getByText("Paid", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Undo plan change" }).press("Enter");
  await expect(page.locator("#current-plan")).toHaveText("Team · Monthly");
  await expect(page.locator("#current-rate")).toHaveText("$24 per month");
  await expect(page.locator("#change-note")).toContainText(
    "Plan change undone",
  );
  await expect(page.getByText("FW-014", { exact: true })).toBeVisible();
});

test("preserves comparison headers and features at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 820 });
  await page.goto(kit);
  const table = page.getByRole("table", { name: "Compare plans" });
  await expect(table.getByRole("columnheader")).toHaveText([
    "Feature",
    "Solo",
    "Team",
    "Scale",
  ]);
  await expect(
    table.getByRole("row", { name: /members/i }).getByRole("cell"),
  ).toHaveText(["1", "10", "30"]);
  await expect(
    table.getByRole("row", { name: /custom roles/i }).getByRole("cell"),
  ).toHaveText(["No", "No", "Yes"]);
  expect(
    await table.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
