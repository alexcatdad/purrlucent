import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-tooltip--${name}`;

const target = (page: Page, scope = "") =>
  page.locator(`${scope} purr-button`.trim());
const bubble = (page: Page, scope = "") =>
  page.locator(`${scope} [part=bubble]`.trim());
const box = async (locator: ReturnType<Page["locator"]>) =>
  (await locator.boundingBox())!;

test("aria snapshot: the target is described by the tooltip", async ({
  page,
}) => {
  const root = await gotoStory(page, story("open"));
  await expect(root).toMatchAriaSnapshot(`
    - button "Add"
    - tooltip "Add a new item"
  `);
});

test("the target's aria-describedby names the tooltip element", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const described = await target(page).evaluate((el) => {
    const id = el.getAttribute("aria-describedby")!;
    const named = document.getElementById(id);
    return { role: named?.role, text: named?.textContent };
  });
  expect(described).toEqual({ role: "tooltip", text: "Add a new item" });
});

test("the browser exposes the text as the target's accessible description", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Reads Chromium's accessibility tree.");
  await gotoStory(page, story("default"));
  const session = await page.context().newCDPSession(page);
  const { nodes } = await session.send("Accessibility.getFullAXTree");
  const node = nodes.find(
    (n) => n.role?.value === "button" && n.name?.value === "Add",
  );
  expect(node?.description?.value).toBe("Add a new item");
});

test("an existing description on the target is kept", async ({ page }) => {
  await gotoStory(page, story("default"));
  const ids = await page.locator("purr-tooltip").evaluate(async (el) => {
    const copy = el.cloneNode(false) as HTMLElement;
    const button = document.createElement("button");
    button.setAttribute("aria-describedby", "own");
    copy.append(button);
    document.body.append(copy);
    await new Promise((resolve) => setTimeout(resolve, 50));
    return button.getAttribute("aria-describedby")!.split(" ");
  });
  expect(ids[0]).toBe("own");
  expect(ids).toHaveLength(2);
});

test("hover shows the bubble after a delay, not at once", async ({ page }) => {
  await gotoStory(page, story("default"));
  await target(page).hover();
  await expect(bubble(page)).toBeHidden();
  await expect(bubble(page)).toBeVisible();
  await expect(page.getByRole("tooltip")).toHaveText("Add a new item");
});

test("keyboard focus shows it at once and blur hides it", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect(target(page)).toBeFocused();
  await expect(bubble(page)).toBeVisible({ timeout: 300 });
  await page.keyboard.press("Tab");
  await expect(bubble(page)).toBeHidden();
});

test("Escape hides it while the target keeps focus (dismissible)", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  await expect(bubble(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(bubble(page)).toBeHidden();
  await expect(target(page)).toBeFocused();
});

test("pointer leave hides it", async ({ page }) => {
  await gotoStory(page, story("default"));
  await target(page).hover();
  await expect(bubble(page)).toBeVisible();
  await page.mouse.move(5, 5);
  await expect(bubble(page)).toBeHidden();
});

test("a press on the target hides it", async ({ page }) => {
  await gotoStory(page, story("default"));
  await target(page).hover();
  await expect(bubble(page)).toBeVisible();
  await page.mouse.down();
  await expect(bubble(page)).toBeHidden();
  await page.mouse.up();
});

test("the bubble is hoverable and persists while the pointer is on it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await target(page).hover();
  await expect(bubble(page)).toBeVisible();
  const b = await box(bubble(page));
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
  await page.waitForTimeout(600);
  await expect(bubble(page)).toBeVisible();
  await page.mouse.move(5, 5);
  await expect(bubble(page)).toBeHidden();
});

test("a tap on touch never shows the bubble or blocks the tap", async ({
  browser,
}) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    (window as unknown as { taps: number }).taps = 0;
    document
      .querySelector("purr-button")!
      .addEventListener(
        "click",
        () => (window as never as { taps: number }).taps++,
      );
  });
  await target(page).tap();
  await page.waitForTimeout(900);
  await expect(bubble(page)).toBeHidden();
  expect(
    await page.evaluate(() => (window as never as { taps: number }).taps),
  ).toBe(1);
  await context.close();
});

test("the bubble takes no pointer events without a hover-capable pointer", async ({
  browser,
}) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await gotoStory(page, story("default"));
  expect(
    await bubble(page).evaluate((el) => getComputedStyle(el).pointerEvents),
  ).toBe("none");
  await context.close();
});

test("the placements put the bubble on the requested side of the target", async ({
  page,
}) => {
  await gotoStory(page, story("placements"));
  for (const side of ["top", "bottom", "start", "end"]) {
    await page.keyboard.press("Tab");
    await expect(bubble(page, `#${side}`)).toBeVisible();
    const b = await box(bubble(page, `#${side}`));
    const t = await box(target(page, `#${side}`));
    if (side === "top") expect(b.y + b.height).toBeLessThanOrEqual(t.y);
    if (side === "bottom") expect(b.y).toBeGreaterThanOrEqual(t.y + t.height);
    if (side === "start") expect(b.x + b.width).toBeLessThanOrEqual(t.x);
    if (side === "end") expect(b.x).toBeGreaterThanOrEqual(t.x + t.width);
  }
});

