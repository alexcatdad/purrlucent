import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-marker--${name}`;

const label = (page: import("@playwright/test").Page) =>
  page.locator("pl-marker [part=label]").first();

test("aria snapshot of a default marker has only its text", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - text: Explored 4 files
  `);
});

test("a role set on the marker is kept and announced as a status", async ({
  page,
}) => {
  await gotoStory(page, story("status"));
  await expect(page.getByRole("status")).toContainText(
    "Searching the codebase",
  );
});

test("the icon is hidden from assistive technology", async ({ page }) => {
  await gotoStory(page, story("status"));
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  const hidden = await page
    .locator("pl-marker")
    .evaluate((el) =>
      el.shadowRoot!.querySelector("[part=icon]")!.getAttribute("aria-hidden"),
    );
  expect(hidden).toBe("true");
});

test("without an icon nothing is reserved for it", async ({ page }) => {
  await gotoStory(page, story("separator"));
  await expect
    .poll(() =>
      page
        .locator("pl-marker")
        .evaluate(
          (el) =>
            el.shadowRoot!.querySelector<HTMLElement>("[part=icon]")!.hidden,
        ),
    )
    .toBe(true);
});

test("the border variant draws a rule under the row", async ({ page }) => {
  await gotoStory(page, story("border"));
  await expect(page.locator("pl-marker")).toHaveCSS(
    "border-bottom-style",
    "solid",
  );
});

test("the separator has no separator role and its label is read", async ({
  page,
}) => {
  const root = await gotoStory(page, story("separator"));
  await expect(page.getByRole("separator")).toHaveCount(0);
  await expect(root).toMatchAriaSnapshot(`
    - text: Today
  `);
});

test("the separator draws a rule on each side of a centered label", async ({
  page,
}) => {
  await gotoStory(page, story("separator"));
  const rules = await page.locator("pl-marker").evaluate((el) => {
    const side = (pseudo: string) => {
      const style = getComputedStyle(el, pseudo);
      return { border: style.borderTopStyle, flex: style.flexGrow };
    };
    return [side("::before"), side("::after")];
  });
  expect(rules).toEqual([
    { border: "solid", flex: "1" },
    { border: "solid", flex: "1" },
  ]);
  const host = (await page.locator("pl-marker").boundingBox())!;
  const text = (await label(page).boundingBox())!;
  expect(
    Math.abs(text.x + text.width / 2 - (host.x + host.width / 2)),
  ).toBeLessThan(2);
});

test("a marker with an href is a link named by its text", async ({ page }) => {
  const root = await gotoStory(page, story("link"));
  await expect(root).toMatchAriaSnapshot(`
    - link "Explored 4 files":
      - /url: "#files"
  `);
});

test("clicking a link marker follows it", async ({ page }) => {
  await gotoStory(page, story("link"));
  await page.getByRole("link").click();
  expect(new URL(page.url()).hash).toBe("#files");
});

test("an interactive marker is a button that clicks through to the element", async ({
  page,
}) => {
  await gotoStory(page, story("button"));
  await page.locator("pl-marker").evaluate((el) => {
    el.dataset.clicks = "0";
    el.addEventListener("click", () => {
      el.dataset.clicks = String(Number(el.dataset.clicks) + 1);
    });
  });
  const button = page.getByRole("button", { name: "Explored 4 files" });
  await button.click();
  await expect(page.locator("pl-marker")).toHaveAttribute("data-clicks", "1");
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("pl-marker")).toHaveAttribute("data-clicks", "2");
  await page.keyboard.press("Space");
  await expect(page.locator("pl-marker")).toHaveAttribute("data-clicks", "3");
});

test("a plain marker is not focusable and has no control", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(page.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("button")).toHaveCount(0);
});

test("the focus ring is visible, also under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("button"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.getByRole("button").focus();
  const style = await page
    .locator("pl-marker")
    .evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector("button")!).outlineStyle,
    );
  expect(style).not.toBe("none");
});

test("the shimmer sweeps with motion allowed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoStory(page, story("shimmer"));
  await expect(label(page)).toHaveCSS("animation-name", "pl-shimmer-sweep");
  const position = () =>
    label(page).evaluate((el) => getComputedStyle(el).backgroundPositionX);
  const first = await position();
  await page.waitForTimeout(300);
  expect(await position()).not.toBe(first);
});

test("the shimmer is derived from the text color, which stays readable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoStory(page, story("shimmer"));
  const style = await label(page).evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      color: s.color,
      fill: s.webkitTextFillColor,
      image: s.backgroundImage,
    };
  });
  expect(style.color).not.toBe("rgba(0, 0, 0, 0)");
  expect(style.fill).toBe("rgba(0, 0, 0, 0)");
  expect(style.image).toContain("linear-gradient");
});

test("under reduced motion the shimmer is plain text", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("shimmer"));
  await expect(label(page)).toHaveCSS("animation-name", "none");
  await expect(label(page)).toHaveCSS("background-image", "none");
  const fill = await label(page).evaluate(
    (el) => getComputedStyle(el).webkitTextFillColor,
  );
  expect(fill).not.toBe("rgba(0, 0, 0, 0)");
});

test("under forced colors the shimmer is plain text", async ({ page }) => {
  await page.emulateMedia({
    reducedMotion: "no-preference",
    forcedColors: "active",
  });
  await gotoStory(page, story("shimmer"));
  await expect(label(page)).toHaveCSS("background-image", "none");
  const fill = await label(page).evaluate(
    (el) => getComputedStyle(el).webkitTextFillColor,
  );
  expect(fill).not.toBe("rgba(0, 0, 0, 0)");
});

test("the shimmer sweeps against the reading direction under rtl", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoStory(page, story("shimmer"));
  await page.evaluate(() => (document.documentElement.dir = "rtl"));
  await expect(label(page)).toHaveCSS("animation-direction", "reverse");
});

test("under rtl the icon sits at the right edge", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const icon = (await page.locator("svg[slot=icon]").boundingBox())!;
  const text = (await label(page).boundingBox())!;
  expect(icon.x).toBeGreaterThan(text.x);
});

test("has no axe violations", async ({ page }) => {
  for (const name of [
    "default",
    "status",
    "border",
    "separator",
    "link",
    "button",
  ])
    await expectAccessible(await gotoStory(page, story(name)));
});

test("the shimmer story has no axe violations under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expectAccessible(await gotoStory(page, story("shimmer")));
});

test("long text wraps without horizontal overflow at 200% text zoom", async ({
  page,
}) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("long-text")));
});

test("virtual screen reader speaks the separator label and the status", async ({
  page,
}) => {
  await gotoStory(page, story("separator"));
  expect((await spokenPhrases(page)).join(" | ")).toContain("Today");
  await gotoStory(page, story("status"));
  expect((await spokenPhrases(page)).join(" | ")).toContain(
    "Searching the codebase",
  );
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("a link marker is at least 44 by 44", async ({ page }) => {
    await gotoStory(page, story("link"));
    const box = (await page.getByRole("link").boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test("a button marker is at least 44 by 44", async ({ page }) => {
    await gotoStory(page, story("button"));
    const box = (await page.getByRole("button").boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
