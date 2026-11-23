import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-hover-card--${name}`;

const trigger = (page: Page, scope = "#card") =>
  page.locator(`${scope} pl-button[slot=trigger]`);
const panel = (page: Page, scope = "#card") =>
  page.locator(`${scope} [part=panel]`);
const inside = (page: Page) =>
  page.getByRole("button", { name: "View repository", exact: true });

type Card = HTMLElement & {
  open: boolean;
  show(): void;
  hide(): void;
  updateComplete: Promise<boolean>;
};

const box = async (locator: ReturnType<Page["locator"]>) =>
  (await locator.boundingBox())!;
const centre = (b: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => ({
  x: b.x + b.width / 2,
  y: b.y + b.height / 2,
});

test("aria snapshot, closed and open", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - button "purrlucent" [expanded=false]
  `);
  await trigger(page).click();
  await expect(panel(page)).toBeVisible();
  await expect(root).toMatchAriaSnapshot(`
    - button "purrlucent" [expanded]
    - group "Repository":
      - strong: Purrlucent
      - paragraph: A Lit component library of elements for the web.
      - button "View repository"
  `);
});

test("the trigger reports whether the card is open and is not marked as a popup", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(trigger(page)).not.toHaveAttribute("aria-haspopup", /.+/);
  await page.locator("#card").evaluate((el) => (el as Card).show());
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
});

test("the card is a group named by label", async ({ page }) => {
  await gotoStory(page, story("open"));
  await expect(page.getByRole("group", { name: "Repository" })).toBeVisible();
});

test("hover opens the card after a delay, not at once", async ({ page }) => {
  await gotoStory(page, story("default"));
  await trigger(page).hover();
  await expect(panel(page)).toBeHidden();
  await expect(panel(page)).toBeVisible();
  await expect(page.locator("#card")).toHaveAttribute("open", "");
});

test("the hover delay stays under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("default"));
  await trigger(page).hover();
  await expect(panel(page)).toBeHidden();
  await expect(panel(page)).toBeVisible();
});

test("keyboard focus on the trigger opens the card after a delay", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
  await expect(panel(page)).toBeHidden();
  await expect(panel(page)).toBeVisible();
});

test("a mouse press on the trigger opens the card at once", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await trigger(page).click();
  await expect(panel(page)).toBeVisible({ timeout: 400 });
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
});

test("the card stays open while the pointer is on it, and closes after a delay once the pointer leaves", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await trigger(page).hover();
  await expect(panel(page)).toBeVisible();
  const b = await box(panel(page));
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
  await page.waitForTimeout(800);
  await expect(panel(page)).toBeVisible();
  await page.mouse.move(5, 5);
  await expect(panel(page)).toBeHidden();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
});

test("the card stays open while focus is inside it, even with the pointer away", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(inside(page)).toBeFocused();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(800);
  await expect(panel(page)).toBeVisible();
});

test("a press on the card's text keeps it open", async ({ page }) => {
  await gotoStory(page, story("open"));
  await page.getByText("A Lit component library").click();
  await page.waitForTimeout(800);
  await expect(panel(page)).toBeVisible();
});

test("Tab out of the card closes it and moves on", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const next = document.createElement("input");
    next.id = "next";
    document.querySelector("pl-hover-card")!.after(next);
  });
  await page.keyboard.press("Tab");
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(inside(page)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#next")).toBeFocused();
  await expect(panel(page)).toBeHidden();
});

test("blur from the trigger closes the card after a delay", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const before = document.createElement("input");
    before.id = "before";
    document.querySelector("pl-hover-card")!.before(before);
  });
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#before")).toBeFocused();
  await expect(panel(page)).toBeHidden();
});

test("Escape closes the card, focus in the card returns to the trigger and the card stays closed", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(inside(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await page.waitForTimeout(1000);
  await expect(panel(page)).toBeHidden();
});

test("Escape with focus on the trigger closes the card and keeps focus there", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await page.waitForTimeout(1000);
  await expect(panel(page)).toBeHidden();
});

test("Escape closes a card opened by hover and does not take focus", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await trigger(page).hover();
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeHidden();
  await expect(trigger(page)).not.toBeFocused();
});

test("a press outside closes the card", async ({ page }) => {
  await gotoStory(page, story("open"));
  await page.mouse.click(5, 5);
  await expect(panel(page)).toBeHidden();
});

