import { css } from "lit";

/*
 * Builds on the panel surface. The icon, the text and the close button share
 * one row; the actions sit under the text. The tone colors the icon tile and,
 * for the destructive tone, the title.
 */
export const bannerStyles = css`
  :host {
    --_tone: var(--pl-color-accent);
    --_title: var(--pl-color-foreground);
    --_tile: calc(var(--pl-spacing) * 8);

    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "icon text close"
      ". actions actions";
    max-inline-size: calc(var(--pl-spacing) * 86);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    transition: opacity var(--pl-duration-slow) var(--pl-ease-out);
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
    --_tone: var(--pl-color-destructive);
    --_title: var(--pl-color-destructive-text);
  }

  /* A slotted icon, or the tone's own in the slot's fallback. */
  ::slotted([slot="icon"]),
  slot[name="icon"] > svg {
    grid-area: icon;
    margin-inline-end: var(--pl-space-3);
    box-sizing: border-box;
    inline-size: var(--_tile);
    block-size: var(--_tile);
    padding: calc(var(--_tile) / 4);
    border-radius: var(--pl-radius);
    background: linear-gradient(
      color-mix(in srgb, var(--_tone), var(--pl-color-honeydew) 25%),
      var(--_tone)
    );
    color: var(--pl-color-accent-foreground);
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [part="text"] {
    grid-area: text;
    margin-inline-end: var(--pl-space-3);
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }

  [part="title"] {
    color: var(--_title);
    font-weight: 700;
  }

  /* Block, so an inline title (a strong) has a client width in every engine. */
  ::slotted([slot="title"]) {
    display: block;
    margin: 0;
    font: inherit;
  }

  /* The button's hit region may be larger than its glyph; it hangs into the padding. */
  [part="close"] {
    display: grid;
    grid-area: close;
    place-items: center;
    align-self: start;
    inline-size: var(--pl-size-hit-min);
    block-size: var(--pl-size-hit-min);
    margin: calc((var(--pl-size-hit-min) - var(--pl-icon-md)) / -2);
    padding: 0;
    border: 0;
    border-radius: var(--pl-radius-full);
    background: none;
    color: var(--pl-color-muted-foreground);
    cursor: default;
    transition: color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    [part="close"]:hover {
      color: var(--pl-color-foreground);
    }
  }

  [part="close"]:active {
    color: var(--pl-color-foreground);
  }

  [part="close"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  [part="close"] svg {
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  [part="actions"] {
    display: flex;
    flex-wrap: wrap;
    grid-area: actions;
    gap: var(--pl-gap-controls);
  }

  ::slotted([slot="actions"]) {
    margin-block-start: var(--pl-space-2);
  }

  @media (forced-colors: active) {
    [part="close"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
