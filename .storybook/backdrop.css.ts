import { css, unsafeCSS } from "lit";

// Storybook only: a scene for glass stories to refract. It paints the page
// behind the library, so nothing under src/ ships it. Three overlapping radial
// gradients in palette colors over the background token, and a faint line
// pattern so blur and saturation have edges to show.
//
// Each hue is mixed to 20% over the background, so the whole scene stays in a
// narrow luminance band of --pl-color-background. Worst case is light mode,
// where the darkest pixel is cerulean at 20% (about #cfe1de, luminance 0.72);
// muted-foreground text (navy at 80%, luminance about 0.1) keeps about 5:1
// there. Dark mode is wider: the brightest pixel (honeydew at 20% over navy)
// is still dark, and muted text is frosted blue.
const hue = (color: string) =>
  unsafeCSS(
    `color-mix(in srgb, var(--pl-color-${color}) 20%, var(--pl-color-background))`,
  );

export const backdrop = css`
  body[data-backdrop] {
    background:
      radial-gradient(circle at 20% 15%, ${hue("cerulean")} 0, transparent 45%),
      radial-gradient(
        circle at 80% 30%,
        ${hue("punch-red")} 0,
        transparent 40%
      ),
      radial-gradient(circle at 45% 85%, ${hue("honeydew")} 0, transparent 50%),
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
