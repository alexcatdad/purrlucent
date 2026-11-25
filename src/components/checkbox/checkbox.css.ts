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
    --_h: var(--pl-size-md);
    --_box: var(--pl-icon-md);
    --_gap: var(--pl-space-1);
    --_off: var(--pl-color-muted-1);
    --_tint: transparent;

    /* A label that wraps grows the row downwards: the box stays beside its first
       line, and the padding keeps a one-line row exactly the control height. */
    display: inline-flex;
    align-items: flex-start;
    gap: var(--_gap);
    box-sizing: border-box;
    min-block-size: var(--_h);
    padding-block: max(0px, calc((var(--_h) - 1lh) / 2));
    min-inline-size: var(--pl-size-hit-min);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    cursor: var(--pl-cursor-interactive);
    user-select: none;
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="lg"]) {
    --_h: var(--pl-size-lg);
    --_box: var(--pl-icon-lg);
  }

  :host([size="xl"]) {
    --_h: var(--pl-size-xl);
    --_box: calc(var(--pl-spacing) * 6);
    --_gap: var(--pl-space-2);
  }

  [part="box"] {
    display: grid;
    flex: none;
    place-items: center;
    box-sizing: border-box;
    inline-size: var(--_box);
    block-size: var(--_box);
    /* Centered on the first line of the label. */
    margin-block-start: calc((1lh - var(--_box)) / 2);
    border-radius: var(--_r);
    background-color: var(--_off);
    backdrop-filter: var(--pl-material-control-filter);
    box-shadow: var(--pl-material-edge);
    color: var(--pl-color-selected-foreground);
    transition:
      background-color var(--pl-duration-fast) var(--pl-ease-out),
      opacity var(--pl-duration-fast) var(--pl-ease-out);
  }

  /* Increased contrast outlines the box instead of lighting its edge. */
  @media (prefers-contrast: more) {
    [part="box"] {
      box-shadow: var(--pl-boundary);
    }
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
    transition: transform var(--pl-duration) var(--pl-ease-out);
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
    --_off: var(--pl-color-selected);
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
      --_tint: color-mix(in srgb, var(--pl-color-shade) 8%, transparent);
    }

    :host(
      :hover:not(:state(disabled), :state(checked), :state(indeterminate))
    ) {
      --_off: color-mix(in srgb, var(--pl-color-foreground) 15%, transparent);
    }
  }

  /* :not(:state(disabled)) matches the hover rules' specificity, so the later press wins. */
  :host(:state(pressed):not(:state(disabled))) {
    --_tint: color-mix(in srgb, var(--pl-color-shade) 16%, transparent);
  }

  :host(:state(pressed):not(:state(checked), :state(indeterminate))) {
    --_off: color-mix(in srgb, var(--pl-color-foreground) 19%, transparent);
  }

  :host(:state(disabled)) {
    cursor: var(--pl-cursor-disabled);
    color: var(--pl-color-disabled-foreground);
  }

  :host(:state(disabled)) [part="box"] {
    --_off: var(--pl-color-muted-3);
  }

  /* An empty disabled box keeps an outline, so it still reads against the page. */
  :host(:state(disabled):not(:is(:state(checked), :state(indeterminate))))
    [part="box"] {
    box-shadow: inset 0 0 0 1px var(--pl-color-disabled-foreground);
  }

  :host(:state(disabled):is(:state(checked), :state(indeterminate)))
    [part="box"] {
    --_off: var(--pl-color-selected);

    opacity: 0.45;
  }

  /* The ring follows the box, not the whole row. */
  :host(:focus-visible) {
    outline: none;
  }

  :host(:focus-visible) [part="box"] {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
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
    --_r: calc(var(--pl-radius-control-inner) / 2);
  }

  /* A field marks its control invalid; the message beside it says why. */
  :host([aria-invalid="true"]) [part="box"] {
    box-shadow: inset 0 0 0 1px var(--pl-color-destructive);
  }
`;
