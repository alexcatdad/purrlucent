import { css } from "lit";

/*
 * The toaster is a fixed column at the inline-end bottom edge. It is empty
 * space around the toasts, so it ignores the pointer and only the toasts
 * take it. It is a popover only for the top layer: the UA popover box
 * (centered, bordered, padded) is replaced here.
 */
export const toasterStyles = css`
  :host {
    position: fixed;
    inset: auto;
    inset-block-end: max(var(--pl-space-4), env(safe-area-inset-bottom));
    inset-inline-end: var(--pl-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--pl-space-2);
    box-sizing: border-box;
    inline-size: calc(var(--pl-spacing) * 90);
    max-inline-size: calc(100vw - var(--pl-space-4) * 2);
    margin: 0;
    padding: 0;
    border: 0;
    overflow: visible;
    background: none;
    color: inherit;
    pointer-events: none;
  }

  ::slotted(pl-toast) {
    pointer-events: auto;
  }
`;

/*
 * Builds on the panel surface. The destructive variant's icon, the text and
 * the close button share one row; the action sits under the text. A toast
 * that appears fades and rises a little; the motion tokens are 0s under
 * reduced motion, and nothing waits for the transition to end.
 */
export const toastStyles = css`
  :host {
    --_title: var(--pl-color-foreground);

    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "icon text close"
      ". actions actions";
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    transition:
      opacity var(--pl-duration-slow) var(--pl-ease-out),
      transform var(--pl-duration-slow) var(--pl-ease-out);
  }

  :host([hidden]) {
    display: none;
  }

  @starting-style {
    :host {
      opacity: 0;
      transform: translateY(var(--pl-space-2));
    }
  }

  :host([variant="destructive"]) {
    --_title: var(--pl-color-destructive-text);
  }

  [part="icon"] {
    grid-area: icon;
    margin-inline-end: var(--pl-space-3);
    color: var(--pl-color-destructive-text);
  }

  [part="icon"] svg {
    display: block;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
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

  ::slotted([slot="action"]) {
    margin-block-start: var(--pl-space-2);
  }

  @media (forced-colors: active) {
    [part="close"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
