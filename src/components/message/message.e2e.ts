import { expect, test, type Locator } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `ai-chat-message--${name}`;

const box = async (locator: Locator) => (await locator.boundingBox())!;

/** The first block of content: the stand-in bubble is the one div in the message. */
const bubbleOf = (message: Locator) => message.locator(":scope > div").first();

test("has no axe violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("default")));
});

test("message own: name aligns with the bubble", async ({ page }) => {
  const root = await gotoStory(page, story("own"));
  const message = root.locator("pl-message");
  const name = await box(message.locator('[slot="header"]'));
  const bubble = await box(bubbleOf(message));
  // Own messages sit at the end, so the name ends where the bubble ends.
  expect(
    Math.abs(name.x + name.width - (bubble.x + bubble.width)),
  ).toBeLessThanOrEqual(1);
});

test("has no axe violations as a group", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("group")));
});

test("a message has no role of its own", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  expect(
    await root.locator("pl-message").evaluate((el) => el.getAttribute("role")),
  ).toBeNull();
});

test("a group is a named group", async ({ page }) => {
  await gotoStory(page, story("group"));
  await expect(page.getByRole("group", { name: "Purr Assistant" })).toHaveCount(
    1,
  );
});

test("only the last message of a group exposes its avatar", async ({
  page,
}) => {
  const root = await gotoStory(page, story("group"));
  await expect(root.getByRole("img", { name: "Purr Assistant" })).toHaveCount(
    1,
  );
  const visibility = await root
    .locator("pl-message")
    .evaluateAll((els) =>
      els.map(
        (el) =>
          getComputedStyle(el.shadowRoot!.querySelector("[part=avatar]")!)
            .visibility,
      ),
    );
  expect(visibility).toEqual(["hidden", "hidden", "visible"]);
});

test("the messages of a group keep their bubbles on one edge, tightly stacked", async ({
  page,
}) => {
  const root = await gotoStory(page, story("group"));
  const bubbles = await root.locator("pl-message").evaluateAll((els) =>
    els.map((el) => {
      const r = el.querySelector("div")!.getBoundingClientRect();
      return { x: r.x, top: r.top, bottom: r.bottom };
    }),
  );
  expect(bubbles[1]!.x).toBeCloseTo(bubbles[0]!.x, 0);
  expect(bubbles[2]!.x).toBeCloseTo(bubbles[0]!.x, 0);
  const gap = bubbles[1]!.top - bubbles[0]!.bottom;
  expect(gap).toBeGreaterThanOrEqual(0);
  expect(gap).toBeLessThan(8);
});

test("the avatar sits level with the bottom of the content, above the footer", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  const message = root.locator("pl-message");
  const avatar = await box(message.locator("pl-avatar"));
  const bubble = await box(bubbleOf(message));
  const footer = await box(message.locator("[slot=footer]"));
  expect(avatar.y + avatar.height).toBeCloseTo(bubble.y + bubble.height, 0);
  expect(footer.y).toBeGreaterThanOrEqual(bubble.y + bubble.height);
});

test("without a footer the avatar sits at the bottom of the row", async ({
  page,
}) => {
  const root = await gotoStory(page, story("without-footer"));
  const message = await box(root.locator("pl-message"));
  const avatar = await box(root.locator("pl-avatar"));
  expect(avatar.y + avatar.height).toBeCloseTo(message.y + message.height, 0);
});

test("a loaded avatar image sits at the bottom of the row", async ({
  page,
}) => {
  const root = await gotoStory(page, story("with-avatar-image"));
  const avatar = root.locator("pl-avatar");
  await expect(avatar.locator("img")).toBeVisible();
  const message = await box(root.locator("pl-message"));
  const rect = await box(avatar);
  expect(rect.y + rect.height).toBeCloseTo(message.y + message.height, 0);
});

test("the header sits above the content", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  const message = root.locator("pl-message");
  const header = await box(message.locator("[slot=header]"));
  const bubble = await box(bubbleOf(message));
  expect(header.y + header.height).toBeLessThanOrEqual(bubble.y);
});

