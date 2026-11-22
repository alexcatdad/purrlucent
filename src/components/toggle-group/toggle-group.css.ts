import { css } from "lit";

/*
 * The group is the track: equal columns, clipped to its rounded ends. An item
 * fills its whole column, so hover, pressed and selected faces meet the track
 * edge. The size, padding and separator height are set here and read by the
 * items.
 */
export const groupStyles = css`
  :host {
    --_size: var(--purr-size-md);
    --_pad: var(--purr-pad-control);
    --_sep: calc(var(--purr-spacing) * 3.5);
    --_min: calc(var(--purr-spacing) * 7.5);

    display: inline-grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    max-inline-size: 100%;
    overflow: clip;
    border-radius: var(--purr-radius);
    background-color: var(--purr-color-secondary);
    box-shadow: var(--purr-boundary);
    color: var(--purr-color-foreground);
    font: 400 var(--purr-text-sm) / var(--purr-leading-normal)
      var(--purr-font-sans);
  }

  :host([size="lg"]) {
    --_size: var(--purr-size-lg);
    --_sep: calc(var(--purr-spacing) * 4.5);
    --_min: calc(var(--purr-spacing) * 8.5);
  }

  :host([size="xl"]) {
    --_size: var(--purr-size-xl);
    --_pad: var(--purr-pad-control-xl);
    --_sep: calc(var(--purr-spacing) * 5);
    --_min: calc(var(--purr-spacing) * 9.5);
  }

  /* Forced colors drop the track's shadow and fill: outline it instead. */
  @media (forced-colors: active) {
    :host {
      outline: 1px solid CanvasText;
    }
  }
`;

export const itemStyles = css`
  :host {
    --purr-face-hover: var(--purr-color-muted-3);
    --purr-face-pressed: var(--purr-color-muted-pressed);

    gap: var(--purr-gap-icon);
    min-block-size: var(--_size);
    min-inline-size: max(var(--_min), var(--purr-size-hit-min));
    padding: var(--purr-space-1) var(--_pad);
    cursor: default;
    overflow-wrap: anywhere;
    text-align: center;
    user-select: none;
  }

  [part="label"] {
    display: inline-flex;
    align-items: center;
    gap: var(--purr-gap-icon);
  }

  ::slotted(svg) {
    flex: none;
    inline-size: var(--purr-icon-md);
    block-size: var(--purr-icon-md);
  }

  :host(:first-child) {
    border-start-start-radius: var(--purr-radius);
    border-end-start-radius: var(--purr-radius);
  }

  :host(:last-child) {
    border-start-end-radius: var(--purr-radius);
    border-end-end-radius: var(--purr-radius);
  }

  :host::before {
    transition-duration: var(--purr-duration);
  }

  /* A separator at the leading edge of every item but the first. */
  :host(:not(:first-child))::after {
    content: "";
    position: absolute;
    inset-block: calc((100% - var(--_sep)) / 2);
    inset-inline-start: -0.5px;
    inline-size: 1px;
    background-color: var(--purr-color-border);
    transition: opacity var(--purr-duration) var(--purr-ease-out);
  }

  /* No separator on either side of the selected item; the group marks the
     item after it. */
  :host([selected]) {
    --purr-face: color-mix(
      in srgb,
      var(--purr-color-selected) 97%,
      var(--purr-color-shade)
    );
    --purr-face-hover: var(--purr-face);
    --purr-face-pressed: color-mix(
      in srgb,
      var(--purr-color-selected) 85%,
      var(--purr-color-shade)
    );

    color: var(--purr-color-selected-foreground);
  }

  :host([selected])::after,
  :host([data-after-selected])::after {
    opacity: 0;
  }

  :host([selected]:state(disabled)) {
    --purr-face: color-mix(
      in srgb,
      var(--purr-color-selected) 45%,
      transparent
    );

    color: color-mix(
      in srgb,
      var(--purr-color-selected-foreground) 50%,
      transparent
    );
  }

  /* The ring sits inside the item: the track clips anything outside. */
  :host(:focus-visible) {
    outline-offset: calc(var(--purr-ring-width) * -1);
  }

  :host([selected]:focus-visible) {
    outline-color: var(--purr-color-selected-foreground);
  }

  /* System colors replace ours: the selected item paints Highlight. */
  @media (forced-colors: active) {
    :host([selected]:not(:state(disabled))) {
      --purr-face: Highlight;
      --purr-face-hover: Highlight;
      --purr-face-pressed: Highlight;

      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      outline-color: HighlightText;
    }

    /* Disabled, selected: GrayText fill, the reverse of unselected GrayText text. */
    :host([selected]:state(disabled)) {
      --purr-face: GrayText;

      forced-color-adjust: none;
      background-color: GrayText;
      color: Canvas;
    }

    :host(:not(:first-child))::after {
      forced-color-adjust: none;
      background-color: CanvasText;
    }
  }
`;
