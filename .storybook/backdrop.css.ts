import { css } from "lit";

// Storybook only: a scene for glass stories to refract. It paints the page
// behind the library, so nothing under src/ ships it. Three overlapping radial
// gradients in palette colors over the background token, and a faint line
// pattern so blur and saturation have edges to show.
export const backdrop = css`
  body[data-backdrop] {
    background:
      radial-gradient(
        circle at 20% 15%,
        var(--pl-color-cerulean) 0,
        transparent 45%
      ),
      radial-gradient(
        circle at 80% 30%,
        var(--pl-color-punch-red) 0,
        transparent 40%
      ),
      radial-gradient(
        circle at 45% 85%,
        var(--pl-color-honeydew) 0,
        transparent 50%
      ),
      repeating-linear-gradient(
        45deg,
        color-mix(in srgb, var(--pl-color-foreground) 8%, transparent) 0 1px,
        transparent 1px 24px
      ),
      var(--pl-color-background);
    background-attachment: fixed;
    min-block-size: 100vh;
  }
`;
