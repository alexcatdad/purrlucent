import { css } from "lit";

/*
 * The bar is the library's bar material. Each top-level control is a row as
 * tall as a sidebar row, at least the hit minimum; its face is drawn by
 * ::before so the focus ring can sit inside it. The panel reads the panel
 * material like the menu's popup, so glass and increased contrast apply
 * through the tokens.
 */
export const navigationMenuStyles = css`
  :host {
    padding: var(--pl-space-1) var(--pl-space-3);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  [part="list"] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--pl-gap-controls);
  }
`;

export const itemStyles = css`
  :host {
    --_row: max(calc(var(--pl-spacing) * 8), var(--pl-size-hit-min));
    --_fill: var(--pl-color-muted-3);

    display: inline-block;
  }

  :host([hidden]) {
    display: none;
  }

  [part="control"] {
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    box-sizing: border-box;
    min-block-size: var(--_row);
    border: 0;
    padding: var(--pl-space-1) var(--pl-pad-item);
    background: transparent;
    color: inherit;
    font: inherit;
    text-decoration: none;
    white-space: nowrap;
    cursor: default;
  }

  [part="control"]::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: var(--pl-radius);
    background-color: transparent;
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    [part="control"]:hover::before {
      background-color: color-mix(in srgb, var(--_fill) 50%, transparent);
    }
  }

  [part="control"]:active::before,
  [part="control"][aria-current]::before,
  [part="control"][aria-expanded="true"]::before {
    background-color: var(--_fill);
  }

  [part="control"]:focus-visible {
    outline: none;
  }

  [part="control"]:focus-visible::before {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  /* Points down; turns up while the panel is open. */
  [part="chevron"] {
    flex: none;
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
    color: var(--pl-color-muted-foreground);
    transition: transform var(--pl-duration) var(--pl-ease-out);
  }

  [aria-expanded="true"] [part="chevron"] {
    transform: rotate(180deg);
  }

  [part="panel"] {
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
    max-block-size: calc(100dvh - var(--pl-space-4));
    min-inline-size: calc(var(--pl-spacing) * 50);
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

  [part="panel"]:popover-open {
    display: flex;
    flex-direction: column;
  }

  /* Entry only: nothing waits for an exit animation to end. */
  @starting-style {
    [part="panel"]:popover-open {
      opacity: 0;
    }
  }

  /* The panel's links are the author's anchors; their face is drawn here. */
  ::slotted([slot="panel"]) {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--_row);
    border-radius: var(--pl-radius);
    padding: var(--pl-space-1) var(--pl-pad-item);
    color: inherit;
    text-decoration: none;
    cursor: default;
    outline: none;
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    ::slotted([slot="panel"]:hover) {
      background-color: color-mix(in srgb, var(--_fill) 50%, transparent);
    }
  }

  ::slotted([slot="panel"]:active),
  ::slotted([slot="panel"][aria-current]) {
    background-color: var(--_fill);
  }

  /* Inset, so the panel does not clip it. */
  ::slotted([slot="panel"]:focus-visible) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  /* The fill alone is faint, so increased contrast adds a stroke. */
  @media (prefers-contrast: more) {
    [part="control"][aria-current]::before,
    ::slotted([slot="panel"][aria-current]) {
      box-shadow: inset 0 0 0 1px var(--pl-color-input-border);
    }
  }

  /* System colors replace ours; the current entry keeps Highlight in every state. */
  @media (forced-colors: active) {
    [part="control"]::before,
    [part="chevron"],
    [part="panel"],
    ::slotted([slot="panel"]) {
      transition: none;
    }

    [part="panel"] {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    [part="control"][aria-current]::before,
    [part="control"][aria-expanded="true"]::before {
      background-color: Highlight;
    }

    [part="control"][aria-current],
    [part="control"][aria-expanded="true"] {
      color: HighlightText;
      forced-color-adjust: none;
    }

    ::slotted([slot="panel"][aria-current]) {
      background-color: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }

    [part="control"]:focus-visible::before {
      outline-color: Highlight;
    }

    [part="control"][aria-current]:focus-visible::before,
    [part="control"][aria-expanded="true"]:focus-visible::before {
      outline-color: HighlightText;
    }

    ::slotted([slot="panel"]:focus-visible) {
      outline-color: Highlight;
    }

    ::slotted([slot="panel"][aria-current]:focus-visible) {
      outline-color: HighlightText;
    }
  }
`;
