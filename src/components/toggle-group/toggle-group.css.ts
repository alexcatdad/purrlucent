import { css } from "lit";

/*
 * The group is the track: equal columns, clipped to its rounded ends. An item
 * fills its whole column, so hover, pressed and selected faces meet the track
 * edge. The size, padding and separator height are set here and read by the
 * items.
 */
export const groupStyles = css`
  :host {
    --_size: var(--pl-size-md);
    --_pad: var(--pl-pad-control);
    --_sep: calc(var(--pl-spacing) * 3.5);
    --_min: calc(var(--pl-spacing) * 7.5);

    display: inline-grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    max-inline-size: 100%;
    overflow: clip;
    border-radius: var(--pl-radius);
    background-color: var(--pl-color-secondary);
    box-shadow: var(--pl-boundary);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([size="lg"]) {
    --_size: var(--pl-size-lg);
    --_sep: calc(var(--pl-spacing) * 4.5);
    --_min: calc(var(--pl-spacing) * 8.5);
  }

  :host([size="xl"]) {
    --_size: var(--pl-size-xl);
    --_pad: var(--pl-pad-control-xl);
    --_sep: calc(var(--pl-spacing) * 5);
    --_min: calc(var(--pl-spacing) * 9.5);
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
    --pl-face-hover: var(--pl-color-muted-3);
    --pl-face-pressed: var(--pl-color-muted-pressed);

    gap: var(--pl-gap-icon);
    min-block-size: var(--_size);
    min-inline-size: max(var(--_min), var(--pl-size-hit-min));
    padding: var(--pl-space-1) var(--_pad);
    cursor: default;
    overflow-wrap: anywhere;
    text-align: center;
    user-select: none;
  }

  [part="label"] {
    display: inline-flex;
    align-items: center;
    gap: var(--pl-gap-icon);
  }

  ::slotted(svg) {
    flex: none;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
  }

  :host(:first-child) {
    border-start-start-radius: var(--pl-radius);
    border-end-start-radius: var(--pl-radius);
  }

  :host(:last-child) {
    border-start-end-radius: var(--pl-radius);
    border-end-end-radius: var(--pl-radius);
  }

  :host::before {
    transition-duration: var(--pl-duration);
  }

  /* A separator at the leading edge of every item but the first. */
  :host(:not(:first-child))::after {
    content: "";
    position: absolute;
    inset-block: calc((100% - var(--_sep)) / 2);
    inset-inline-start: -0.5px;
    inline-size: 1px;
    background-color: var(--pl-color-border);
    transition: opacity var(--pl-duration) var(--pl-ease-out);
  }

  /* No separator on either side of the selected item; the group marks the
     item after it. */
  :host([selected]) {
    --pl-face: color-mix(
      in srgb,
      var(--pl-color-selected) 97%,
      var(--pl-color-shade)
    );
    --pl-face-hover: var(--pl-face);
    --pl-face-pressed: color-mix(
      in srgb,
      var(--pl-color-selected) 85%,
      var(--pl-color-shade)
    );

    color: var(--pl-color-selected-foreground);
  }

  :host([selected])::after,
  :host([data-after-selected])::after {
    opacity: 0;
  }

  :host([selected]:state(disabled)) {
    --pl-face: color-mix(in srgb, var(--pl-color-selected) 45%, transparent);

    color: color-mix(
      in srgb,
      var(--pl-color-selected-foreground) 50%,
      transparent
    );
  }

  /* The ring sits inside the item: the track clips anything outside. */
  :host(:focus-visible) {
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  :host([selected]:focus-visible) {
    outline-color: var(--pl-color-selected-foreground);
  }

  /* System colors replace ours: the selected item paints Highlight. */
  @media (forced-colors: active) {
    :host([selected]:not(:state(disabled))) {
      --pl-face: Highlight;
      --pl-face-hover: Highlight;
      --pl-face-pressed: Highlight;

      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      outline-color: HighlightText;
    }

    /* Disabled, selected: GrayText fill, the reverse of unselected GrayText text. */
    :host([selected]:state(disabled)) {
      --pl-face: GrayText;

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