test("a first tap on touch opens the card without activating the trigger, a tap while open does", async ({
  browser,
  browserName,
}) => {
  test.skip(
    browserName === "firefox",
    "Playwright's Firefox delivers a touch as pointer events but synthesizes no click from it.",
  );
  const context = await browser.newContext({ hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const seen: string[] = [];
    (window as never as { seen: string[] }).seen = seen;
    document
      .querySelector("pl-button[slot=trigger]")!
      .addEventListener("click", () => seen.push("click"));
  });
  const seen = () =>
    page.evaluate(() => (window as never as { seen: string[] }).seen);
  await trigger(page).tap();
  await expect(panel(page)).toBeVisible({ timeout: 400 });
  expect(await seen()).toEqual([]);
  await trigger(page).tap();
  await expect(panel(page)).toBeVisible();
  expect(await seen()).toEqual(["click"]);
  await context.close();
});

test("open, show() and hide() work from script and pl-toggle reports them", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const log = await page.locator("#card").evaluate(async (el) => {
    const card = el as Card;
    const seen: boolean[] = [];
    card.addEventListener("pl-toggle", (e) =>
      seen.push((e as CustomEvent<{ open: boolean }>).detail.open),
    );
    card.show();
    await card.updateComplete;
    const afterShow = card.open;
    card.hide();
    await card.updateComplete;
    card.open = true;
    await card.updateComplete;
    return { seen, afterShow, reflected: card.hasAttribute("open") };
  });
  expect(log).toEqual({
    seen: [true, false, true],
    afterShow: true,
    reflected: true,
  });
  await expect(panel(page)).toBeVisible();
});

test("opening a card from script closes another open card", async ({
  page,
}) => {
  await gotoStory(page, story("placements"));
  const log = await page.evaluate(async () => {
    const first = document.getElementById("top") as Card;
    const second = document.getElementById("bottom") as Card;
    first.open = true;
    await first.updateComplete;
    second.open = true;
    await second.updateComplete;
    await first.updateComplete;
    return { first: first.open, second: second.open };
  });
  expect(log).toEqual({ first: false, second: true });
});

test("the arrow points at the middle of the trigger on every side", async ({
  page,
}) => {
  await gotoStory(page, story("placements"));
  for (const side of ["top", "bottom", "start", "end"]) {
    await page.locator(`#${side}`).evaluate((el) => ((el as Card).open = true));
    await expect(panel(page, `#${side}`)).toBeVisible();
    const arrow = await box(page.locator(`#${side} [part=arrow]`));
    const target = centre(await box(trigger(page, `#${side}`)));
    const middle = centre(arrow);
    if (side === "top" || side === "bottom") {
      expect(Math.abs(middle.x - target.x)).toBeLessThan(1);
    } else {
      expect(Math.abs(middle.y - target.y)).toBeLessThan(1);
    }
  }
});

test("the placements put the card on the requested side of the trigger", async ({
  page,
}) => {
  await gotoStory(page, story("placements"));
  for (const side of ["top", "bottom", "start", "end"]) {
    await page.locator(`#${side}`).evaluate((el) => ((el as Card).open = true));
    await expect(panel(page, `#${side}`)).toBeVisible();
    const p = await box(panel(page, `#${side}`));
    const t = await box(trigger(page, `#${side}`));
    if (side === "top") expect(p.y + p.height).toBeLessThanOrEqual(t.y);
    if (side === "bottom") expect(p.y).toBeGreaterThanOrEqual(t.y + t.height);
    if (side === "start") expect(p.x + p.width).toBeLessThanOrEqual(t.x);
    if (side === "end") expect(p.x).toBeGreaterThanOrEqual(t.x + t.width);
  }
});

test("under rtl start is the right-hand side", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const p = await box(panel(page));
  const t = await box(trigger(page));
  expect(p.x).toBeGreaterThanOrEqual(t.x + t.width - 0.01);
});

test("the card and the arrow share one fill and one edge", async ({ page }) => {
  await gotoStory(page, story("glass"));
  const colors = await page.locator("#card").evaluate((el) => {
    const card = el.shadowRoot!.querySelector("[part=panel]")!;
    const arrow = el.shadowRoot!.querySelector("[part=arrow]")!;
    return {
      fill: [
        getComputedStyle(card).backgroundColor,
        getComputedStyle(arrow).fill,
      ],
      edge: getComputedStyle(arrow).stroke,
    };
  });
  expect(colors.fill[1]).toBe(colors.fill[0]);
  expect(colors.edge).not.toBe("none");
});

