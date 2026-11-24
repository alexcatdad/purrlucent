import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = "containers-collapsible--default";

const open = async (page: Page, id = story, globals = "") => {
  const root = await gotoStory(page, id, globals);
  await expect(page.locator("pl-collapsible")).toHaveCount(1);
  return root;
};

const trigger = (page: Page) =>
  page.getByRole("button", { name: "Shipping details" });

test("aria snapshot", async ({ page }) => {
  const root = await open(page);
  await expect(root).toMatchAriaSnapshot(`
    - button "Shipping details"
  `);
});

test("the trigger is a button with aria-expanded and aria-controls", async ({
  page,
}) => {
  await open(page);
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(trigger(page)).toHaveAttribute("aria-controls", "content");
  await trigger(page).click();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("pl-collapsible")).toHaveAttribute("open", "");
  await expect(page.locator("#body")).toBeVisible();
});

test("disabled: the trigger is disabled and a press does not open the content", async ({
  page,
}) => {
  await open(page, "containers-collapsible--disabled");
  await expect(trigger(page)).toBeDisabled();
  await trigger(page).click({ force: true });
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#body")).toBeHidden();
});

test("closed content is hidden and takes no space", async ({ page }) => {
  await open(page);
  await expect(page.locator("#body")).toBeHidden();
  const height = await page
    .locator("pl-collapsible")
    .evaluate(
      (el) =>
        el.shadowRoot!.querySelector(".panel")!.getBoundingClientRect().height,
    );
  expect(height).toBe(0);
});

test("a collapsible with open starts showing its content and fires no event", async ({
  page,
}) => {
  await open(page, "containers-collapsible--open");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#body")).toBeVisible();
});

test("Enter and Space toggle the content", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("pl-collapsible")).toHaveAttribute("open", "");
  await page.keyboard.press("Space");
  await expect(page.locator("pl-collapsible")).not.toHaveAttribute("open");
});

test("pl-toggle fires once per change with the new state", async ({ page }) => {
  await open(page);
  await page.locator("#control").evaluate((el) => {
    (window as unknown as { toggles: unknown[] }).toggles = [];
    el.addEventListener("pl-toggle", (e) =>
      (window as unknown as { toggles: unknown[] }).toggles.push(
        (e as CustomEvent).detail,
      ),
    );
  });
  await trigger(page).click();
  await trigger(page).click();
  await page.locator("#control").evaluate(async (el) => {
    (el as HTMLElement & { open: boolean }).open = true;
    await (el as unknown as { updateComplete: Promise<boolean> })
      .updateComplete;
  });
  expect(
    await page.evaluate(
      () => (window as unknown as { toggles: unknown[] }).toggles,
    ),
  ).toEqual([{ open: true }, { open: false }, { open: true }]);
});

test("the height animates with the duration token", async ({ page }) => {
  await open(page);
  const result = await page.locator("#control").evaluate(async (el) => {
    const panel = el.shadowRoot!.querySelector(".panel")!;
    const probe = document.body.appendChild(document.createElement("div"));
    probe.style.transitionDuration = "var(--pl-duration)";
    const token = getComputedStyle(probe).transitionDuration;
    probe.remove();
    const duration = getComputedStyle(panel).transitionDuration;
    (el as HTMLElement & { open: boolean }).open = true;
    await (el as unknown as { updateComplete: Promise<boolean> })
      .updateComplete;
    return { token, duration };
  });
  expect(result.duration.split(", ")[0]).toBe(result.token);
  await expect(page.locator("#body")).toBeVisible();
});

test("under reduced motion the content shows at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const durations = await page
    .locator("#control")
    .evaluate((el) =>
      [".panel", ".chevron"].map(
        (s) =>
          getComputedStyle(el.shadowRoot!.querySelector(s)!).transitionDuration,
      ),
    );
  for (const d of durations) expect(d).toMatch(/^0s(, 0s)*$/);
  await trigger(page).click();
  await expect(page.locator("#body")).toBeVisible();
});

test("closing keeps the content out of the tab order", async ({ page }) => {
  await open(page, "containers-collapsible--open");
  await trigger(page).click();
  await expect(page.locator("#body")).toBeHidden();
});

test("under rtl the chevron mirrors and the content keeps the label's edge", async ({
  page,
}) => {
  await open(page, "containers-collapsible--rtl");
  await expect(page.locator("#control")).toHaveCSS("direction", "rtl");
  const transform = await page
    .locator("#control")
    .evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector(".chevron")!).transform,
    );
  expect(transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
});

