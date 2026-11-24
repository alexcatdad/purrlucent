import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `text-badge--${name}`;

test("aria snapshot: the badge is its text", async ({ page }) => {
  const root = await gotoStory(page, story("variants"));
  await expect(root).toMatchAriaSnapshot(`
    - text: Draft New Done Behind Failed
  `);
});

test("each variant says its status in text", async ({ page }) => {
  await gotoStory(page, story("variants"));
  await expect(page.locator("#neutral")).toHaveText("Draft");
  await expect(page.locator("#accent")).toHaveText("New");
  await expect(page.locator("#success")).toHaveText("Done");
  await expect(page.locator("#warning")).toHaveText("Behind");
  await expect(page.locator("#destructive")).toHaveText("Failed");
});

test("the variants differ in fill", async ({ page }) => {
  await gotoStory(page, story("variants"));
  const fills = await page
    .locator("pl-badge")
    .evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).backgroundColor),
    );
  expect(new Set(fills).size).toBe(5);
});

for (const theme of ["light", "dark"])
  test(`dot in ${theme}: one neutral fill, and a round dot colored per variant`, async ({
    page,
  }) => {
    await gotoStory(page, story("status"), `theme:${theme}`);
    const badges = await page.locator("pl-badge").evaluateAll((els) =>
      els.map((el) => {
        const dot = el.shadowRoot!.querySelector('[part="dot"]')!;
        const box = dot.getBoundingClientRect();
        return {
          fill: getComputedStyle(el).backgroundColor,
          dot: getComputedStyle(dot).backgroundColor,
          size: [box.width, box.height],
          hidden: dot.getAttribute("aria-hidden"),
        };
      }),
    );
    expect(new Set(badges.map((b) => b.fill)).size).toBe(1);
    expect(new Set(badges.map((b) => b.dot)).size).toBe(5);
    for (const badge of badges) {
      expect(badge.size[0]).toBeGreaterThan(0);
      expect(badge.size[0]).toBe(badge.size[1]);
      expect(badge.hidden).toBe("true");
    }
  });

test("the text meets 4.5:1 against the fill in every variant", async ({
  page,
}) => {
  await gotoStory(page, story("variants"));
  const ratios = await page.locator("pl-badge").evaluateAll((els) => {
    const channels = (css: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    };
    const luminance = ([r, g, b]: number[]) => {
      const lin = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
    };
    return els.map((el) => {
      const style = getComputedStyle(el);
      const a = luminance(channels(style.backgroundColor));
      const b = luminance(channels(style.color));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
  });
  for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
});

const tones = ["neutral", "accent", "success", "warning", "destructive"];

test("appearance defaults to solid and reflects", async ({ page }) => {
  await gotoStory(page, story("appearances"));
  await expect(page.locator("#soft-accent")).toHaveAttribute(
    "appearance",
    "soft",
  );
  await gotoStory(page, story("default"));
  await expect(page.locator("#badge")).toHaveJSProperty("appearance", "solid");
});

test("soft is a tinted fill and outline has no fill but an edge", async ({
  page,
}) => {
  await gotoStory(page, story("appearances"));
  for (const tone of tones) {
    const solid = await page
      .locator(`#solid-${tone}`)
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const soft = await page
      .locator(`#soft-${tone}`)
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const outline = await page.locator(`#outline-${tone}`).evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        fill: style.backgroundColor,
        edge: style.borderTopColor,
        width: style.borderTopWidth,
      };
    });
    expect(soft).not.toBe(solid);
    expect(outline.fill).toBe("rgba(0, 0, 0, 0)");
    expect(outline.edge).not.toBe("rgba(0, 0, 0, 0)");
    expect(outline.width).not.toBe("0px");
  }
});

for (const theme of ["light", "dark"])
  test(`soft and outline text meets 4.5:1 in ${theme}`, async ({ page }) => {
    await gotoStory(page, story("appearances"), `theme:${theme}`);
    const ratios = await page.locator("pl-badge").evaluateAll((els) => {
      const channels = (css: string, base: number[]) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = `rgb(${base.join(",")})`;
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = css;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
      };
      const backdrop = (el: Element) => {
        for (let n: Element | null = el.parentElement; n; n = n.parentElement) {
          const bg = getComputedStyle(n).backgroundColor;
          if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
        }
        return "rgb(255, 255, 255)";
      };
      const luminance = ([r, g, b]: number[]) => {
        const lin = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
      };
      return els.map((el) => {
        const style = getComputedStyle(el);
        const base = channels(backdrop(el), [255, 255, 255]);
        const fill = channels(style.backgroundColor, base);
        const a = luminance(fill);
        const b = luminance(channels(style.color, fill));
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
    });
    expect(ratios).toHaveLength(15);
    for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

test("it passes axe with every appearance", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("appearances")));
});

test("it takes no focus", async ({ page }) => {
  await gotoStory(page, story("variants"));
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(
    () => document.activeElement?.localName ?? "",
  );
  expect(focused).not.toBe("pl-badge");
});

test("a one-digit badge is round", async ({ page }) => {
  await gotoStory(page, story("counts"));
  const box = (await page.locator("#one").boundingBox())!;
  expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(2);
  const many = (await page.locator("#many").boundingBox())!;
  expect(many.width).toBeGreaterThan(box.width);
});

test("under rtl the text is still shown", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  await expect(page.locator("#badge")).toHaveText("3");
});

test("the badge keeps an edge under forced colors", async ({ page }) => {
  await gotoStory(page, story("variants"));
  await page.emulateMedia({ forcedColors: "active" });
  const width = await page
    .locator("#destructive")
    .evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(width).not.toBe("0px");
});

test("it passes axe", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("variants")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("variants")));
});

test("virtual screen reader speaks the badge text", async ({ page }) => {
  await gotoStory(page, story("variants"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Failed");
});
