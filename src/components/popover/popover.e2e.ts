import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-popover--${name}`;

const trigger = (page: Page, scope = "") =>
  page.locator(`${scope} purr-button[slot=trigger]`.trim());
const dialog = (page: Page, name = "Sharing") =>
  page.getByRole("dialog", { name });
const inside = (page: Page) =>
  page.getByRole("button", { name: "Copy link", exact: true });

test("aria snapshot, closed and open", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - button "Show popover" [expanded=false]
  `);
  await trigger(page).click();
  await expect(root).toMatchAriaSnapshot(`
    - button "Show popover" [expanded]
    - dialog "Sharing":
      - strong: Sharing
      - paragraph: Anyone with the link can view.
      - button "Copy link"
  `);
});

test("the trigger is marked as opening a dialog", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(trigger(page)).toHaveAttribute("aria-haspopup", "dialog");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
});

test("a press opens the panel, moves focus inside, and a second press closes it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(dialog(page)).toBeHidden();
  await trigger(page).click();
  await expect(dialog(page)).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await expect(inside(page)).toBeFocused();
  await trigger(page).click();
  await expect(dialog(page)).toBeHidden();
});

test("Enter and Space on the trigger open it", async ({ page }) => {
  await gotoStory(page, story("default"));
  for (const key of ["Enter", "Space"]) {
    await trigger(page).focus();
    await page.keyboard.press(key);
    await expect(dialog(page)).toBeVisible();
    await expect(inside(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
  }
});

test("Escape closes the panel and focus returns to the trigger", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  await expect(inside(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("a panel without focusable content takes focus itself", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.locator("#popover").evaluate((el) => {
    el.querySelector("purr-button:not([slot])")!.remove();
  });
  await trigger(page).click();
  await expect(dialog(page)).toBeFocused();
});

test("a press outside closes the panel", async ({ page }) => {
  await gotoStory(page, story("open"));
  await page.mouse.click(5, 5);
  await expect(dialog(page)).toBeHidden();
});

test("a press inside the panel keeps it open", async ({ page }) => {
  await gotoStory(page, story("open"));
  await page.getByText("Anyone with the link").click();
  await expect(dialog(page)).toBeVisible();
});

test("Tab out of the panel closes it and moves on", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const next = document.createElement("input");
    next.id = "next";
    document.querySelector("purr-popover")!.after(next);
  });
  await trigger(page).click();
  await expect(inside(page)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog(page)).toBeHidden();
  await expect(page.locator("#next")).toBeFocused();
});

test("focus moving elsewhere closes the panel", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const other = document.createElement("input");
    other.id = "other";
    document.body.append(other);
  });
  await trigger(page).click();
  await page.locator("#other").focus();
  await expect(dialog(page)).toBeHidden();
  await expect(page.locator("#other")).toBeFocused();
});

test("open, show() and hide() work from script and purr-toggle reports them", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const log = await page.locator("#popover").evaluate(async (el) => {
    const popover = el as HTMLElement & {
      show(): void;
      hide(): void;
      open: boolean;
      updateComplete: Promise<boolean>;
    };
    const seen: boolean[] = [];
    popover.addEventListener("purr-toggle", (e) =>
      seen.push((e as CustomEvent<{ open: boolean }>).detail.open),
    );
    popover.show();
    await popover.updateComplete;
    const afterShow = popover.open;
    popover.hide();
    await popover.updateComplete;
    popover.open = true;
    await popover.updateComplete;
    return { seen, afterShow };
  });
  expect(log).toEqual({ seen: [true, false, true], afterShow: true });
  await expect(dialog(page)).toBeVisible();
});

test("a popover with no label fails axe", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.locator("#popover").evaluate((el) => el.removeAttribute("label"));
  await trigger(page).click();
  const panel = page.locator("#popover [part=panel]");
  await expect(panel).toBeVisible();
  await expect(panel).not.toHaveAttribute("aria-label", /.+/);
  await expect(panel).toHaveCSS("opacity", "1");
  // axe files this rule under best practice, which expectAccessible's WCAG tags leave out.
  await expect
    .poll(async () => {
      const result = await new AxeBuilder({ page })
        .include("#storybook-root")
        .withRules(["aria-dialog-name"])
        .analyze()
        .catch(() => undefined);
      return result?.violations.map((v) => v.id);
    })
    .toEqual(["aria-dialog-name"]);
});

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

