import { test } from "@playwright/test";

export interface Viewport {
  name: "desktop" | "tablet" | "phone";
  width: number;
  height: number;
  pointer: "fine" | "coarse";
}

export const viewports: readonly Viewport[] = [
  { name: "desktop", width: 1440, height: 900, pointer: "fine" },
  { name: "tablet", width: 1024, height: 1366, pointer: "coarse" },
  { name: "phone", width: 390, height: 844, pointer: "coarse" },
];

/** Declares `fn`'s tests once per viewport; a coarse pointer turns on touch emulation. */
export function forEachViewport(fn: (viewport: Viewport) => void): void {
  for (const viewport of viewports) {
    test.describe(viewport.name, () => {
      test.use({
        viewport: { width: viewport.width, height: viewport.height },
        hasTouch: viewport.pointer === "coarse",
      });
      fn(viewport);
    });
  }
}
