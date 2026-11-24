import { expect, test, type Page } from "@playwright/test";
import {
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `dialogs-tooltip--${name}`;

const target = (page: Page, scope = "") =>
  page.locator(`${scope} pl-button`.trim());
const bubble = (page: Page, scope = "") =>
  page.locator(`${scope} [part=bubble]`.trim());
const face = (page: Page, scope = "") =>
  page.locator(`${scope} [part=face]`.trim());
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
  const ids = await page.locator("pl-tooltip").evaluate(async (el) => {
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

test("the hover delay stays under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("default"));
  await target(page).hover();
  await expect(bubble(page)).toBeHidden();
  await expect(bubble(page)).toBeVisible();
});

test("the face takes the panel material, opaque in the default light look", async ({
  page,
}) => {
  await gotoStory(page, story("open"), "theme:light");
  const fills = await page.locator("pl-tooltip").evaluate((el) => {
    const root = el.shadowRoot!;
    const probe = document.createElement("div");
    probe.style.background = "var(--pl-material-panel)";
    root.append(probe);
    const material = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return [
      material,
      getComputedStyle(root.querySelector("[part=face]")!).backgroundColor,
    ];
  });
  expect(fills[1]).toBe(fills[0]);
});

test("long unbroken text wraps inside the face", async ({ page }) => {
  await gotoStory(page, story("open"));
  const fits = await page.locator("pl-tooltip").evaluate(async (el) => {
    const tooltip = el as HTMLElement & {
      text: string;
      updateComplete: Promise<boolean>;
    };
    tooltip.text = "x".repeat(400);
    await tooltip.updateComplete;
    const face = el.shadowRoot!.querySelector("[part=face]")!;
    return face.scrollWidth <= face.clientWidth;
  });
  expect(fits).toBe(true);
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
  browserName,
}) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const seen: string[] = [];
    (window as never as { seen: string[] }).seen = seen;
    for (const type of ["pointerup", "click"]) {
      document
        .querySelector("pl-button")!
        .addEventListener(type, () => seen.push(type));
    }
  });
  await target(page).tap();
  await page.waitForTimeout(900);
  await expect(bubble(page)).toBeHidden();
  const seen = await page.evaluate(
    () => (window as never as { seen: string[] }).seen,
  );
  // Playwright's Firefox delivers the touch as pointer events but synthesizes no click from it.
  expect(seen).toEqual(
    browserName === "firefox" ? ["pointerup"] : ["pointerup", "click"],
  );
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

test("placements: four tooltips are visible", async ({ page }) => {
  await gotoStory(page, story("placements"));
  for (const side of ["top", "bottom", "start", "end"]) {
    await expect(bubble(page, `#${side}`)).toBeVisible();
  }
});

test("the placements put the bubble on the requested side of the target", async ({
  page,
}) => {
  await gotoStory(page, story("placements"));
  for (const side of ["top", "bottom", "start", "end"]) {
    await expect(bubble(page, `#${side}`)).toBeVisible();
    const b = await box(bubble(page, `#${side}`));
    const t = await box(target(page, `#${side}`));
    if (side === "top") expect(b.y + b.height).toBeLessThanOrEqual(t.y);
    if (side === "bottom") expect(b.y).toBeGreaterThanOrEqual(t.y + t.height);
    if (side === "start") expect(b.x + b.width).toBeLessThanOrEqual(t.x);
    if (side === "end") expect(b.x).toBeGreaterThanOrEqual(t.x + t.width);
  }
});

test("changing placement while shown moves the bubble", async ({ page }) => {
  await gotoStory(page, story("open"));
  await expect(bubble(page)).toBeVisible();
  await page.locator("pl-tooltip").evaluate((el) => {
    el.setAttribute("placement", "top");
  });
  await expect
    .poll(async () => {
      const b = await box(bubble(page));
      const t = await box(target(page));
      return b.y + b.height <= t.y;
    })
    .toBe(true);
});

