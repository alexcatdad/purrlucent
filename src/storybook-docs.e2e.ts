import { expect, test } from "@playwright/test";
import { contrast } from "../e2e/helpers/color.ts";

for (const colorScheme of ["light", "dark"] as const) {
  test(`Install docs code has sufficient contrast in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/iframe.html?id=install--docs&viewMode=docs");
    const blocks = page.locator(".sbdocs-content pre:not(:has(pre))");
    await expect(
      blocks.filter({ hasText: "npm install purrlucent" }),
    ).toBeVisible();

    const runs = await blocks.evaluateAll((blocks) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const paint = (color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
      };
      const pixel = () => Array.from(ctx.getImageData(0, 0, 1, 1).data);

      return blocks.flatMap((block) => {
        const runs = [];
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent?.trim();
          const element = node.parentElement!;
          const style = getComputedStyle(element);
          if (!text || style.visibility !== "visible") continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          if (!range.getClientRects().length) continue;

          const layers: string[] = [];
          for (
            let layer: Element | null = element;
            layer;
            layer = layer.parentElement
          )
            layers.unshift(getComputedStyle(layer).backgroundColor);
          ctx.clearRect(0, 0, 1, 1);
          for (const layer of layers) paint(layer);
          const background = pixel();
          paint(
            style.getPropertyValue("-webkit-text-fill-color") || style.color,
          );
          runs.push({ text, foreground: pixel(), background });
        }
        return runs;
      });
    });

    expect(runs.length).toBeGreaterThan(0);
    for (const { text, foreground, background } of runs) {
      expect(background[3], `Background behind ${JSON.stringify(text)}`).toBe(
        255,
      );
      expect
        .soft(contrast(foreground, background), JSON.stringify(text))
        .toBeGreaterThanOrEqual(4.5);
    }
  });
}