test("the arrow is on the side facing the trigger and points at its middle, on every side", async ({
  page,
}) => {
  await gotoStory(page, story("placements"));
  for (const side of ["top", "bottom", "start", "end"]) {
    const panel = await box(page.locator(`#${side} [part=panel]`));
    const arrow = await box(page.locator(`#${side} [part=arrow]`));
    const target = centre(await box(trigger(page, `#${side}`)));
    const middle = centre(arrow);
    const touching = 3;
    if (side === "top" || side === "bottom") {
      expect(Math.abs(middle.x - target.x)).toBeLessThan(1);
    } else {
      expect(Math.abs(middle.y - target.y)).toBeLessThan(1);
    }
    if (side === "bottom") {
      expect(arrow.y).toBeLessThan(panel.y);
      expect(arrow.y + arrow.height - panel.y).toBeLessThan(touching);
    } else if (side === "top") {
      expect(arrow.y + arrow.height).toBeGreaterThan(panel.y + panel.height);
      expect(panel.y + panel.height - arrow.y).toBeLessThan(touching);
    } else if (side === "end") {
      expect(arrow.x).toBeLessThan(panel.x);
      expect(arrow.x + arrow.width - panel.x).toBeLessThan(touching);
    } else {
      expect(arrow.x + arrow.width).toBeGreaterThan(panel.x + panel.width);
      expect(panel.x + panel.width - arrow.x).toBeLessThan(touching);
    }
  }
});

test("the panel opens beside the trigger on the requested side", async ({
  page,
}) => {
  await gotoStory(page, story("placements"));
  const around = async (id: string) => ({
    panel: await box(page.locator(`#${id} [part=panel]`)),
    target: await box(trigger(page, `#${id}`)),
  });
  const top = await around("top");
  expect(top.panel.y + top.panel.height).toBeLessThanOrEqual(top.target.y);
  const bottom = await around("bottom");
  expect(bottom.panel.y).toBeGreaterThanOrEqual(
    bottom.target.y + bottom.target.height,
  );
  const start = await around("start");
  expect(start.panel.x + start.panel.width).toBeLessThanOrEqual(start.target.x);
  const end = await around("end");
  expect(end.panel.x).toBeGreaterThanOrEqual(end.target.x + end.target.width);
});

test("under rtl start is the right-hand side and the arrow still points at the trigger", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const panel = await box(page.locator("#popover [part=panel]"));
  const arrow = await box(page.locator("#popover [part=arrow]"));
  const target = await box(trigger(page));
  expect(panel.x).toBeGreaterThanOrEqual(target.x + target.width);
  expect(arrow.x).toBeLessThan(panel.x);
  expect(Math.abs(centre(arrow).y - centre(target).y)).toBeLessThan(1);
});

test("the arrow and the panel share one fill and one edge", async ({
  page,
}) => {
  await gotoStory(page, story("glass"));
  const colors = await page.locator("#popover").evaluate((el) => {
    const panel = el.shadowRoot!.querySelector("[part=panel]")!;
    const arrow = el.shadowRoot!.querySelector("[part=arrow]")!;
    return {
      fill: [
        getComputedStyle(panel).backgroundColor,
        getComputedStyle(arrow).fill,
      ],
      edge: getComputedStyle(arrow).stroke,
    };
  });
  expect(colors.fill[1]).toBe(colors.fill[0]);
  expect(colors.edge).not.toBe("none");
});

test("the panel and the arrow take the panel material, opaque in the default light look", async ({
  page,
}) => {
  await gotoStory(page, story("open"), "theme:light");
  const fills = await page.locator("#popover").evaluate((el) => {
    const root = el.shadowRoot!;
    const probe = document.createElement("div");
    probe.style.background = "var(--purr-material-panel)";
    root.append(probe);
    const material = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      material,
      panel: getComputedStyle(root.querySelector("[part=panel]")!)
        .backgroundColor,
      arrow: getComputedStyle(root.querySelector("[part=arrow]")!).fill,
    };
  });
  expect(fills.panel).toBe(fills.material);
  expect(fills.arrow).toBe(fills.material);
});

