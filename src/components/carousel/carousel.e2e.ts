import { expect, test, type Page } from "@playwright/test";
import { expectAccessible } from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = "components-carousel--default";

const open = async (page: Page, id = story, globals = "") => {
  const root = await gotoStory(page, id, globals);
  await expect(page.locator("#control [part=viewport]")).toBeVisible();
  return root;
};

const viewport = (page: Page) => page.locator("#control [part=viewport]");
const dot = (page: Page, n: number) =>
  page.getByRole("button", { name: `Go to slide ${n}`, exact: true });
const next = (page: Page) =>
  page.getByRole("button", { name: "Next slide", exact: true });
const previous = (page: Page) =>
  page.getByRole("button", { name: "Previous slide", exact: true });

const record = (page: Page) =>
  page.locator("#control").evaluate((el) => {
    const log: number[] = [];
    (window as unknown as { log: number[] }).log = log;
    el.addEventListener("pl-change", (e) =>
      log.push((e as CustomEvent<{ index: number }>).detail.index),
    );
  });

const log = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: number[] }).log);

test("the host is a named carousel region of named slides", async ({
  page,
}) => {
  await open(page);
  const host = page.locator("#control");
  await expect(host).toHaveAttribute("role", "region");
  await expect(host).toHaveAttribute("aria-roledescription", "carousel");
  await expect(host).toHaveAttribute("aria-label", "Featured");
  const slides = page.locator("#control pl-carousel-item");
  await expect(slides).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    await expect(slides.nth(i)).toHaveAttribute("role", "group");
    await expect(slides.nth(i)).toHaveAttribute(
      "aria-roledescription",
      "slide",
    );
    await expect(slides.nth(i)).toHaveAttribute("aria-label", `${i + 1} of 5`);
  }
});

test("each page has a dot and the current one is marked", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("button", { name: /^Go to slide/ })).toHaveCount(
    5,
  );
  await expect(dot(page, 1)).toHaveAttribute("aria-current", "true");
  await expect(dot(page, 2)).not.toHaveAttribute("aria-current", "true");
});

test("Previous is disabled at the first page and Next at the last", async ({
  page,
}) => {
  await open(page);
  await expect(previous(page)).toBeDisabled();
  await expect(next(page)).toBeEnabled();
  await dot(page, 5).click();
  await expect(dot(page, 5)).toHaveAttribute("aria-current", "true");
  await expect(next(page)).toBeDisabled();
  await expect(previous(page)).toBeEnabled();
});

test("Next and Previous step one page and pl-change fires once", async ({
  page,
}) => {
  await open(page);
  await record(page);
  await next(page).click();
  await expect(dot(page, 2)).toHaveAttribute("aria-current", "true");
  await expect.poll(() => log(page)).toEqual([1]);
  await previous(page).click();
  await expect(dot(page, 1)).toHaveAttribute("aria-current", "true");
  await expect.poll(() => log(page)).toEqual([1, 0]);
});

test("a dot scrolls to its page, and a jump reports only the page it lands on", async ({
  page,
}) => {
  await open(page);
  await record(page);
  await dot(page, 4).click();
  await expect(dot(page, 4)).toHaveAttribute("aria-current", "true");
  await expect.poll(() => log(page)).toEqual([3]);
});

test("scrolling the area itself changes the page", async ({ page }) => {
  await open(page);
  await record(page);
  await viewport(page).evaluate((el) =>
    el.scrollTo({ left: el.clientWidth * 2 }),
  );
  await expect(dot(page, 3)).toHaveAttribute("aria-current", "true");
  await expect.poll(() => log(page)).toEqual([2]);
});

test("the arrow keys, Home and End change the page", async ({ page }) => {
  await open(page);
  await viewport(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect(dot(page, 2)).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("End");
  await expect(dot(page, 5)).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(dot(page, 4)).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("Home");
  await expect(dot(page, 1)).toHaveAttribute("aria-current", "true");
});

test("when Next becomes disabled the focus moves to Previous", async ({
  page,
}) => {
  await open(page);
  await dot(page, 4).click();
  await expect(dot(page, 4)).toHaveAttribute("aria-current", "true");
  await next(page).focus();
  await page.keyboard.press("Enter");
  await expect(next(page)).toBeDisabled();
  await expect(previous(page)).toBeFocused();
});

test("focusing a control inside a slide brings the slide into view", async ({
  page,
}) => {
  await open(page, "components-carousel--with-buttons");
  await page.getByRole("button", { name: "Read more" }).nth(2).focus();
  await expect(dot(page, 3)).toHaveAttribute("aria-current", "true");
});

test("a single slide shows no controls", async ({ page }) => {
  await open(page, "components-carousel--single-slide");
  await expect(page.locator("#control [part=controls]")).toBeHidden();
});

test("reduced motion jumps to the page instead of gliding", async ({
  page,
}) => {
  await open(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await next(page).click();
  const [left, width] = await viewport(page).evaluate((el) => [
    el.scrollLeft,
    el.clientWidth,
  ]);
  expect(Math.abs(left - width)).toBeLessThanOrEqual(1);
});

test("under rtl the first slide is at the right edge and the arrow keys mirror", async ({
  page,
}) => {
  await open(page, "components-carousel--rtl");
  const slides = page.locator("#control pl-carousel-item");
  const [first, second] = await Promise.all(
    [0, 1].map((i) => slides.nth(i).boundingBox()),
  );
  expect(first!.x).toBeGreaterThan(second!.x);
  await viewport(page).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(dot(page, 2)).toHaveAttribute("aria-current", "true");
  await expect(slides.nth(1)).toBeInViewport({ ratio: 0.9 });
});

test("the current dot stays visible under forced colors", async ({ page }) => {
  await open(page);
  await page.emulateMedia({ forcedColors: "active" });
  const background = (n: number) =>
    dot(page, n).evaluate(
      (el) => getComputedStyle(el, "::before").backgroundColor,
    );
  const highlight = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("div"));
    probe.style.cssText = "background: Highlight; forced-color-adjust: none";
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });
  await expect.poll(() => background(1)).toBe(highlight);
  expect(await background(2)).not.toBe(highlight);
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("a coarse pointer keeps each control at 44 by 44", async ({ page }) => {
    await open(page);
    for (const control of [
      previous(page),
      next(page),
      dot(page, 1),
      dot(page, 2),
    ]) {
      const box = await control.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

for (const globals of ["", "material:glass", "theme:dark", "contrast:more"]) {
  test(`axe finds no WCAG 2.2 AA violations (${globals || "default"})`, async ({
    page,
  }) => {
    await expectAccessible(await open(page, story, globals));
  });
}

// The slides scroll sideways by design, so the shared overflow helper, which
// flags every scroller, does not fit: check that the carousel itself and the
// controls stay within the page.
test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await open(page);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  const overflowing = await page.locator("#control").evaluate((host) => {
    const controls = host.shadowRoot!.querySelector("[part=controls]")!;
    return [
      host.scrollWidth > host.clientWidth,
      controls.scrollWidth > controls.clientWidth,
      document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ];
  });
  expect(overflowing).toEqual([false, false, false]);
});
