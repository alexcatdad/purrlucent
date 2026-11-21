import { css } from "lit";

/*
 * The box, its glyph and the row around it, shared by the checkbox and the
 * radio. A host sets --_r (the box corner radius) and has the custom states
 * `checked`, `indeterminate`, `pressed`, `disabled` and `labelled`. The host
 * is the hit region: it is at least a hit target tall and wide, and the box
 * keeps its drawn size inside it.
 */
export const boxStyles = css`
  :host {
    --_h: var(--purr-size-md);
    --_box: var(--purr-icon-md);
    --_gap: var(--purr-space-1);
    --_off: var(--purr-color-muted-1);
    --_tint: transparent;

    display: inline-flex;
    align-items: center;
    gap: var(--_gap);
    min-block-size: var(--_h);
    min-inline-size: var(--purr-size-hit-min);
    color: var(--purr-color-foreground);
    font: 500 var(--purr-text-sm) / var(--purr-leading-normal)
      var(--purr-font-sans);
    cursor: default;
    user-select: none;
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="lg"]) {
    --_h: var(--purr-size-lg);
    --_box: var(--purr-icon-lg);
  }

  :host([size="xl"]) {
    --_h: var(--purr-size-xl);
    --_box: calc(var(--purr-spacing) * 6);
    --_gap: var(--purr-space-2);
  }

  [part="box"] {
    display: grid;
    flex: none;
    place-items: center;
    box-sizing: border-box;
    inline-size: var(--_box);
    block-size: var(--_box);
    border-radius: var(--_r);
    background-color: var(--_off);
    box-shadow: var(--purr-boundary);
    color: var(--purr-color-selected-foreground);
    transition:
      background-color var(--purr-duration-fast) var(--purr-ease-out),
      opacity var(--purr-duration-fast) var(--purr-ease-out);
  }

  svg {
    inline-size: 100%;
    block-size: 100%;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3;
    transform: scale(0);
    transition: transform var(--purr-duration) var(--purr-ease-out);
  }

  .dot {
    fill: currentColor;
    stroke: none;
  }

  [part="label"] {
    overflow-wrap: anywhere;
  }

  /* No label text: the box alone, centered in its hit region. */
  :host(:not(:state(labelled))) {
    justify-content: center;
    gap: 0;
  }

  :host(:not(:state(labelled))) [part="label"] {
    display: none;
  }

  :host(:is(:state(checked), :state(indeterminate))) {
    --_off: var(--purr-color-selected);
  }

  :host(:is(:state(checked), :state(indeterminate))) [part="box"] {
    background-image: linear-gradient(var(--_tint) 0 0);
  }

  :host(:is(:state(checked), :state(indeterminate))) svg {
    transform: none;
  }

  .dash {
    display: none;
  }

  :host(:state(indeterminate)) .dash {
    display: inline;
  }

  :host(:state(indeterminate)) .check {
    display: none;
  }

  /* Hover and pressed darken a filled box and deepen an empty one. */
  @media (hover: hover) {
    :host(:hover:not(:state(disabled))) {
      --_tint: color-mix(in srgb, var(--purr-color-shade) 8%, transparent);
    }

    :host(
      :hover:not(:state(disabled), :state(checked), :state(indeterminate))
    ) {
      --_off: color-mix(in srgb, var(--purr-color-foreground) 15%, transparent);
    }
  }

  /* :not(:state(disabled)) matches the hover rules' specificity, so the later press wins. */
  :host(:state(pressed):not(:state(disabled))) {
    --_tint: color-mix(in srgb, var(--purr-color-shade) 16%, transparent);
  }

  :host(:state(pressed):not(:state(checked), :state(indeterminate))) {
    --_off: color-mix(in srgb, var(--purr-color-foreground) 19%, transparent);
  }

  :host(:state(disabled)) {
    color: var(--purr-color-disabled-foreground);
  }

  :host(:state(disabled)) [part="box"] {
    --_off: var(--purr-color-muted-3);
  }

  :host(:state(disabled):is(:state(checked), :state(indeterminate)))
    [part="box"] {
    --_off: var(--purr-color-selected);

    opacity: 0.45;
  }

  /* The ring follows the box, not the whole row. */
  :host(:focus-visible) {
    outline: none;
  }

  :host(:focus-visible) [part="box"] {
    outline: var(--purr-ring-width) solid var(--purr-color-ring);
    outline-offset: var(--purr-ring-offset);
  }

  @media (forced-colors: active) {
    [part="box"] {
      border: 1px solid ButtonText;
      background: Canvas;
      color: HighlightText;
      forced-color-adjust: none;
    }

    :host(:is(:state(checked), :state(indeterminate))) [part="box"] {
      background: Highlight;
    }

    svg {
      transition: none;
    }

    :host(:state(disabled)) {
      color: GrayText;
    }

    :host(:state(disabled)) [part="box"] {
      border-color: GrayText;
      opacity: 1;
    }

    :host(:state(disabled):is(:state(checked), :state(indeterminate)))
      [part="box"] {
      background: GrayText;
      color: Canvas;
    }

    :host(:focus-visible) [part="box"] {
      outline-color: Highlight;
    }
  }
`;

export const checkboxStyles = css`
  :host {
    --_r: calc(var(--purr-radius) / 2);
  }
`;
