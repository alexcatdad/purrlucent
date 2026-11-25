import { css } from "lit";

/*
 * The bubble is a column: the filled body, and the reactions that overlap its
 * top or bottom edge. Each variant sets a private fill and label color; the
 * label color is the foreground token made for that fill. A link or button
 * body adds a hover and pressed tint through ::before, as pressable hosts do.
 */
export const bubbleStyles = css`
  :host {
    --_fill: var(--pl-color-accent);
    --_fg: var(--pl-color-accent-foreground);
    --_edge: transparent;
    --_radius: var(--pl-radius-panel);
    --_radius-tight: var(--pl-radius-control-inner);
    --_start: flex-start;
    --pl-bubble-max-inline-size: 80%;

    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    inline-size: fit-content;
    max-inline-size: var(--pl-bubble-max-inline-size);
    font: 400 var(--pl-text-base) / var(--pl-leading-body) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  :host([align="end"]) {
    --_start: flex-end;

    margin-inline-start: auto;
  }

  :host([variant="secondary"]) {
    --_fill: var(--pl-color-secondary);
    --_fg: var(--pl-color-foreground);
  }

  :host([variant="muted"]) {
    --_fill: var(--pl-color-muted-3);
    --_fg: var(--pl-color-muted-foreground);
  }

  :host([variant="tinted"]) {
    --_fill: color-mix(in srgb, var(--pl-color-accent) 21%, transparent);
    --_fg: var(--pl-color-accent-text);
  }

  :host([variant="outline"]) {
    --_fill: transparent;
    --_fg: var(--pl-color-foreground);
    --_edge: var(--pl-color-input-border);
  }

  :host([variant="destructive"]) {
    --_fill: color-mix(in srgb, var(--pl-color-destructive) 21%, transparent);
    --_fg: var(--pl-color-destructive-text);
  }

  /* Unframed and full width, for assistant text, markdown and code. */
  :host([variant="ghost"]) {
    --_fill: transparent;
    --_fg: var(--pl-color-foreground);

    inline-size: auto;
    max-inline-size: none;
    margin-inline-start: 0;
  }

  /*
   * The corners next to a neighbor in a pl-bubble-group are tight. The group
   * sets the two flags to 1; alone they are 0.
   */
  [part="body"] {
    --_before: calc(
      var(--_radius) - (var(--_radius) - var(--_radius-tight)) *
        var(--pl-bubble-join-before, 0)
    );
    --_after: calc(
      var(--_radius) - (var(--_radius) - var(--_radius-tight)) *
        var(--pl-bubble-join-after, 0)
    );

    position: relative;
    isolation: isolate;
    display: flex;
    align-items: flex-start;
    gap: var(--pl-gap-icon);
    box-sizing: border-box;
    align-self: var(--_start);
    max-inline-size: 100%;
    padding: var(--pl-space-2) var(--pl-space-3);
    border: 1px solid var(--_edge);
    border-radius: var(--_radius);
    border-start-start-radius: var(--_before);
    border-end-start-radius: var(--_after);
    background: var(--_fill);
    color: var(--_fg);
    font: inherit;
    text-align: start;
    text-decoration: none;
  }

  :host([align="end"]) [part="body"] {
    border-radius: var(--_radius);
    border-start-end-radius: var(--_before);
    border-end-end-radius: var(--_after);
  }

  :host([variant="ghost"]) [part="body"] {
    align-self: stretch;
    padding-inline: 0;
  }

  /* The error mark sits on the first line, so the message is not color alone. */
  [part="body"] > svg {
    flex: none;
    box-sizing: content-box;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
    padding-block: calc((var(--pl-leading-body) - var(--pl-icon-md)) / 2);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [part="content"] {
    flex: 1;
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }

  ::slotted(:not([slot]):first-child) {
    margin-block-start: 0;
  }

  ::slotted(:not([slot]):last-child) {
    margin-block-end: 0;
  }

  /* A link or a button is a control: it meets the minimum target and shows a ring. */
  a[part="body"],
  button[part="body"] {
    min-block-size: var(--pl-size-hit-min);
    min-inline-size: var(--pl-size-hit-min);
    cursor: var(--pl-cursor-interactive);
  }

  a[part="body"]::before,
  button[part="body"]::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background-color: transparent;
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    a[part="body"]:hover::before,
    button[part="body"]:hover::before {
      background-color: var(--pl-color-foreground-ghost);
    }
  }

  a[part="body"]:active::before,
  button[part="body"]:active::before {
    background-color: var(--pl-color-muted-pressed);
  }

  a[part="body"]:focus-visible,
  button[part="body"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  /* System colors drop the fill, so every framed variant gets a real edge. */
  @media (forced-colors: active) {
    [part="body"] {
      border-color: CanvasText;
    }

    :host([variant="ghost"]) [part="body"] {
      border-color: transparent;
    }

    a[part="body"]::before,
    button[part="body"]::before {
      transition: none;
    }

    a[part="body"]:focus-visible,
    button[part="body"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;

/*
 * The reactions are a pill in the bubble's column. A negative margin pulls
 * half of the pill over the body's top or bottom edge; the other half takes
 * its own space, so nothing outside the bubble is covered.
 */
export const reactionsStyles = css`
  :host {
    --_height: var(--pl-visual-md);

    position: relative;
    z-index: 1;
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--pl-gap-icon);
    box-sizing: border-box;
    align-self: flex-end;
    max-inline-size: 100%;
    min-block-size: var(--_height);
    margin-block-start: calc(var(--_height) / -2);
    padding-inline: var(--pl-space-2);
    border: 1px solid var(--pl-color-border);
    border-radius: var(--pl-radius-full);
    background: var(--pl-color-background);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  :host([interactive]) {
    --_height: var(--pl-size-hit-min);
  }

  :host([align="start"]) {
    align-self: flex-start;
  }

  :host([side="top"]) {
    order: -1;
    margin-block: 0 calc(var(--_height) / -2);
  }

  /* Reactions that are buttons: real controls with a ring. */
  ::slotted(button) {
    min-inline-size: var(--pl-size-hit-min);
    min-block-size: var(--pl-size-hit-min);
    margin: 0;
    padding: 0 var(--pl-space-1);
    border: 0;
    border-radius: var(--pl-radius-full);
    background: none;
    color: inherit;
    font: inherit;
    cursor: var(--pl-cursor-interactive);
  }

  ::slotted(button:focus-visible) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
    }

    ::slotted(button:focus-visible) {
      outline-color: Highlight;
    }
  }
`;

export const groupStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: var(--pl-space-0-5);
  }

  :host([hidden]) {
    display: none;
  }

  ::slotted(pl-bubble:not(:first-child)) {
    --pl-bubble-join-before: 1;
  }

  ::slotted(pl-bubble:not(:last-child)) {
    --pl-bubble-join-after: 1;
  }
`;
