import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `feedback-empty--${name}`;

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - strong: No projects
    - text: Projects you create appear here. Create one to get started.
    - button "Create project"
  `);
});

test("has no axe violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("default")));
});

test("the content is centered", async ({ page }) => {
  await gotoStory(page, story("default"));
  const host = (await page.locator("pl-empty").boundingBox())!;
  const title = (await page.locator("[slot=title]").boundingBox())!;
  const middle = title.x + title.width / 2;
  expect(Math.abs(middle - (host.x + host.width / 2))).toBeLessThan(2);
});

test("the icon sits above the title and the action below the text", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const icon = (await page.locator("svg[slot=icon]").boundingBox())!;
  const title = (await page.locator("[slot=title]").boundingBox())!;
  const action = (await page.getByRole("button").boundingBox())!;
  expect(icon.y + icon.height).toBeLessThanOrEqual(title.y);
  expect(action.y).toBeGreaterThan(title.y + title.height);
});

test("without an icon or action nothing is reserved for them", async ({
  page,
}) => {
  await gotoStory(page, story("title-only"));
  const sizes = await page
    .locator("pl-empty")
    .evaluate((el) =>
      ["icon", "action"].map(
        (part) =>
          (el.shadowRoot!.querySelector(`[part=${part}]`) as HTMLElement)
            .offsetHeight,
      ),
    );
  expect(sizes).toEqual([0, 0]);
});

test("it is not a live region", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("the action is reachable with the keyboard", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.getByRole("button", { name: "Create project" }).focus();
  await expect(
    page.getByRole("button", { name: "Create project" }),
  ).toBeFocused();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("virtual screen reader speaks the title and description", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("No projects");
  expect(spoken).toContain("Projects you create appear here");
});