test("the avatar sits at the start edge and the content after it", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  const message = await box(root.locator("pl-message"));
  const avatar = await box(root.locator("pl-avatar"));
  const bubble = await box(bubbleOf(root.locator("pl-message")));
  expect(avatar.x).toBeCloseTo(message.x, 0);
  expect(bubble.x).toBeGreaterThanOrEqual(avatar.x + avatar.width);
});

test("an end-aligned message sits its avatar and content at the end edge", async ({
  page,
}) => {
  const root = await gotoStory(page, story("own"));
  const message = await box(root.locator("pl-message"));
  const avatar = await box(root.locator("pl-avatar"));
  const bubble = await box(bubbleOf(root.locator("pl-message")));
  expect(avatar.x + avatar.width).toBeCloseTo(message.x + message.width, 0);
  expect(bubble.x + bubble.width).toBeLessThanOrEqual(avatar.x);
  expect(bubble.x).toBeGreaterThan(message.x);
});

test("an end-aligned message ends its header and footer at the bubble's end edge", async ({
  page,
}) => {
  const root = await gotoStory(page, story("own"));
  const message = root.locator("pl-message");
  const header = await box(message.locator("[slot=header]"));
  const footer = await box(message.locator("[slot=footer]"));
  const bubble = await box(bubbleOf(message));
  expect(header.x + header.width).toBeCloseTo(bubble.x + bubble.width, 0);
  expect(footer.x + footer.width).toBeCloseTo(bubble.x + bubble.width, 0);
});

test("without an avatar the content starts at the edge", async ({ page }) => {
  const root = await gotoStory(page, story("without-avatar"));
  const message = await box(root.locator("pl-message"));
  const bubble = await box(bubbleOf(root.locator("pl-message")));
  expect(bubble.x).toBeCloseTo(message.x, 0);
});

test("empty header, footer and avatar wrappers are hidden", async ({
  page,
}) => {
  const root = await gotoStory(page, story("without-avatar"));
  const hidden = await root
    .locator("pl-message")
    .evaluate((el) =>
      ["avatar", "header", "footer"].map(
        (part) =>
          el.shadowRoot!.querySelector<HTMLElement>(`[part=${part}]`)!.hidden,
      ),
    );
  expect(hidden).toEqual([true, true, true]);
});

test("content blocks are stacked", async ({ page }) => {
  const root = await gotoStory(page, story("multiple-blocks"));
  const blocks = root.locator("pl-message > div");
  const first = await box(blocks.nth(0));
  const second = await box(blocks.nth(1));
  expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
  expect(second.x).toBeCloseTo(first.x, 0);
});

test("under rtl the start-aligned avatar sits at the right edge", async ({
  page,
}) => {
  const root = await gotoStory(page, story("rtl"));
  const message = root.locator("pl-message").first();
  const outer = await box(message);
  const avatar = await box(message.locator("pl-avatar"));
  expect(avatar.x + avatar.width).toBeCloseTo(outer.x + outer.width, 0);
});

test("under rtl the end-aligned message mirrors to the left edge", async ({
  page,
}) => {
  const root = await gotoStory(page, story("rtl"));
  const message = root.locator("pl-message").nth(1);
  const outer = await box(message);
  const avatar = await box(message.locator("pl-avatar"));
  expect(avatar.x).toBeCloseTo(outer.x, 0);
});

test("long text wraps without horizontal overflow at 200% text zoom", async ({
  page,
}) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("long-text")));
});

test("nothing animates under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("default"));
  expect(
    await page.evaluate(
      () =>
        document.querySelector("pl-message")!.getAnimations({ subtree: true })
          .length,
    ),
  ).toBe(0);
});

test("the content stays visible under forced colors", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await expect(
    root.getByText("Here is the summary you asked for."),
  ).toBeVisible();
  await expect(root.getByRole("img", { name: "Purr Assistant" })).toBeVisible();
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("footer buttons are at least 44 by 44", async ({ page }) => {
    const root = await gotoStory(page, story("footer-actions"));
    for (const name of ["Copy message", "Retry"]) {
      const b = await box(root.getByRole("button", { name }));
      expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
  });
});
