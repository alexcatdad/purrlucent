import { css } from "lit";

/*
 * The popup reads the panel material like the select's list, so glass and
 * increased contrast apply through the tokens. Rows are at least the hit size
 * tall. Colors are set on the popup itself: a submenu sits inside its parent
 * row and would otherwise inherit the row's highlight or disabled color.
 */
export const menuStyles = css`
  :host {
    display: inline-block;
  }

  :host([hidden]) {
    display: none;
  }

  /* A submenu has no box of its own; its parent row anchors it. */
  :host([slot="submenu"]) {
    display: contents;
  }

  [part="point"] {
    position: fixed;
    inline-size: 0;
    block-size: 0;
  }

  [part="menu"] {
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
    max-block-size: calc(100dvh - var(--pl-space-4));
    min-inline-size: calc(var(--pl-spacing) * 61);
    inline-size: max-content;
    max-inline-size: calc(100vw - var(--pl-space-4));
    inset: auto;
    margin: var(--pl-space-1) 0;
    border: 0;
    border-radius: var(--pl-radius-lg);
    padding: var(--pl-pad-surface);
    background: var(--pl-material-panel);
    backdrop-filter: var(--pl-material-panel-filter);
    box-shadow: var(--pl-material-edge), var(--pl-elevation-panel);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    transition: opacity var(--pl-duration) var(--pl-ease-out);
  }

  /* A submenu sits inside its parent's popup, which is a backdrop root: a glass
     panel would blur nothing but the parent's own row text. The panel material
     stays on top of an opaque page color so the rows keep their contrast. */
  :host([slot="submenu"]) [part="menu"] {
    min-inline-size: 0;
    margin: 0;
    background:
      linear-gradient(var(--pl-material-panel) 0 0), var(--pl-color-background);
    backdrop-filter: none;
  }

  /* Entry only: nothing waits for an exit animation to end. */
  @starting-style {
    [part="menu"]:popover-open {
      opacity: 0;
    }
  }

  @media (forced-colors: active) {
    [part="menu"],
    :host([slot="submenu"]) [part="menu"] {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
      transition: none;
    }
  }
`;

export const itemStyles = css`
  :host {
    position: relative;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    block-size: var(--pl-size-md);
    min-block-size: var(--pl-size-hit-min);
    border-radius: var(--pl-radius);
    padding-inline: var(--pl-pad-item);
    outline: none;
    white-space: nowrap;
    cursor: default;
    transition:
      background-color var(--pl-duration-fast) var(--pl-ease-out),
      color var(--pl-duration-fast) var(--pl-ease-out);
  }

  :host([hidden]) {
    display: none;
  }

  :host([destructive]) {
    color: var(--pl-color-destructive-text);
  }

  [part="check"] {
    flex: none;
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
    margin-inline-end: var(--pl-gap-icon);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0;
  }

  :host([checked]) [part="check"] {
    opacity: 1;
  }

  ::slotted([slot="icon"]) {
    flex: none;
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
    margin-inline-end: var(--pl-gap-icon);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* The gap sits here: the detail below is ltr, so its own inline start is always the left. */
  [part="label"] {
    flex: 1;
    margin-inline-end: var(--pl-space-2);
  }

  /* Shortcuts read left to right in every language. */
  [part="detail"] {
    direction: ltr;
    color: var(--pl-color-muted-foreground);
  }

  [part="chevron"] {
    flex: none;
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
    margin-inline-start: var(--pl-space-2);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    color: var(--pl-color-muted-foreground);
  }

  :host(:dir(rtl)) [part="chevron"] {
    transform: scaleX(-1);
  }

  /* Zero-size anchors for a submenu: beside the row, and on its other side. */
  [part="anchor"],
  [part="anchor-flip"] {
    position: absolute;
    inline-size: 0;
    block-size: 0;
    inset-block-start: calc(var(--pl-pad-surface) * -1);
  }

  [part="anchor"] {
    inset-inline-start: calc(100% + var(--pl-pad-surface) + var(--pl-space-1));
  }

  [part="anchor-flip"] {
    inset-inline-start: calc((var(--pl-pad-surface) + var(--pl-space-1)) * -1);
  }

  :host(:not([disabled]):focus) {
    background: var(--pl-color-selected);
    color: var(--pl-color-selected-foreground);
  }

  :host(:not([disabled]):focus) :is([part="detail"], [part="chevron"]) {
    color: inherit;
  }

  @media (hover: hover) {
    :host(:not([disabled], [aria-expanded="true"]):hover) {
      background: var(--pl-color-selected);
      color: var(--pl-color-selected-foreground);
    }

    :host(:not([disabled], [aria-expanded="true"]):hover)
      :is([part="detail"], [part="chevron"]) {
      color: inherit;
    }
  }

  /* The row that owns the open submenu, while focus is elsewhere. */
  :host([aria-expanded="true"]:not(:focus)) {
    background: color-mix(in srgb, var(--pl-color-foreground) 8%, transparent);
  }

  /* Inset, so the popup does not clip it. */
  :host(:focus-visible) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  :host([disabled]) {
    color: var(--pl-color-disabled-foreground);
    pointer-events: none;
  }

  @media (forced-colors: active) {
    :host(:not([disabled]):focus) {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }

    :host([aria-expanded="true"]:not(:focus)) {
      outline: 1px solid CanvasText;
    }

    :host([disabled]) {
      color: GrayText;
    }

    :host(:focus-visible) {
      outline-color: HighlightText;
    }
  }
`;

export const separatorStyles = css`
  :host {
    display: block;
    block-size: 1px;
    margin: var(--pl-space-1) var(--pl-pad-item);
    border-radius: var(--pl-radius);
    background: color-mix(in srgb, var(--pl-color-foreground) 12%, transparent);
  }

  @media (forced-colors: active) {
    :host {
      background: CanvasText;
      forced-color-adjust: none;
    }
  }
`;

export const labelStyles = css`
  :host {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    block-size: var(--pl-size-md);
    padding-inline: var(--pl-pad-item);
    color: var(--pl-color-muted-foreground);
    font-weight: 700;
    white-space: nowrap;
  }

  @media (forced-colors: active) {
    :host {
      color: CanvasText;
    }
  }
`;
