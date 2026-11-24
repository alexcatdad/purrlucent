import { css, unsafeCSS } from "lit";

// Storybook only: a scene for glass stories to refract. It paints the page
// behind the library, so nothing under src/ ships it. Three overlapping radial
// gradients in palette colors over the background token, and a faint line
// pattern so blur and saturation have edges to show.
//
// Each hue is mixed to 20% over the background, so the whole scene stays in a
// narrow luminance band of --pl-color-background. Worst case is light mode,
// where the darkest pixel is the red at 20% (about #f2d1cf, luminance 0.69);
// muted-foreground text (ink at 80%) keeps about 7:1 there. Dark mode is
// wider: the brightest pixel (paper at 20% over ink) is still dark, and muted
// text is paper at 72%.
const hue = (color: string) =>
  unsafeCSS(
    `color-mix(in srgb, var(--pl-color-${color}) 20%, var(--pl-color-background))`,
  );

export const backdrop = css`
  body[data-backdrop] {
    background:
      radial-gradient(circle at 20% 15%, ${hue("hot-pink")} 0, transparent 45%),
      radial-gradient(circle at 80% 30%, ${hue("red")} 0, transparent 40%),
      radial-gradient(circle at 45% 85%, ${hue("paper")} 0, transparent 50%),
      repeating-linear-gradient(
        45deg,
        color-mix(in srgb, var(--pl-color-foreground) 5%, transparent) 0 1px,
        transparent 1px calc(var(--pl-spacing) * 6)
      ),
      var(--pl-color-background);
    background-attachment: fixed;
    min-block-size: 100vh;
  }
`;
