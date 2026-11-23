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
  {
    story: "actions-button--glass",
    solidStory: "actions-button--default",
    surface: (root) => root.locator("pl-button"),
  },
  {
    story: "actions-button-group--glass",
    solidStory: "actions-button-group--default",
    surface: (root) => root.locator("pl-button-group pl-button"),
  },
  {
    story: "actions-toggle--glass",
    solidStory: "actions-toggle--default",
    surface: (root) => root.locator("pl-toggle"),
  },
  {
    story: "actions-toggle-group--glass",
    solidStory: "actions-toggle-group--default",
    surface: (root) => root.locator("pl-toggle-group"),
  },
  {
    story: "forms-switch--glass",
    solidStory: "forms-switch--default",
    surface: (root) => root.locator("pl-switch [part=track]"),
  },
  {
    story: "forms-slider--glass",
    solidStory: "forms-slider--default",
    surface: (root) => root.locator("pl-slider [part=track]"),
  },
  {
    story: "forms-checkbox--glass",
    solidStory: "forms-checkbox--default",
    surface: (root) => root.locator("pl-checkbox [part=box]"),
  },
  {
    story: "forms-radio-group--glass",
    solidStory: "forms-radio-group--default",
    surface: (root) => root.locator("pl-radio [part=box]"),
  },
  {
    story: "forms-input--glass",
    solidStory: "forms-input--default",
    surface: (root) => root.locator("pl-input [part=field]"),
  },
  {
    story: "forms-text-area--glass",
    solidStory: "forms-text-area--default",
    surface: (root) => root.locator("pl-textarea [part=field]"),
  },
  {
    story: "forms-select--glass",
    solidStory: "forms-select--default",
    surface: (root) => root.locator("pl-select [part=trigger]"),
  },
  {
    story: "forms-combobox--glass",
    solidStory: "forms-combobox--default",
    surface: (root) => root.locator("pl-combobox [part=field]"),
  },
  {
    story: "forms-number-field--glass",
    solidStory: "forms-number-field--default",
    surface: (root) => root.locator("pl-number-field [part=field]"),
  },
  {
    story: "forms-date-picker--glass",
    solidStory: "forms-date-picker--default",
    surface: (root) => root.locator("pl-date-picker [part=field]"),
  },
  {
    story: "forms-input-otp--glass",
    solidStory: "forms-input-otp--default",
    surface: (root) => root.locator("pl-input-otp [part=box]"),
  },
  {
    story: "ai-chat-prompt-input--glass",
    solidStory: "ai-chat-prompt-input--default",
    surface: (root) => root.locator("pl-prompt-input [part=shell]"),
  },
  {
    story: "ai-chat-message-scroller--glass",
    solidStory: "ai-chat-message-scroller--default",
    surface: (root) => root.locator("pl-message-scroller-button pl-button"),
  },
  {
    story: "containers-carousel--glass",
    solidStory: "containers-carousel--default",
    surface: (root) => root.locator("pl-carousel [part=previous]"),
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
