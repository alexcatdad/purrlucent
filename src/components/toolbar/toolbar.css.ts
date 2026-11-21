import { css } from "lit";

/* The bar is as tall as --purr-size-bar and centers extra-large controls. */
export const toolbarStyles = css`
  :host {
    position: relative;
    min-block-size: var(--purr-size-bar);
    padding: calc((var(--purr-size-bar) - var(--purr-size-xl)) / 2)
      var(--purr-space-3);
    font: 400 var(--purr-text-sm) / var(--purr-leading-normal)
      var(--purr-font-sans);
  }

  [part="items"] {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--purr-gap-controls);
  }

  /* The one emphasized item sits at the trailing end. */
  ::slotted([variant="primary"]) {
    margin-inline-start: auto;
  }

  /* Scroll edge: content scrolled beneath the bar fades out past its content-facing edge. */
  :host([scrolled])::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-start: 100%;
    block-size: var(--purr-space-2);
    background: linear-gradient(var(--purr-material-bar), transparent);
    pointer-events: none;
  }

  /* Increased contrast already draws the control-boundary edge. */
  @media (prefers-reduced-transparency: reduce) and (not (prefers-contrast: more)) {
    :host([scrolled]) {
      box-shadow: inset 0 -1px 0 var(--purr-color-border);
    }
  }

  @media (prefers-reduced-transparency: reduce), (forced-colors: active) {
    :host([scrolled])::after {
      display: none;
    }
  }
`;

/**
 * Related icon buttons in one raised container. Each round face is at least
 * as large as the hit minimum, and the padding centers it in an extra-large
 * control height. The space between faces belongs to the hit regions, so
 * there is no dead space between neighbors.
 */
export const toolbarGroupStyles = css`
  :host {
    --_tool: max(var(--purr-visual-lg), var(--purr-size-hit-min));
    --_pad: calc((var(--purr-size-xl) - var(--_tool)) / 2);
    --_gap: calc(var(--purr-gap-controls) / 2);

    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--purr-size-xl);
    padding: var(--_pad) max(0px, calc(var(--_pad) - var(--_gap)));
    border-radius: var(--purr-radius);
    background-color: var(--purr-color-overlay);
    box-shadow: 0 0 0 1px var(--purr-color-overlay-border);
  }

  ::slotted(*) {
    --purr-face: transparent;
    --purr-face-hover: var(--purr-color-muted-3);
    --purr-face-pressed: var(--purr-color-muted-1);
    --purr-face-inset: 0 var(--_gap);

    inline-size: calc(var(--_tool) + 2 * var(--_gap));
    min-block-size: var(--_tool);
    padding: 0;
    border-radius: var(--purr-radius-full);
    color: var(--purr-color-foreground);
  }

  ::slotted([disabled]) {
    color: var(--purr-color-disabled-foreground);
  }

  @media (forced-colors: active) {
    /* The item's own forced-colors face and border take over. */
    ::slotted(*) {
      --purr-face: ButtonFace;
      --purr-face-hover: ButtonFace;
      --purr-face-pressed: ButtonFace;

      color: ButtonText;
    }

    ::slotted([disabled]) {
      color: GrayText;
    }
  }
`;