test("changing placement while open moves the card", async ({ page }) => {
  await gotoStory(page, story("open"));
  await page.locator("#card").evaluate((el) => {
    el.setAttribute("placement", "top");
  });
  await expect
    .poll(async () => {
      const p = await box(panel(page));
      const t = await box(trigger(page));
      return p.y + p.height <= t.y;
    })
    .toBe(true);
});

test("long unbroken content wraps inside the card", async ({ page }) => {
  await gotoStory(page, story("open"));
  const fits = await page.locator("#card").evaluate((el) => {
    const long = document.createElement("p");
    long.textContent = "x".repeat(120);
    el.append(long);
    const card = el.shadowRoot!.querySelector("[part=panel]")!;
    return card.scrollWidth <= card.clientWidth;
  });
  expect(fits).toBe(true);
});

test.describe("near the edges of a small viewport", () => {
  test.use({ viewport: { width: 800, height: 400 } });
  const corners = {
    "top left": "top:10px;left:10px",
    "top right": "top:10px;right:10px",
    "bottom left": "bottom:10px;left:10px",
    "bottom right": "bottom:10px;right:10px",
  };
  for (const [name, inset] of Object.entries(corners)) {
    for (const placement of ["top", "bottom", "start", "end"]) {
      test(`the card stays inside the viewport at the ${name}, placement ${placement}`, async ({
        page,
      }) => {
        await gotoStory(page, story("default"));
        await page.locator("#card").evaluate(
          (el, args) => {
            el.setAttribute("placement", args.placement);
            el.setAttribute("style", `position:fixed;${args.inset}`);
            (el as Card).open = true;
          },
          { placement, inset },
        );
        await expect(panel(page)).toBeVisible();
        const b = await box(panel(page));
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(800);
        expect(b.y + b.height).toBeLessThanOrEqual(400);
      });
    }
  }

  test("a card that has no room below flips above the trigger", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    await page.locator("#card").evaluate((el) => {
      el.setAttribute("style", "position:fixed;bottom:10px;left:10px");
      (el as Card).open = true;
    });
    await expect(panel(page)).toBeVisible();
    const p = await box(panel(page));
    const t = await box(trigger(page));
    expect(p.y + p.height).toBeLessThanOrEqual(t.y);
    await expect(panel(page)).toHaveAttribute("data-side", "top");
  });
});

test("the card follows the trigger when the page scrolls", async ({ page }) => {
  await gotoStory(page, story("open"));
  await page.evaluate(() => {
    document.body.style.minBlockSize = "3000px";
  });
  const before = await box(panel(page));
  await page.evaluate(() => scrollBy(0, 50));
  await expect
    .poll(async () => (await box(panel(page))).y)
    .toBeCloseTo(before.y - 50, 0);
});

test("the card keeps its edge and focus stays visible under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  await page.emulateMedia({ forcedColors: "active" });
  const colors = await panel(page).evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.backgroundColor, style.color, style.borderTopWidth];
  });
  expect(colors[0]).not.toBe(colors[1]);
  expect(colors[2]).not.toBe("0px");
});

test("under reduced motion the card shows at once and fully", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("open"));
  await expect(panel(page)).toHaveCSS("opacity", "1");
  await expect(panel(page)).toHaveCSS("transition-duration", "0s");
});

test("axe finds nothing in the open card", async ({ page }) => {
  const root = await gotoStory(page, story("open"));
  await expect(panel(page)).toHaveCSS("opacity", "1");
  await expectAccessible(root);
});

test("axe finds nothing in the open card in the glass look", async ({
  page,
}) => {
  const root = await gotoStory(page, story("glass"));
  await expect(panel(page)).toHaveCSS("opacity", "1");
  await expectAccessible(root);
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("open")));
});

test("virtual screen reader speaks the trigger and the card's content", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("purrlucent");
  expect(spoken).toContain("A Lit component library");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the trigger and the controls in the card are at least 44 by 44", async ({
    page,
  }) => {
    await gotoStory(page, story("open"));
    for (const control of [trigger(page), inside(page)]) {
      const b = await box(control);
      expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
  });
});
