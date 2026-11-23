import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-bubble--${name}`;

const stories = [
  "default",
  "variants",
  "alignment",
  "long-text",
  "reactions",
  "interactive-reactions",
  "controls",
  "assistant",
  "group",
  "rtl",
  "glass",
];

const body = (bubble: Locator) => bubble.locator("[part=body]");

/** The box of a locator, which every test below reads for position and size. */
const box = async (locator: Locator) => (await locator.boundingBox())!;

/** The width of the story's own grid container. */
// The story column's content width: its box minus the padding on both sides.
const containerWidth = async (page: Page) =>
  page.locator("#storybook-root > div").evaluate((el) => {
    const style = getComputedStyle(el);
    return (
      el.getBoundingClientRect().width -
      Number.parseFloat(style.paddingLeft) -
      Number.parseFloat(style.paddingRight)
    );
  });

for (const id of stories) {
  test(`axe finds no WCAG 2.2 AA violations in ${id}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(id)));
  });
}

test("aria snapshot of the link and the button", async ({ page }) => {
  const root = await gotoStory(page, story("controls"));
  await expect(root).toMatchAriaSnapshot(`
    - link "Open the report"
    - button "Regenerate response"
  `);
});

test("a bubble without href or interactive is neither a link nor a button", async ({
  page,
}) => {
  await gotoStory(page, story("variants"));
  await expect(page.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("button")).toHaveCount(0);
});

test("an href makes the body a link that keeps its address", async ({
  page,
}) => {
  await gotoStory(page, story("controls"));
  await expect(
    page.getByRole("link", { name: "Open the report" }),
  ).toHaveAttribute("href", "https://example.com/report");
});

test("the keyboard activates an interactive bubble and click reaches the host", async ({
  page,
}) => {
  await gotoStory(page, story("controls"));
  await page.locator("pl-bubble[interactive]").evaluate((el) => {
    const w = window as never as { clicks: number };
    w.clicks = 0;
    el.addEventListener("click", () => w.clicks++);
  });
  await page.getByRole("button", { name: "Regenerate response" }).focus();
  await page.keyboard.press("Enter");
  expect(
    await page.evaluate(() => (window as never as { clicks: number }).clicks),
  ).toBe(1);
});

test("a link and a button show a focus ring", async ({ page }) => {
  await gotoStory(page, story("controls"));
  for (const role of ["link", "button"] as const) {
    const control = page.getByRole(role);
    await control.focus();
    expect(
      await control.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe("none");
  }
});

test("the focus ring is visible under forced colors", async ({ page }) => {
  await gotoStory(page, story("controls"));
  await page.emulateMedia({ forcedColors: "active" });
  const link = page.getByRole("link");
  await link.focus();
  expect(
    await link.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

test("under forced colors a filled bubble keeps an edge", async ({ page }) => {
  await gotoStory(page, story("variants"));
  await page.emulateMedia({ forcedColors: "active" });
  const edge = await body(page.locator("pl-bubble").first()).evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.borderTopStyle, width: s.borderTopWidth };
  });
  expect(edge).toEqual({ style: "solid", width: "1px" });
});

test("with reduced motion the hover tint does not transition", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("controls"));
  const duration = await page
    .getByRole("link")
    .evaluate((el) => getComputedStyle(el, "::before").transitionDuration);
  expect(duration).toBe("0s");
});

test("a bubble sizes to its content and ghost takes the full width", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const width = await containerWidth(page);
  const own = await box(page.locator("pl-bubble").first());
  const ghost = await box(page.locator("pl-bubble[variant=ghost]"));
  expect(own.width).toBeLessThan(width * 0.8);
  expect(ghost.width).toBeGreaterThan(width - 2);
});

test("long text stops at 80% of the container and a long word wraps", async ({
  page,
}) => {
  await gotoStory(page, story("long-text"));
  const width = await containerWidth(page);
  const secondary = await box(page.locator("pl-bubble[variant=secondary]"));
  expect(secondary.width).toBeLessThanOrEqual(width * 0.8 + 1);
  expect(secondary.width).toBeGreaterThan(width * 0.7);
  const ghost = await box(page.locator("pl-bubble[variant=ghost]"));
  expect(ghost.width).toBeGreaterThan(width - 2);
});

test("align places the bubble at the start or the end edge", async ({
  page,
}) => {
  await gotoStory(page, story("alignment"));
  const root = await box(page.locator("#storybook-root > div"));
  const [start, end] = [
    await box(page.locator("pl-bubble").nth(0)),
    await box(page.locator("pl-bubble").nth(1)),
  ];
  expect(start.x).toBeLessThan(root.x + root.width / 2);
  expect(end.x + end.width).toBeGreaterThan(root.x + root.width - 20);
  expect(end.x).toBeGreaterThan(root.x + root.width / 2 - 1);
});

test("under rtl the start edge is at the right", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const root = await box(page.locator("#storybook-root > div"));
  const bubble = await box(page.locator("pl-bubble"));
  expect(bubble.x + bubble.width).toBeGreaterThan(root.x + root.width - 20);
  const reactions = await box(page.locator("pl-bubble-reactions"));
  // Aligned to the start, so also at the right.
  expect(reactions.x + reactions.width).toBeGreaterThan(
    bubble.x + bubble.width - 40,
  );
});

