import { css } from "lit";

/*
 * Builds on the panel surface. The icon, the text and the close button share
 * one row; the actions sit under the text. The tone colors the icon tile and,
 * for the destructive tone, the title.
 */
export const bannerStyles = css`
  :host {
    --_tone: var(--purr-color-accent);
    --_title: var(--purr-color-foreground);
    --_tile: calc(var(--purr-spacing) * 8);

    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "icon text close"
      ". actions actions";
    max-inline-size: calc(var(--purr-spacing) * 86);
    font: 400 var(--purr-text-sm) / var(--purr-leading-normal)
      var(--purr-font-sans);
    transition: opacity var(--purr-duration-slow) var(--purr-ease-out);
  }

  :host(:not([open])) {
    display: none;
  }

  @starting-style {
    :host([open]) {
      opacity: 0;
    }
  }

  :host([tone="destructive"]) {
    --_tone: var(--purr-color-destructive);
    --_title: var(--purr-color-destructive-text);
  }

  ::slotted([slot="icon"]) {
    grid-area: icon;
    margin-inline-end: var(--purr-space-3);
    box-sizing: border-box;
    inline-size: var(--_tile);
    block-size: var(--_tile);
    padding: calc(var(--_tile) / 4);
    border-radius: var(--purr-radius);
    background: linear-gradient(
      color-mix(in srgb, var(--_tone), var(--purr-color-honeydew) 25%),
      var(--_tone)
    );
    color: var(--purr-color-accent-foreground);
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [part="text"] {
    grid-area: text;
    margin-inline-end: var(--purr-space-3);
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }

  [part="title"] {
    color: var(--_title);
    font-weight: 700;
  }

  ::slotted([slot="title"]) {
    margin: 0;
    font: inherit;
  }

  /* The button's hit region may be larger than its glyph; it hangs into the padding. */
  [part="close"] {
    display: grid;
    grid-area: close;
    place-items: center;
    align-self: start;
    inline-size: var(--purr-size-hit-min);
    block-size: var(--purr-size-hit-min);
    margin: calc((var(--purr-size-hit-min) - var(--purr-icon-md)) / -2);
    padding: 0;
    border: 0;
    border-radius: var(--purr-radius-full);
    background: none;
    color: var(--purr-color-muted-foreground);
    cursor: default;
    transition: color var(--purr-duration-fast) var(--purr-ease-out);
  }

  @media (hover: hover) {
    [part="close"]:hover {
      color: var(--purr-color-foreground);
    }
  }

  [part="close"]:active {
    color: var(--purr-color-foreground);
  }

  [part="close"]:focus-visible {
    outline: var(--purr-ring-width) solid var(--purr-color-ring);
    outline-offset: calc(var(--purr-ring-width) * -1);
  }

  [part="close"] svg {
    inline-size: var(--purr-icon-md);
    block-size: var(--purr-icon-md);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  [part="actions"] {
    display: flex;
    flex-wrap: wrap;
    grid-area: actions;
    gap: var(--purr-gap-controls);
  }

  ::slotted([slot="actions"]) {
    margin-block-start: var(--purr-space-2);
  }

  @media (forced-colors: active) {
    [part="close"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
