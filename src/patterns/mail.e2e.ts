import { expect, test, type Locator } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = (name: string) => `patterns-mail--${name}`;

const rows = (root: Locator) => root.locator("pl-item[data-id]");
const rowLink = (root: Locator, name: RegExp) =>
  root.getByRole("link", { name });
const heading = (root: Locator) =>
  root.getByRole("article", { name: "Message" }).getByRole("heading");
const compose = (root: Locator) =>
  root.getByRole("button", { name: "Compose", exact: true });
const toolbarButton = (root: Locator, name: string) =>
  root
    .getByRole("toolbar", { name: "Message actions" })
    .getByRole("button", { name, exact: true });
const toast = (root: Locator) => root.locator("pl-toast");

for (const name of ["default", "narrow", "rtl", "glass"])
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });

test("no horizontal overflow at 200% text zoom in default", async ({
  page,
}) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("the default shows folders, the message list and a message", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await expect(root.getByRole("navigation", { name: "Folders" })).toBeVisible();
  await expect(rows(root)).toHaveCount(6);
  await expect(heading(root)).toHaveText("Draft of the trip itinerary");
  // Unread is said in text, not only in weight.
  await expect(root.locator("pl-item.unread")).toHaveCount(3);
  for (const row of await root.locator("pl-item.unread").all())
    await expect(row).toContainText("Unread");
  for (const row of await root.locator("pl-item.read").all())
    await expect(row).not.toContainText("Unread");
  await expect(root.locator("pl-sidebar-item#inbox pl-badge")).toHaveText("3");
});

test.describe("keyboard", () => {
  test("Tab moves through the message list and Enter opens a message", async ({
    page,
  }) => {
    const root = await gotoStory(page, story("default"));
    await rowLink(root, /Lunch on Thursday/).focus();
    await page.keyboard.press("Tab");
    await expect(rowLink(root, /Draft of the trip itinerary/)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(rowLink(root, /Your order has shipped/)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(heading(root)).toHaveText("Your order has shipped");
    // Opening a message reads it.
    await expect(rows(root).nth(2)).not.toContainText("Unread");
    await expect(root.locator("pl-sidebar-item#inbox pl-badge")).toHaveText(
      "2",
    );
  });

  test("Shift+F10 on a row opens its context menu", async ({ page }) => {
    const root = await gotoStory(page, story("default"));
    await rowLink(root, /Lunch on Thursday/).focus();
    await page.keyboard.press("Shift+F10");
    const menu = rows(root).first().locator("xpath=..").locator("pl-menu");
    await expect(menu).toHaveAttribute("open", "");
    for (const name of ["Reply", "Forward", "Archive", "Delete"])
      await expect(root.getByRole("menuitem", { name })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).not.toHaveAttribute("open");
  });

  test("Compose opens the drawer with focus in To; Escape returns to Compose", async ({
    page,
  }) => {
    const root = await gotoStory(page, story("default"));
    await compose(root).evaluate((el) => el.focus());
    await page.keyboard.press("Enter");
    await expect(root.locator("pl-drawer")).toHaveAttribute("open", "");
    await expect(root.getByRole("textbox", { name: "To" })).toBeFocused();
    await expect(root.getByRole("textbox", { name: "Subject" })).toBeVisible();
    await expect(root.getByRole("textbox", { name: "Body" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(root.locator("pl-drawer")).not.toHaveAttribute("open");
    await expect(compose(root)).toBeFocused();
  });
});

test("Send closes the drawer and shows a toast", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await compose(root).click();
  await expect(root.locator("pl-drawer")).toHaveAttribute("open", "");
  await root.getByRole("textbox", { name: "To" }).fill("friend");
  await root.getByRole("textbox", { name: "Subject" }).fill("Hello");
  await root.getByRole("textbox", { name: "Body" }).fill("A short note.");
  await root.getByRole("button", { name: "Send", exact: true }).click();
  await expect(root.locator("pl-drawer")).not.toHaveAttribute("open");
  await expect(toast(root)).toContainText("Message sent");
});

test("Reply fills the drawer from the message", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root
    .getByRole("article", { name: "Message" })
    .getByRole("button", { name: "Reply", exact: true })
    .click();
  await expect(root.getByRole("textbox", { name: "To" })).toHaveValue(
    "Theo Brandt",
  );
  await expect(root.getByRole("textbox", { name: "Subject" })).toHaveValue(
    "Re: Draft of the trip itinerary",
  );
});

test("Archive removes the row and shows a toast with Undo", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await rowLink(root, /Lunch on Thursday/).click();
  await expect(heading(root)).toHaveText("Lunch on Thursday?");
  await toolbarButton(root, "Archive").click();
  await expect(rows(root)).toHaveCount(5);
  await expect(rowLink(root, /Lunch on Thursday/)).toHaveCount(0);
  await expect(toast(root)).toContainText("Archived");
  await expect(root.getByText("No message selected")).toBeVisible();
  await toast(root).getByRole("button", { name: "Undo" }).click();
  await expect(rows(root)).toHaveCount(6);
  await expect(heading(root)).toHaveText("Lunch on Thursday?");
});

test("Archive from a row's context menu removes that row", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await rowLink(root, /Your order has shipped/).focus();
  await page.keyboard.press("Shift+F10");
  await root.getByRole("menuitem", { name: "Archive" }).click();
  await expect(rows(root)).toHaveCount(5);
  await expect(toast(root)).toContainText("Archived");
});

test("Mark unread flags the open message", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await toolbarButton(root, "Mark unread").click();
  await expect(rows(root).nth(1)).toContainText("Unread");
});

test("search narrows the list", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.getByRole("searchbox", { name: "Search mail" }).fill("photos");
  await expect(rows(root)).toHaveCount(1);
  await expect(rows(root).first()).toContainText("Photos from the weekend");
});

test("a folder shows its own messages", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.getByRole("button", { name: "Sent", exact: true }).click();
  await expect(rows(root)).toHaveCount(2);
});

test("on a narrow screen the list and the message take turns", async ({
  page,
}) => {
  const root = await gotoStory(page, story("narrow"));
  await expect(rows(root)).toHaveCount(6);
  await expect(root.getByRole("navigation", { name: "Folders" })).toBeHidden();
  await rowLink(root, /Lunch on Thursday/).click();
  await expect(heading(root)).toHaveText("Lunch on Thursday?");
  await expect(rows(root).first()).toBeHidden();
  await root.getByRole("button", { name: "Back to list" }).click();
  await expect(rows(root).first()).toBeVisible();
});

test("under rtl the reading pane sits at the left of the list", async ({
  page,
}) => {
  const root = await gotoStory(page, story("rtl"));
  const list = (await rows(root).first().boundingBox())!;
  const reading = (await root
    .getByRole("article", { name: "Message" })
    .boundingBox())!;
  expect(reading.x).toBeLessThan(list.x);
});