test("the arrow's edge is not clipped at its tip", async ({ page }) => {
  await gotoStory(page, story("open"));
  await expect(page.locator("#popover [part=arrow]")).toHaveCSS(
    "overflow",
    "visible",
  );
});

test("long unbroken content wraps inside the panel", async ({ page }) => {
  await gotoStory(page, story("open"));
  const fits = await page.locator("#popover").evaluate(async (el) => {
    const long = document.createElement("p");
    long.textContent = "x".repeat(120);
    el.append(long);
    const panel = el.shadowRoot!.querySelector("[part=panel]")!;
    return panel.scrollWidth <= panel.clientWidth;
  });
  expect(fits).toBe(true);
});

test("hide() or open=false while focus is inside returns focus to the trigger", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  await expect(inside(page)).toBeFocused();
  await page
    .locator("#popover")
    .evaluate((el) => (el as HTMLElement & { hide(): void }).hide());
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await trigger(page).click();
  await expect(inside(page)).toBeFocused();
  await page.locator("#popover").evaluate((el) => {
    (el as HTMLElement & { open: boolean }).open = false;
  });
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("changing placement while open moves the panel", async ({ page }) => {
  await gotoStory(page, story("open"));
  await page.locator("#popover").evaluate((el) => {
    el.setAttribute("placement", "top");
  });
  await expect
    .poll(async () => {
      const panel = await box(dialog(page));
      const target = await box(trigger(page));
      return panel.y + panel.height <= target.y;
    })
    .toBe(true);
});

test("a popover moved in the DOM while open keeps showing its panel", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  await page.locator("#popover").evaluate((el) => document.body.append(el));
  await expect(dialog(page)).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
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
      test(`the panel stays inside the viewport at the ${name}, placement ${placement}`, async ({
        page,
      }) => {
        await gotoStory(page, story("default"));
        await page.locator("#popover").evaluate(
          (el, args) => {
            el.setAttribute("placement", args.placement);
            el.setAttribute("style", `position:fixed;${args.inset}`);
          },
          { placement, inset },
        );
        await trigger(page).click();
        const panel = await box(dialog(page));
        expect(panel.x).toBeGreaterThanOrEqual(0);
        expect(panel.y).toBeGreaterThanOrEqual(0);
        expect(panel.x + panel.width).toBeLessThanOrEqual(800);
        expect(panel.y + panel.height).toBeLessThanOrEqual(400);
      });
    }
  }

  test("a panel that has no room below flips above the trigger", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    await page
      .locator("#popover")
      .evaluate((el) =>
        el.setAttribute("style", "position:fixed;bottom:10px;left:10px"),
      );
    await trigger(page).click();
    const panel = await box(dialog(page));
    const target = await box(trigger(page));
    expect(panel.y + panel.height).toBeLessThanOrEqual(target.y);
    await expect(page.locator("#popover [part=panel]")).toHaveAttribute(
      "data-side",
      "top",
    );
  });
});

test("the panel follows the trigger when the page scrolls", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    document.body.style.minBlockSize = "3000px";
  });
  await trigger(page).click();
  const before = await box(dialog(page));
  await page.evaluate(() => scrollBy(0, 50));
  await expect
    .poll(async () => (await box(dialog(page))).y)
    .toBeCloseTo(before.y - 50, 0);
});

test("the focus ring shows under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.locator("#popover").evaluate((el) => {
    el.querySelector("purr-button:not([slot])")!.remove();
  });
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeFocused();
  expect(
    await page
      .locator("#popover [part=panel]")
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
  expect(
    await page
      .locator("#popover [part=panel]")
      .evaluate((el) => getComputedStyle(el).borderTopWidth),
  ).not.toBe("0px");
});

for (const name of ["default", "open", "placements", "rtl", "glass"]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("open")));
});

test("virtual screen reader speaks the trigger and the dialog's content", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Show popover");
  expect(spoken).toContain("Anyone with the link can view.");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the trigger and the controls in the panel are at least 44 by 44", async ({
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

forEachViewport(({ name }) => {
  for (const id of ["default", "open", "placements", "glass"]) {
    test(`screenshot of ${id} at ${name}`, async ({ page }) => {
      const root = await gotoStory(page, story(id));
      await expect(root).toHaveScreenshot(`${id}-${name}.png`);
    });
  }
});
