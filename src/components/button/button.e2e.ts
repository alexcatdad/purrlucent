import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
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
  "glass",
];
const labels = ["Duplicate", "Save", "Share", "Cancel"];

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, "components-button--variants");
  await expect(root).toMatchAriaSnapshot(`
    - button "Duplicate"
    - button "Save"
    - button "Share"
    - button "Cancel"
  `);
});

test("an icon button takes its name from aria-label", async ({ page }) => {
  const root = await gotoStory(page, "components-button--sizes");
  await expect(
    root.getByRole("button", { name: "Add", exact: true }),
  ).toHaveCount(3);
});

test("a disabled button is exposed as disabled", async ({ page }) => {
  const root = await gotoStory(page, "components-button--disabled");
  await expect(root.getByRole("button", { name: "Cancel" })).toBeDisabled();
});

for (const id of stories) {
  test(`axe finds no WCAG 2.2 AA violations in ${id}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, `components-button--${id}`));
  });
}

test("a button without label text fails axe", async ({ page }) => {
  const root = await gotoStory(page, "components-button--default");
  await root.evaluate((el) => {
    const empty = document.createElement("purr-button");
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
  await gotoStory(page, "components-button--destructive");
  const background = (id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
  const primary = await page.evaluate(() => {
    const el = document.createElement("purr-button");
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
  await gotoStory(page, "components-button--in-form");
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
  await gotoStory(page, "components-button--sizes");
  const heights = await page
    .locator("purr-button:not([icon])")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  expect(heights).toEqual([...heights].sort((a, b) => a - b));
  expect(new Set(heights).size).toBe(3);
});

test("an icon button is as wide as it is tall", async ({ page }) => {
  await gotoStory(page, "components-button--sizes");
  for (const button of await page.locator("purr-button[icon]").all()) {
    const box = await button.boundingBox();
    expect(box!.width).toBe(box!.height);
  }
});

test("the pressed state is visible on the button", async ({ page }) => {
  // Zero durations, so each face tone is read without waiting for a transition.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, "components-button--default");
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
    await gotoStory(page, "components-button--variants"),
  );
});

test("virtual screen reader speaks each button", async ({ page }) => {
  await gotoStory(page, "components-button--variants");
  const spoken = (await spokenPhrases(page)).join(" ");
  for (const label of labels) expect(spoken).toContain(label);
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every button keeps a 44 by 44 hit area", async ({ page }) => {
    for (const id of ["variants", "sizes"]) {
      await gotoStory(page, `components-button--${id}`);
      for (const button of await page.locator("purr-button").all()) {
        const box = await button.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test("the focus ring stays visible under forced colors", async ({ page }) => {
  await gotoStory(page, "components-button--variants");
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const button = page.locator("purr-button").first();
  await expect(button).toBeFocused();
  expect(
    await button.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

test("a disabled fieldset makes the button inert, as a native button is", async ({
  page,
}) => {
  const root = await gotoStory(page, "components-button--default");
  await root.evaluate((el) => {
    el.insertAdjacentHTML(
      "beforeend",
      `<form id="f"><fieldset id="fs" disabled>
        <purr-button id="b" type="submit">Save</purr-button>
      </fieldset></form>`,
    );
    const form = document.getElementById("f")!;
    const log = (what: string) => (form.dataset.log += `${what} `);
    form.dataset.log = "";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      log("submit");
    });
    form.addEventListener("purr-press", () => log("press"));
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
  await gotoStory(page, "components-button--default");
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

test("a click on a disabled button reaches no listener", async ({ page }) => {
  const root = await gotoStory(page, "components-button--disabled");
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
  const root = await gotoStory(page, "components-button--default");
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      `<purr-button id="r" tabindex="-1">Roving</purr-button>`,
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
  const root = await gotoStory(page, "components-button--default");
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      `<purr-button id="h" hidden>Hi</purr-button>`,
    ),
  );
  await expect(page.locator("#h")).toBeHidden();
});

test("pressing shows feedback under forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await gotoStory(page, "components-button--default");
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
  const root = await gotoStory(page, "components-button--default");
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      `<purr-button variant="primary">A</purr-button>
       <purr-button variant="tinted">B</purr-button>
       <purr-button destructive>C</purr-button>
       <purr-button variant="primary" disabled>D</purr-button>`,
    ),
  );
  const shadows = await page
    .locator("purr-button")
    .evaluateAll((els) =>
      els.map((el) => getComputedStyle(el, "::before").boxShadow),
    );
  for (const shadow of shadows) expect(shadow).not.toBe("none");
});