test("under rtl start is the right-hand side", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const b = await box(bubble(page));
  const t = await box(target(page));
  // Layout snaps to fractions of a pixel, and Firefox rounds the two boxes differently.
  expect(b.x).toBeGreaterThanOrEqual(t.x + t.width - 0.01);
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
        await page.locator("pl-tooltip").evaluate(
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
      .locator("pl-tooltip")
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

test("rich content in the content slot is the tooltip the target is described by", async ({
  page,
}) => {
  await gotoStory(page, story("rich"));
  await expect(bubble(page)).toBeVisible();
  const described = await target(page).evaluate((el) => {
    const named = document.getElementById(el.getAttribute("aria-describedby")!);
    return { role: named?.role, tag: named?.tagName, slot: named?.slot };
  });
  expect(described).toEqual({ role: "tooltip", tag: "DIV", slot: "content" });
  await expect(page.getByRole("tooltip")).toHaveCount(1);
  await expect(page.locator("[slot=content] dt").first()).toBeVisible();
});

test("the browser exposes the rich content as the target's accessible description", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Reads Chromium's accessibility tree.");
  await gotoStory(page, story("rich"));
  const session = await page.context().newCDPSession(page);
  const { nodes } = await session.send("Accessibility.getFullAXTree");
  const node = nodes.find(
    (n) => n.role?.value === "button" && n.name?.value === "Shortcuts",
  );
  expect(node?.description?.value).toContain("Copy");
  expect(node?.description?.value).toContain("Cmd V");
});

test("removing the rich content brings the text back as the description", async ({
  page,
}) => {
  await gotoStory(page, story("rich"));
  const described = await page.locator("pl-tooltip").evaluate(async (el) => {
    const tooltip = el as HTMLElement & { text: string };
    tooltip.text = "Plain text";
    el.querySelector("[slot=content]")!.remove();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const button = el.querySelector("pl-button")!;
    const ids = button.getAttribute("aria-describedby")!.split(" ");
    const named = document.getElementById(ids[0]!);
    return { count: ids.length, role: named?.role, text: named?.textContent };
  });
  expect(described).toEqual({ count: 1, role: "tooltip", text: "Plain text" });
});

test("a long tooltip wraps at the cap instead of running on in one line", async ({
  page,
}) => {
  await gotoStory(page, story("long-text"));
  await expect(bubble(page)).toBeVisible();
  const sizes = await page.locator("pl-tooltip").evaluate((el) => {
    const face = el.shadowRoot!.querySelector("[part=face]")!;
    const probe = document.createElement("div");
    probe.style.inlineSize = "calc(var(--pl-spacing) * 60)";
    document.body.append(probe);
    const cap = probe.getBoundingClientRect().width;
    probe.remove();
    const line = parseFloat(getComputedStyle(face).lineHeight);
    return {
      cap,
      width: face.getBoundingClientRect().width,
      height: face.getBoundingClientRect().height,
      line,
    };
  });
  expect(sizes.width).toBeLessThanOrEqual(sizes.cap + 0.5);
  expect(sizes.height).toBeGreaterThan(sizes.line * 2);
});

test("--pl-tooltip-max-inline-size sets the widest bubble", async ({
  page,
}) => {
  await gotoStory(page, story("long-text"));
  await page.locator("pl-tooltip").evaluate((el) => {
    el.style.setProperty("--pl-tooltip-max-inline-size", "120px");
  });
  await expect(bubble(page)).toBeVisible();
  await expect
    .poll(async () => (await box(bubble(page))).width)
    .toBeLessThanOrEqual(120.5);
});

test("--pl-tooltip-open-delay sets how long a hover waits", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const fallback = await page
    .locator("pl-tooltip")
    .evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--pl-tooltip-open-delay").trim(),
    );
  expect(fallback).toBe("560ms");
  await page.locator("pl-tooltip").evaluate((el) => {
    el.style.setProperty("--pl-tooltip-open-delay", "1500ms");
  });
  await target(page).hover();
  await page.waitForTimeout(900);
  await expect(bubble(page)).toBeHidden();
  await expect(bubble(page)).toBeVisible({ timeout: 3000 });
});

test("align start and end line the bubble's edge up with the target's, center its middle", async ({
  page,
}) => {
  await gotoStory(page, story("align"));
  for (const align of ["center", "start", "end"]) {
    await expect(bubble(page, `#${align}`)).toBeVisible();
    const b = await box(face(page, `#${align}`));
    const t = await box(target(page, `#${align}`));
    if (align === "start") expect(Math.abs(b.x - t.x)).toBeLessThan(1.5);
    if (align === "end") {
      expect(Math.abs(b.x + b.width - (t.x + t.width))).toBeLessThan(1.5);
    }
    if (align === "center") {
      expect(Math.abs(b.x + b.width / 2 - (t.x + t.width / 2))).toBeLessThan(
        1.5,
      );
    }
  }
});

test("under rtl align start is the right-hand edge", async ({ page }) => {
  await gotoStory(page, story("align-rtl"));
  await expect(bubble(page)).toBeVisible();
  const b = await box(face(page));
  const t = await box(target(page));
  expect(Math.abs(b.x + b.width - (t.x + t.width))).toBeLessThan(1.5);
});

test("align has no effect beside the target", async ({ page }) => {
  await gotoStory(page, story("open"));
  await expect(bubble(page)).toBeVisible();
  await page.locator("pl-tooltip").evaluate((el) => {
    el.setAttribute("placement", "end");
    el.setAttribute("align", "start");
  });
  await expect
    .poll(async () => {
      const b = await box(bubble(page));
      const t = await box(target(page));
      return (
        b.x >= t.x + t.width - 0.5 &&
        Math.abs(b.y + b.height / 2 - (t.y + t.height / 2)) < 1.5
      );
    })
    .toBe(true);
});
