import { expect, test, type Locator } from "@playwright/test";
import { gotoStory } from "../e2e/helpers/story.ts";

/**
 * One row per glass story: the element that paints the surface. A surface
 * that only paints when open (command, hover card, toast) is found by a story
 * that shows it. Slotted children are located from the story root.
 */
const GLASS: { story: string; surface: (root: Locator) => Locator }[] = [
  {
    story: "navigation-sidebar--glass-dark-rtl",
    surface: (root) => root.locator("pl-sidebar"),
  },
  {
    story: "menus-menubar--glass",
    surface: (root) => root.locator("pl-menubar"),
  },
  {
    story: "navigation-tabs--glass",
    surface: (root) => root.locator("pl-tabs [part=list]"),
  },
  {
    story: "navigation-pagination--glass",
    surface: (root) => root.locator("pl-pagination"),
  },
  {
    story: "navigation-breadcrumb--glass",
    surface: (root) => root.locator("pl-breadcrumb"),
  },
  {
    story: "menus-command--glass",
    surface: (root) => root.locator("pl-dialog [part=dialog]"),
  },
  {
    story: "feedback-toast--glass",
    surface: (root) => root.locator("pl-toast"),
  },
  {
    story: "feedback-banner--glass",
    surface: (root) => root.locator("pl-banner"),
  },
  {
    story: "dialogs-hover-card--glass",
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

for (const { story, surface } of GLASS) {
  test(`${story}: glass blurs what is behind, solid does not`, async ({
    page,
  }) => {
    const root = await gotoStory(page, story, "material:glass");
    const painted = surface(root).first();
    await expect(painted).toBeVisible();
    expect(await filterOf(painted)).toContain("blur");

    await gotoStory(page, story, "material:solid");
    await expect(painted).toBeVisible();
    expect(await filterOf(painted)).toBe("none");
  });
}
