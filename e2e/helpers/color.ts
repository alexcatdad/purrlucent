import type { Page } from "@playwright/test";

/** Resolves a CSS color to 8-bit sRGB through a canvas, so oklch needs no hand-written math. */
export const resolveColors = (page: Page, colors: Record<string, string>) =>
  page.evaluate((entries) => {
    const ctx = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    })!;
    return Object.fromEntries(
      Object.entries(entries).map(([key, css]) => {
        const probe = document.createElement("div");
        probe.style.color = css;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = resolved;
        ctx.fillRect(0, 0, 1, 1);
        return [key, [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]];
      }),
    ) as Record<string, [number, number, number]>;
  }, colors);

/** The color a translucent `tint` (any CSS color) shows when painted over each opaque `backdrops` color. */
export const compositeOver = (
  page: Page,
  tint: string,
  backdrops: readonly string[],
) =>
  page.evaluate(
    ([top, bottoms]) => {
      const ctx = document.createElement("canvas").getContext("2d", {
        willReadFrequently: true,
      })!;
      return bottoms!.map((bottom) => {
        const probe = document.createElement("div");
        probe.style.color = top!;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        ctx.fillStyle = bottom;
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = resolved;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)] as [
          number,
          number,
          number,
        ];
      });
    },
    [tint, backdrops] as const,
  );

const luminance = ([r, g, b]: number[]) => {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = (v ?? 0) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr! + 0.7152 * lg! + 0.0722 * lb!;
};

/** WCAG contrast ratio between two sRGB colors. */
export const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};
