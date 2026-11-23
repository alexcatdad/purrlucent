import { expect, test, type Locator } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = (name: string) => `patterns-settings--${name}`;

const tab = (root: Locator, name: string) =>
  root.getByRole("tab", { name, exact: true });
const email = (root: Locator) => root.getByRole("textbox", { name: "Email" });
const field = (root: Locator) => root.locator("pl-field#email-field");
const save = (root: Locator) => root.getByRole("button", { name: "Save" });
const ask = (root: Locator) =>
  root.getByRole("button", { name: "Delete account" });
const dialog = (root: Locator) => root.locator("pl-dialog#delete");

for (const name of ["default", "errors", "rtl", "glass"])
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });

test("no horizontal overflow at 200% text zoom in default", async ({
  page,
}) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("the arrow keys switch tabs and show their panels", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(tab(root, "General")).toHaveAttribute("aria-selected", "true");
  await expect(
    root.getByRole("textbox", { name: "Display name" }),
  ).toBeVisible();
  await tab(root, "General").evaluate((el) => el.focus());
  await page.keyboard.press("ArrowRight");
  await expect(tab(root, "Notifications")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(tab(root, "Notifications")).toBeFocused();
  await expect(
    root.getByRole("switch", { name: "Weekly summary" }),
  ).toBeVisible();
  await expect(root.getByRole("textbox", { name: "Email" })).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await expect(tab(root, "Privacy")).toHaveAttribute("aria-selected", "true");
  await expect(
    root.getByRole("checkbox", { name: "Share usage data" }),
  ).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(tab(root, "Notifications")).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("General has the name, email, language and appearance controls", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await expect(
    root.getByRole("textbox", { name: "Display name" }),
  ).toBeVisible();
  await expect(email(root)).toHaveAccessibleDescription(
    "We send receipts and security notices here.",
  );
  await expect(root.locator("pl-select#language")).toBeVisible();
  await expect(root.getByRole("radio")).toHaveCount(3);
  await expect(root.getByRole("radio", { name: "Automatic" })).toBeChecked();
});

test("Notifications groups three switches under a legend", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await tab(root, "Notifications").click();
  await expect(root.getByRole("group", { name: "Notify me by" })).toBeVisible();
  await expect(root.getByRole("switch")).toHaveCount(3);
  await expect(root.getByRole("switch", { name: "Email" })).toBeChecked();
  await expect(
    root.getByRole("switch", { name: "Weekly summary" }),
  ).not.toBeChecked();
});

test("toggling a switch keeps Notifications selected", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await tab(root, "Notifications").click();
  await root.getByRole("switch", { name: "Weekly summary" }).click();
  await expect(
    root.getByRole("switch", { name: "Weekly summary" }),
  ).toBeChecked();
  await expect(tab(root, "Notifications")).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("saving an empty email shows the error and marks the field invalid", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await expect(field(root)).not.toHaveAttribute("invalid");
  await email(root).fill("");
  await save(root).click();
  await expect(field(root)).toHaveAttribute("invalid", "");
  await expect(field(root).locator("[slot=error]")).toBeVisible();
  await expect(field(root).locator("[slot=error]")).toHaveText(
    "Enter your email address.",
  );
  await expect(email(root)).toHaveAttribute("aria-invalid", "true");
  await expect(email(root)).toBeFocused();
  await expect(root.locator("pl-toast")).toHaveCount(0);
});

test("a badly formed email shows the format error, and fixing it clears it", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await email(root).fill("nope");
  await save(root).click();
  await expect(field(root).locator("[slot=error]")).toHaveText(
    "Enter an address such as name@example.com.",
  );
  await email(root).fill("sam@example.test");
  await expect(field(root)).not.toHaveAttribute("invalid");
  await expect(email(root)).not.toHaveAttribute("aria-invalid", "true");
});

test("the Errors story starts after a failed save", async ({ page }) => {
  const root = await gotoStory(page, story("errors"));
  await expect(field(root)).toHaveAttribute("invalid", "");
  await expect(field(root).locator("[slot=error]")).toBeVisible();
  await expect(email(root)).toHaveAttribute("aria-invalid", "true");
});

test("a failed save from another tab returns to the email", async ({
  page,
}) => {
  const root = await gotoStory(page, story("errors"));
  await tab(root, "Privacy").click();
  await save(root).click();
  await expect(tab(root, "General")).toHaveAttribute("aria-selected", "true");
  await expect(email(root)).toBeFocused();
});

test("a valid save shows the Settings saved toast", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await save(root).click();
  await expect(root.locator("pl-toast")).toContainText("Settings saved");
  await expect(field(root)).not.toHaveAttribute("invalid");
});

test.describe("delete account", () => {
  test("opens an alert dialog; Escape closes it and returns focus to the button", async ({
    page,
  }) => {
    const root = await gotoStory(page, story("default"));
    await tab(root, "Privacy").click();
    await ask(root).click();
    await expect(dialog(root)).toHaveAttribute("open", "");
    await expect(
      root.getByRole("alertdialog", { name: "Delete your account?" }),
    ).toBeVisible();
    await expect(root.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog(root)).not.toHaveAttribute("open");
    await expect(ask(root)).toBeFocused();
    await expect(root.locator("pl-toast")).toHaveCount(0);
  });

  test("confirming closes the dialog and shows a toast", async ({ page }) => {
    const root = await gotoStory(page, story("default"));
    await tab(root, "Privacy").click();
    await ask(root).click();
    // The buttons are slotted into pl-dialog, not inside its shadow <dialog>.
    await dialog(root)
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(dialog(root)).not.toHaveAttribute("open");
    await expect(root.locator("pl-toast")).toContainText("Account deleted");
  });
});

test("under rtl the tabs and the Save button follow the reading direction", async ({
  page,
}) => {
  const root = await gotoStory(page, story("rtl"));
  const frame = (await root.locator("settings-demo").boundingBox())!;
  const first = (await tab(root, "General").boundingBox())!;
  const button = (await save(root).boundingBox())!;
  expect(first.x - frame.x).toBeGreaterThan(
    frame.x + frame.width - (first.x + first.width),
  );
  expect(button.x - frame.x).toBeLessThan(
    frame.x + frame.width - (button.x + button.width),
  );
});
