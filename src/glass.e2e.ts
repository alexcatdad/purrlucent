import { expect, test, type Locator } from "@playwright/test";
import { gotoStory } from "../e2e/helpers/story.ts";

/**
 * One row per surface: the element that paints it, a glass story and a solid
 * story. Story-level globals beat the URL, so the two halves are two stories.
 * A surface that only paints when open (command, hover card, toast) is found
 * by a story that shows it. Slotted children are located from the story root.
 */
const GLASS: {
  story: string;
  solidStory: string;
  surface: (root: Locator) => Locator;
}[] = [
  {
    story: "navigation-sidebar--glass-dark-rtl",
    solidStory: "navigation-sidebar--default",
    surface: (root) => root.locator("pl-sidebar"),
  },
  {
    story: "menus-menubar--glass",
    solidStory: "menus-menubar--default",
    surface: (root) => root.locator("pl-menubar"),
  },
  {
    story: "navigation-tabs--glass",
    solidStory: "navigation-tabs--default",
    surface: (root) => root.locator("pl-tabs [part=list]"),
  },
  {
    story: "navigation-pagination--glass",
    solidStory: "navigation-pagination--default",
    surface: (root) => root.locator("pl-pagination"),
  },
  {
    story: "navigation-breadcrumb--glass",
    solidStory: "navigation-breadcrumb--default",
    surface: (root) => root.locator("pl-breadcrumb"),
  },
  {
    story: "menus-command--glass",
    solidStory: "menus-command--in-dialog",
    surface: (root) => root.locator("pl-dialog [part=dialog]"),
  },
  {
    story: "feedback-toast--glass",
    solidStory: "feedback-toast--default",
    surface: (root) => root.locator("pl-toast"),
  },
  {
    story: "feedback-banner--glass",
    solidStory: "feedback-banner--default",
    surface: (root) => root.locator("pl-banner"),
  },
  {
    story: "dialogs-hover-card--glass",
    solidStory: "dialogs-hover-card--open",
    surface: (root) => root.locator("pl-hover-card [part=panel]"),
  },
];

// WebKit may expose only the prefixed property.
const filterOf = (surface: Locator) =>
  surface.evaluate((el) => {
    const style = getComputedStyle(el);
    return (
      style.backdropFilter ||
      style.getPropertyValue("-webkit-backdrop-filter") ||
      "none"
    );
  });

for (const { story, solidStory, surface } of GLASS) {
  test(`${story}: glass blurs what is behind`, async ({ page }) => {
    const painted = surface(await gotoStory(page, story)).first();
    await expect(painted).toBeVisible();
    expect(await filterOf(painted)).toContain("blur");
  });

  test(`${solidStory}: solid does not blur`, async ({ page }) => {
    const painted = surface(await gotoStory(page, solidStory)).first();
    await expect(painted).toBeVisible();
    expect(await filterOf(painted)).toBe("none");
  });
}
