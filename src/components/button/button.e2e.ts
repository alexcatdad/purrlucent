import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const stories = [
  "default",
  "variants",
  "sizes",
  "destructive",
  "disabled",
  "busy",
  "glass",
  "links",
];
const labels = ["Duplicate", "Save", "Share", "Cancel"];

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--variants");
  await expect(root).toMatchAriaSnapshot(`
    - button "Duplicate"
    - button "Save"
    - button "Share"
    - button "Cancel"
  `);
});

test("an icon button takes its name from aria-label", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--sizes");
  await expect(
    root.getByRole("button", { name: "Add", exact: true }),
  ).toHaveCount(3);
});

test("a disabled button is exposed as disabled", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--disabled");
  await expect(root.getByRole("button", { name: "Cancel" })).toBeDisabled();
});

for (const id of stories) {
  test(`axe finds no WCAG 2.2 AA violations in ${id}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, `actions-button--${id}`));
  });
}

test("a button without label text fails axe", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--default");
  await root.evaluate((el) => {
    const empty = document.createElement("pl-button");
    empty.id = "empty";
    el.append(empty);
  });
  const { violations } = await new AxeBuilder({ page })
    .include("#empty")
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => v.id)).toContain("aria-command-name");
});

test("a destructive button is never styled as the prominent button", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--destructive");
  const background = (id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
  const primary = await page.evaluate(() => {
    const el = document.createElement("pl-button");
    el.setAttribute("variant", "primary");
    document.body.append(el);
    const color = getComputedStyle(el, "::before").backgroundColor;
    el.remove();
    return color;
  });
  expect(await background("destructive-primary")).not.toBe(primary);
  expect(await background("destructive-primary")).toBe(
    await background("destructive-tinted"),
  );
});

test("a submit button submits its form and a reset button resets it", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--in-form");
  await page.locator("#form").evaluate((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.setAttribute("data-submitted", "");
    });
  });
  const title = page.getByRole("textbox", { name: "Title" });
  await title.fill("Changed");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(title).toHaveValue("Draft");
  await expect(page.locator("#form")).not.toHaveAttribute("data-submitted");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("#form")).toHaveAttribute("data-submitted");
});

test("each size is taller than the one before", async ({ page }) => {
  await gotoStory(page, "actions-button--sizes");
  const heights = await page
    .locator("pl-button:not([icon])")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  expect(heights).toEqual([...heights].sort((a, b) => a - b));
  expect(new Set(heights).size).toBe(3);
});

test("an icon button is as wide as it is tall", async ({ page }) => {
  await gotoStory(page, "actions-button--sizes");
  for (const button of await page.locator("pl-button[icon]").all()) {
    const box = await button.boundingBox();
    expect(box!.width).toBe(box!.height);
  }
});

test("the pressed state is visible on the button", async ({ page }) => {
  // Zero durations, so each face tone is read without waiting for a transition.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, "actions-button--default");
  const button = page.locator("#button");
  const face = () =>
    button.evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
  await button.hover();
  const resting = await face();
  await page.mouse.down();
  expect(await face()).not.toBe(resting);
  await page.mouse.up();
  expect(await face()).toBe(resting);
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(
    await gotoStory(page, "actions-button--variants"),
  );
});

test("virtual screen reader speaks each button", async ({ page }) => {
  await gotoStory(page, "actions-button--variants");
  const spoken = (await spokenPhrases(page)).join(" ");
  for (const label of labels) expect(spoken).toContain(label);
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every button keeps a 44 by 44 hit area", async ({ page }) => {
    for (const id of ["variants", "sizes"]) {
      await gotoStory(page, `actions-button--${id}`);
      for (const button of await page.locator("pl-button").all()) {
        const box = await button.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test("the focus ring stays visible under forced colors", async ({ page }) => {
  await gotoStory(page, "actions-button--variants");
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const button = page.locator("pl-button").first();
  await expect(button).toBeFocused();
  expect(
    await button.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

test("a disabled fieldset makes the button inert, as a native button is", async ({
  page,
}) => {
  const root = await gotoStory(page, "actions-button--default");
  await root.evaluate((el) => {
    el.insertAdjacentHTML(
      "beforeend",
      `<form id="f"><fieldset id="fs" disabled>
        <pl-button id="b" type="submit">Save</pl-button>
      </fieldset></form>`,
    );
    const form = document.getElementById("f")!;
    const log = (what: string) => (form.dataset.log += `${what} `);
    form.dataset.log = "";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      log("submit");
    });
    form.addEventListener("pl-press", () => log("press"));
  });
  const log = page.locator("#f");
  const button = page.locator("#b");
  await expect(button).toHaveAttribute("aria-disabled", "true");
  await expect(button).toHaveAttribute("tabindex", "-1");
  await button.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(log).toHaveAttribute("data-log", "");
  await page
    .locator("#fs")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = false));
  await expect(button).not.toHaveAttribute("aria-disabled");
  await expect(button).toHaveAttribute("tabindex", "0");
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(log).toHaveAttribute("data-log", "submit press ");
});

test("Enter and Space fire click, as a native button does", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--default");
  const button = page.locator("#button");
  await button.evaluate((el) => {
    el.dataset.clicks = "0";
    el.addEventListener("click", () => (el.dataset.clicks += "x"));
  });
  await button.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(button).toHaveAttribute("data-clicks", "0xx");
});

test("a busy button shows a spinner, ignores presses and stays focusable", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--busy");
  const button = page.locator("#busy");
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect(button).not.toHaveAttribute("aria-disabled");
  await expect(button).toHaveAttribute("tabindex", "0");
  await expect(button.locator("pl-spinner")).toBeVisible();
  await button.evaluate((el) => {
    el.dataset.presses = "0";
    el.addEventListener("pl-press", () => (el.dataset.presses += "x"));
  });
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(button).toHaveAttribute("data-presses", "0");
  const iconButton = page.locator("#busy-icon");
  const box = (await iconButton.boundingBox())!;
  expect(box.width).toBe(box.height);
  await button.evaluate((el) => el.removeAttribute("busy"));
  await expect(button).not.toHaveAttribute("aria-busy");
  await expect(button.locator("pl-spinner")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("data-presses", "0x");
});

test("a click on a disabled button reaches no listener", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--disabled");
  const button = root.getByRole("button", { name: "Cancel" });
  await button.evaluate((el) => {
    el.dataset.clicks = "0";
    el.addEventListener("click", () => (el.dataset.clicks += "x"));
  });
  const box = (await button.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(button).toHaveAttribute("data-clicks", "0");
});

test("a button keeps its own tabindex, also across disabling", async ({
  page,
}) => {
  const root = await gotoStory(page, "actions-button--default");
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      `<pl-button id="r" tabindex="-1">Roving</pl-button>`,
    ),
  );
  const button = page.locator("#r");
  await expect(button).toHaveAttribute("tabindex", "-1");
  await button.evaluate((el) => el.setAttribute("disabled", ""));
  await expect(button).toHaveAttribute("tabindex", "-1");
  await button.evaluate((el) => el.removeAttribute("disabled"));
  await expect(button).not.toHaveAttribute("aria-disabled");
  await expect(button).toHaveAttribute("tabindex", "-1");
});

test("the hidden attribute hides the button", async ({ page }) => {
  const root = await gotoStory(page, "actions-button--default");
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      `<pl-button id="h" hidden>Hi</pl-button>`,
    ),
  );
  await expect(page.locator("#h")).toBeHidden();
});

test("pressing shows feedback under forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await gotoStory(page, "actions-button--default");
  const button = page.locator("#button");
  const edge = () =>
    button.evaluate((el) => getComputedStyle(el, "::before").borderTopColor);
  const resting = await edge();
  await button.hover();
  await page.mouse.down();
  expect(await edge()).not.toBe(resting);
  await page.mouse.up();
});

test("increased contrast outlines every filled variant", async ({ page }) => {
  await page.emulateMedia({ contrast: "more" });
  const root = await gotoStory(page, "actions-button--default");
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      `<pl-button variant="primary">A</pl-button>
       <pl-button variant="tinted">B</pl-button>
       <pl-button destructive>C</pl-button>
       <pl-button variant="primary" disabled>D</pl-button>`,
    ),
  );
  const shadows = await page
    .locator("pl-button")
    .evaluateAll((els) =>
      els.map((el) => getComputedStyle(el, "::before").boxShadow),
    );
  for (const shadow of shadows) expect(shadow).not.toBe("none");
});

test.describe("links", () => {
  const story = "actions-button--links";
  const hash = (page: Page) => page.evaluate(() => location.hash);

  test("a button with href is a link named by its label or aria-label", async ({
    page,
  }) => {
    const root = await gotoStory(page, story);
    await expect(root).toMatchAriaSnapshot(`
      - link "Open in Contracts"
      - link "Back to list"
      - link "New contract"
      - link "Open report"
      - link "Archive" [disabled]
    `);
    await expect(root.getByRole("button")).toHaveCount(0);
    await expect(page.locator("#link-icon")).not.toHaveAttribute("aria-label");
  });

  test("a plain click follows the link", async ({ page }) => {
    await gotoStory(page, story);
    await page.locator("#link").click();
    await expect.poll(() => hash(page)).toBe("#contracts");
  });

  test("the whole face is the link's hit area", async ({ page }) => {
    await gotoStory(page, story);
    // In the padding at the start edge, outside the label text.
    await page.locator("#link").click({ position: { x: 4, y: 12 } });
    await expect.poll(() => hash(page)).toBe("#contracts");
  });

  test("a click listener on the host can prevent the navigation and route instead", async ({
    page,
  }) => {
    await gotoStory(page, story);
    await page.locator("#link").evaluate((el) => {
      const w = window as unknown as { seen: string[] };
      w.seen = [];
      el.addEventListener("click", (event) => {
        w.seen.push((event.target as Element).id);
        event.preventDefault();
      });
    });
    await page.locator("#link").click();
    await page.locator("#link a").focus();
    await page.keyboard.press("Enter");
    expect(
      await page.evaluate(() => (window as unknown as { seen: string[] }).seen),
    ).toEqual(["link", "link"]);
    expect(await hash(page)).toBe("");
  });

  test("Tab reaches the inner link, Enter follows it and fires pl-press once", async ({
    page,
  }) => {
    await gotoStory(page, story);
    await page.locator("#link-ghost").evaluate((el) => {
      const w = window as unknown as { presses: number };
      w.presses = 0;
      el.addEventListener("pl-press", () => w.presses++);
    });
    await page.locator("#link a").focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("#link-ghost a")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => hash(page)).toBe("#list");
    expect(
      await page.evaluate(
        () => (window as unknown as { presses: number }).presses,
      ),
    ).toBe(1);
  });

  test("target, rel and download reach the inner link", async ({ page }) => {
    await gotoStory(page, story);
    const inner = page.locator("#link-new-tab a");
    await expect(inner).toHaveAttribute("href", "#report");
    await expect(inner).toHaveAttribute("target", "_blank");
    await expect(inner).toHaveAttribute("rel", "noopener");
    await page
      .locator("#link-new-tab")
      .evaluate((el) => el.setAttribute("download", "report.csv"));
    await expect(inner).toHaveAttribute("download", "report.csv");
  });

  test("a disabled link has no address, does not navigate and is skipped by Tab", async ({
    page,
  }) => {
    await gotoStory(page, story);
    const inner = page.locator("#link-disabled a");
    await expect(inner).not.toHaveAttribute("href");
    await expect(inner).toHaveAttribute("aria-disabled", "true");
    await page.locator("#link-disabled").click({ force: true });
    expect(await hash(page)).toBe("");
    await page.locator("#link-new-tab a").focus();
    await page.keyboard.press("Tab");
    await expect(inner).not.toBeFocused();
  });

  test("the keyboard focus ring is drawn around the face", async ({ page }) => {
    await gotoStory(page, story);
    await page.locator("#link a").focus();
    await page.keyboard.press("Tab");
    expect(
      await page
        .locator("#link-ghost a")
        .evaluate((a) => getComputedStyle(a, "::after").outlineStyle),
    ).toBe("solid");
  });

  test("removing href makes it a button again", async ({ page }) => {
    const root = await gotoStory(page, story);
    await page
      .locator("#link-icon")
      .evaluate((el) => el.removeAttribute("href"));
    await expect(
      root.getByRole("button", { name: "New contract" }),
    ).toBeVisible();
    await expect(page.locator("#link-icon")).toHaveAttribute("tabindex", "0");
  });
});