test("under rtl start is the right-hand side", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const b = await box(bubble(page));
  const t = await box(target(page));
  expect(b.x).toBeGreaterThanOrEqual(t.x + t.width);
});

test.describe("near the edges of a small viewport", () => {
  test.use({ viewport: { width: 800, height: 400 } });
  const corners = {
    "top left": "top:0;left:0",
    "top right": "top:0;right:0",
    "bottom left": "bottom:0;left:0",
    "bottom right": "bottom:0;right:0",
  };
  for (const [name, inset] of Object.entries(corners)) {
    for (const placement of ["top", "bottom", "start", "end"]) {
      test(`the bubble stays inside the viewport at the ${name}, placement ${placement}`, async ({
        page,
      }) => {
        await gotoStory(page, story("default"));
        await page.locator("purr-tooltip").evaluate(
          (el, args) => {
            el.setAttribute("placement", args.placement);
            el.setAttribute("style", `position:fixed;${args.inset}`);
          },
          { placement, inset },
        );
        await page.keyboard.press("Tab");
        await expect(bubble(page)).toBeVisible();
        const b = await box(bubble(page));
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(800);
        expect(b.y + b.height).toBeLessThanOrEqual(400);
      });
    }
  }

  test("a bubble with no room below flips above", async ({ page }) => {
    await gotoStory(page, story("default"));
    await page
      .locator("purr-tooltip")
      .evaluate((el) =>
        el.setAttribute("style", "position:fixed;bottom:0;left:40px"),
      );
    await page.keyboard.press("Tab");
    const b = await box(bubble(page));
    const t = await box(target(page));
    expect(b.y + b.height).toBeLessThanOrEqual(t.y);
  });
});

test("the bubble's colors follow forced colors", async ({ page }) => {
  await gotoStory(page, story("open"));
  await page.emulateMedia({ forcedColors: "active" });
  const colors = await page.locator("[part=face]").evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.backgroundColor, style.color, style.borderTopWidth];
  });
  expect(colors[0]).not.toBe(colors[1]);
  expect(colors[2]).not.toBe("0px");
});

for (const name of ["default", "open", "placements", "rtl", "glass"]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("open")));
});

test("virtual screen reader speaks the target", async ({ page }) => {
  await gotoStory(page, story("open"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Add");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the target stays at least 44 by 44", async ({ page }) => {
    await gotoStory(page, story("default"));
    const b = await box(target(page));
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
  });
});

forEachViewport(({ name }) => {
  for (const id of ["default", "open", "glass"]) {
    test(`screenshot of ${id} at ${name}`, async ({ page }) => {
      const root = await gotoStory(page, story(id));
      await expect(root).toHaveScreenshot(`${id}-${name}.png`);
    });
  }
});