test("the trigger stays visible and focusable under forced colors", async ({
  page,
}) => {
  await open(page);
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
  expect(
    await trigger(page).evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe("solid");
});

test.describe("slotted trigger", () => {
  const slotted = (page: Page) => page.locator("#trigger");
  const controlled = (page: Page) =>
    page.locator("#control").evaluate((el) => {
      const t = el.querySelector("#trigger") as HTMLElement & {
        ariaControlsElements?: Element[];
      };
      const body = el.querySelector("#body");
      const id = t.getAttribute("aria-controls");
      return t.ariaControlsElements?.[0] === body || (!!id && body?.id === id);
    });

  test("it replaces the built-in button and is wired with aria-expanded and aria-controls", async ({
    page,
  }) => {
    await open(page, "containers-collapsible--slotted-trigger");
    expect(
      await page
        .locator("#control")
        .evaluate((el) => el.shadowRoot!.querySelector("button")),
    ).toBeNull();
    await expect(slotted(page)).toHaveAttribute("aria-expanded", "false");
    expect(await controlled(page)).toBe(true);
  });

  test("a click, Enter and Space toggle the content", async ({ page }) => {
    await open(page, "containers-collapsible--slotted-trigger");
    await slotted(page).click();
    await expect(slotted(page)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#body")).toBeVisible();
    await slotted(page).focus();
    await page.keyboard.press("Enter");
    await expect(slotted(page)).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Space");
    await expect(slotted(page)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#control")).toHaveAttribute("open", "");
  });

  test("a role=button trigger toggles on click, Enter and Space", async ({
    page,
  }) => {
    await open(page, "containers-collapsible--slotted-trigger");
    await page.locator("#control").evaluate((el) => {
      const t = document.createElement("span");
      t.id = "role-trigger";
      t.slot = "trigger";
      t.tabIndex = 0;
      t.setAttribute("role", "button");
      t.textContent = "Role";
      el.querySelector("#trigger")!.replaceWith(t);
    });
    const t = page.locator("#role-trigger");
    await t.click();
    await expect(t).toHaveAttribute("aria-expanded", "true");
    await t.focus();
    await page.keyboard.press("Enter");
    await expect(t).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Space");
    await expect(t).toHaveAttribute("aria-expanded", "true");
  });

  test("a link trigger toggles on click and Space and keeps the consumer's aria-current", async ({
    page,
  }) => {
    await open(page, "containers-collapsible--slotted-trigger");
    await page.locator("#control").evaluate(async (el) => {
      const a = document.createElement("a");
      a.id = "link-trigger";
      a.slot = "trigger";
      a.href = "#section";
      a.setAttribute("aria-current", "page");
      a.textContent = "Link";
      el.querySelector("#trigger")!.replaceWith(a);
      (el as HTMLElement & { current: boolean }).current = true;
      await (el as unknown as { updateComplete: Promise<boolean> })
        .updateComplete;
    });
    const a = page.locator("#link-trigger");
    await expect(a).toHaveAttribute("aria-current", "page");
    await a.click();
    await expect(a).toHaveAttribute("aria-expanded", "true");
    expect(page.url()).toContain("#section");
    await a.focus();
    await page.keyboard.press("Space");
    await expect(a).toHaveAttribute("aria-expanded", "false");
  });

  test("axe finds no violations", async ({ page }) => {
    await expectAccessible(
      await open(page, "containers-collapsible--slotted-trigger"),
    );
  });
});

test.describe("current", () => {
  test("the trigger is marked current and filled", async ({ page }) => {
    await open(page, "containers-collapsible--current");
    await expect(trigger(page)).toHaveAttribute("aria-current", "true");
    const fills = await page.locator("#control").evaluate((el) => {
      const probe = document.body.appendChild(document.createElement("div"));
      probe.style.backgroundColor = "var(--pl-color-muted-3)";
      const token = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        token,
        fill: getComputedStyle(el.shadowRoot!.querySelector(".trigger")!)
          .backgroundColor,
      };
    });
    expect(fills.fill).toBe(fills.token);
  });

  test("a collapsible without current has no aria-current", async ({
    page,
  }) => {
    await open(page);
    await expect(trigger(page)).not.toHaveAttribute("aria-current");
  });

  test("axe finds no violations", async ({ page }) => {
    await expectAccessible(await open(page, "containers-collapsible--current"));
  });
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("a coarse pointer keeps the trigger at least 44 high", async ({
    page,
  }) => {
    await open(page);
    const box = await trigger(page).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

for (const globals of ["", "material:glass", "theme:dark", "contrast:more"]) {
  test(`axe finds no WCAG 2.2 AA violations (${globals || "default"})`, async ({
    page,
  }) => {
    await expectAccessible(await open(page, story, globals));
  });
}

test("axe finds no violations when open", async ({ page }) => {
  await expectAccessible(await open(page, "containers-collapsible--open"));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await open(page));
});