test("destructive draws an error mark beside text that says what failed", async ({
  page,
}) => {
  await gotoStory(page, story("variants"));
  const destructive = page.locator("pl-bubble[variant=destructive]");
  expect(await destructive.evaluate((el) => el.textContent)).toContain(
    "could not be sent",
  );
  const mark = destructive.locator("[part=body] > svg");
  await expect(mark).toHaveAttribute("aria-hidden", "true");
  expect((await box(mark)).width).toBeGreaterThan(0);
  await expect(
    page.locator("pl-bubble:not([variant=destructive]) [part=body] > svg"),
  ).toHaveCount(0);
});

test("non-interactive reactions are one image named by the label", async ({
  page,
}) => {
  await gotoStory(page, story("reactions"));
  await expect(page.getByRole("img", { name: "2 likes, 1 laugh" })).toHaveCount(
    1,
  );
  await expect(page.getByRole("button")).toHaveCount(0);
});

test("reactions without a label are named by their text", async ({ page }) => {
  await gotoStory(page, story("reactions"));
  const reactions = page.locator("pl-bubble-reactions").first();
  await reactions.evaluate((el) => el.removeAttribute("label"));
  await expect(reactions).toHaveAttribute("aria-label", "👍 2 😂 1");
});

test("interactive reactions are a group of real buttons", async ({ page }) => {
  await gotoStory(page, story("interactive-reactions"));
  const group = page.getByRole("group", { name: "Reactions" });
  await expect(group.getByRole("button")).toHaveCount(2);
  await expect(
    group.getByRole("button", { name: "Like, 2 reactions" }),
  ).toBeVisible();
  await expect(page.getByRole("img")).toHaveCount(0);
});

test("a reaction button shows a focus ring", async ({ page }) => {
  await gotoStory(page, story("interactive-reactions"));
  const button = page.getByRole("button", { name: "Like, 2 reactions" });
  await button.focus();
  expect(
    await button.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

test("reactions overlap the bottom edge or the top edge of the body", async ({
  page,
}) => {
  await gotoStory(page, story("reactions"));
  const bubbles = page.locator("pl-bubble");
  const edge = async (i: number) => {
    const b = await box(body(bubbles.nth(i)));
    const r = await box(bubbles.nth(i).locator("pl-bubble-reactions"));
    return { b, r };
  };
  // 0: bottom, 1: top, 2: top, 3: bottom.
  for (const i of [0, 3]) {
    const { b, r } = await edge(i);
    expect(r.y).toBeLessThan(b.y + b.height);
    expect(r.y + r.height).toBeGreaterThan(b.y + b.height);
  }
  for (const i of [1, 2]) {
    const { b, r } = await edge(i);
    expect(r.y).toBeLessThan(b.y);
    expect(r.y + r.height).toBeGreaterThan(b.y);
  }
});

test("reactions sit at the start or the end of the edge", async ({ page }) => {
  await gotoStory(page, story("reactions"));
  const bubbles = page.locator("pl-bubble");
  const sides = async (i: number) => {
    const b = await box(body(bubbles.nth(i)));
    const r = await box(bubbles.nth(i).locator("pl-bubble-reactions"));
    return { b, r };
  };
  // 0: end, 1: start, 2: end, 3: start.
  for (const i of [0, 2]) {
    const { b, r } = await sides(i);
    expect(b.x + b.width - (r.x + r.width)).toBeLessThan(2);
  }
  for (const i of [1, 3]) {
    const { b, r } = await sides(i);
    expect(r.x - b.x).toBeLessThan(2);
  }
});

test("a group names itself and tightens the corners that touch", async ({
  page,
}) => {
  await gotoStory(page, story("group"));
  await expect(page.getByRole("group", { name: "You" })).toHaveCount(1);
  const radii = await page.locator("pl-bubble").evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el.shadowRoot!.querySelector("[part=body]")!);
      return [s.borderStartEndRadius, s.borderEndEndRadius].map((r) =>
        parseFloat(r),
      );
    }),
  );
  const [first, middle, last] = radii as [number[], number[], number[]];
  // Start-end then end-end, per bubble.
  expect(first[0]).toBeGreaterThan(first[1]!);
  expect(middle[0]).toBeLessThan(first[0]!);
  expect(middle[1]).toBe(middle[0]);
  expect(last[0]).toBeLessThan(first[0]!);
  expect(last[1]).toBeGreaterThan(last[0]!);
});

test("a bubble holds slotted block content and removes its edge margins", async ({
  page,
}) => {
  await gotoStory(page, story("assistant"));
  await expect(page.getByRole("list")).toHaveCount(1);
  const margin = await page
    .locator("pl-bubble p")
    .evaluate((el) => getComputedStyle(el).marginBlockStart);
  expect(margin).toBe("0px");
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  for (const id of ["long-text", "reactions", "variants", "group"]) {
    await expectNoOverflowAtTextZoom(await gotoStory(page, story(id)));
  }
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("a link, a button and a reaction button are at least 44 by 44", async ({
    page,
  }) => {
    await gotoStory(page, story("controls"));
    for (const role of ["link", "button"] as const) {
      const b = await box(page.getByRole(role));
      expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
    await gotoStory(page, story("interactive-reactions"));
    for (const button of await page.getByRole("button").all()) {
      const b = await box(button);
      expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
  });
});
