import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-progress--${name}`;

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("determinate"));
  await expect(root).toMatchAriaSnapshot(`
    - progressbar "Upload 0%"
    - progressbar "Upload 25%"
    - progressbar "Upload 50%"
    - progressbar "Upload 75%"
    - progressbar "Upload 100%"
  `);
});

test("a value sets aria-valuenow and the fill width", async ({ page }) => {
  await gotoStory(page, story("determinate"));
  const widths: number[] = [];
  for (const value of [0, 50, 100]) {
    const bar = page.getByRole("progressbar", { name: `Upload ${value}%` });
    await expect(bar).toHaveAttribute("aria-valuenow", String(value));
    await expect(bar).toHaveAttribute("aria-valuemax", "100");
    widths.push(
      await bar.evaluate(
        (el) =>
          el.shadowRoot!.querySelector('[part="fill"]')!.getBoundingClientRect()
            .width,
      ),
    );
  }
  expect(widths[0]).toBe(0);
  expect(widths[1]).toBeGreaterThan(widths[0]!);
  expect(widths[2]).toBeGreaterThan(widths[1]!);
});

test("at 0% the bar shows an empty track; a small value still shows", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const bar = page.locator("#progress");
  const fillWidth = () =>
    bar.evaluate(
      (el) =>
        el.shadowRoot!.querySelector('[part="fill"]')!.getBoundingClientRect()
          .width,
    );
  await bar.evaluate(
    (el) => ((el as HTMLElement & { value: number }).value = 0),
  );
  await expect.poll(fillWidth).toBe(0);
  await bar.evaluate(
    (el) => ((el as HTMLElement & { value: number }).value = 1),
  );
  await expect.poll(fillWidth).toBeGreaterThan(0);
});

test("without a value there is no aria-valuenow", async ({ page }) => {
  await gotoStory(page, story("indeterminate"));
  const bar = page.getByRole("progressbar", { name: "Preparing" });
  await expect(bar).not.toHaveAttribute("aria-valuenow");
});

test("the indeterminate segment stays visible without motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("indeterminate"));
  const bar = page.getByRole("progressbar", { name: "Preparing" });
  const { animation, box, inside } = await bar.evaluate((el) => {
    const fill = el.shadowRoot!.querySelector('[part="fill"]')!;
    const rect = fill.getBoundingClientRect();
    const host = el.getBoundingClientRect();
    return {
      animation: getComputedStyle(fill).animationDuration,
      box: rect.width,
      inside: rect.left >= host.left && rect.right <= host.right,
    };
  });
  expect(animation).toBe("0s");
  expect(box).toBeGreaterThan(0);
  expect(inside).toBe(true);
});

test("the segment moves with motion allowed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoStory(page, story("indeterminate"));
  const bar = page.getByRole("progressbar", { name: "Preparing" });
  const left = () =>
    bar.evaluate(
      (el) =>
        el.shadowRoot!.querySelector('[part="fill"]')!.getBoundingClientRect()
          .left,
    );
  const first = await left();
  await page.waitForTimeout(300);
  expect(await left()).not.toBe(first);
});

test("a changing value and max update the semantics", async ({ page }) => {
  await gotoStory(page, story("updates"));
  const bar = page.locator("#progress");
  await expect(bar).toHaveAttribute("aria-valuemax", "8");
  await bar.evaluate(
    (el) => ((el as HTMLElement & { value: number }).value = 8),
  );
  await expect(bar).toHaveAttribute("aria-valuenow", "8");
});

test("the fill grows from the right under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const bar = page.getByRole("progressbar", { name: "Upload" });
  const [host, fill] = await bar.evaluate((el) => [
    el.getBoundingClientRect().right,
    el.shadowRoot!.querySelector('[part="fill"]')!.getBoundingClientRect()
      .right,
  ]);
  expect(fill).toBeCloseTo(host!, 0);
});

test("the bar keeps a visible border under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  const bar = page.getByRole("progressbar", { name: "Upload" });
  expect(await bar.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe(
    "solid",
  );
});

test("the indeterminate segment is drawn under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("indeterminate"));
  await page.emulateMedia({ forcedColors: "active" });
  const fill = await page
    .getByRole("progressbar")
    .first()
    .evaluate((el) => {
      const { backgroundColor, backgroundImage } = getComputedStyle(
        el.shadowRoot!.querySelector('[part="fill"]')!,
      );
      return { backgroundColor, backgroundImage };
    });
  expect(fill.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(fill.backgroundImage).toBe("none");
});

test("a progress bar without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("pl-progress");
    bare.id = "bare";
    el.append(bare);
  });
  await expect(page.locator("#bare")).toHaveAttribute("role", "progressbar");
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("determinate")));
});

test("virtual screen reader speaks the role and name", async ({ page }) => {
  await gotoStory(page, story("determinate"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("progressbar");
  expect(spoken).toContain("Upload 50%");
});
