import { css } from "lit";

/*
 * The host takes no box: the native dialog is in the top layer. It is the
 * panel, pinned to an edge by auto margins. `--_off` is where the panel waits
 * outside the screen, so one rule slides it in and out for every side. The
 * exit is a transition of the closed state; browsers that cannot keep a
 * closed dialog in the top layer (no `overlay`) close it at once instead.
 * The padded surface fills the dialog, which keeps a press on the backdrop
 * distinguishable from one inside.
 */
export const drawerStyles = css`
  :host {
    display: contents;
  }

  dialog {
    --_material: var(--pl-material-sheet);
    --_filter: var(--pl-material-sheet-filter);
    --_elevation: var(--pl-elevation-sheet);
    --_dir: 1;
    --_off: 0 100%;
    --_top-gap: var(--pl-space-10);

    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: min(100vw, calc(var(--pl-spacing) * 160));
    max-block-size: calc(100dvh - var(--_top-gap));
    margin-block: auto 0;
    margin-inline: auto;
    border: 0;
    border-start-start-radius: var(--pl-radius-panel);
    border-start-end-radius: var(--pl-radius-panel);
    padding: 0;
    overflow: hidden;
    background: var(--_material);
    backdrop-filter: var(--pl-lens,) var(--_filter);
    box-shadow: var(--pl-material-edge), var(--_elevation);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    translate: var(--_off);
    transition:
      translate var(--pl-duration-slow) var(--pl-ease-out),
      block-size var(--pl-duration-slow) var(--pl-ease-out);
  }

  dialog:dir(rtl) {
    --_dir: -1;
  }

  dialog[open] {
    display: flex;
    flex-direction: column;
    translate: 0 var(--_drag, 0px);
  }

  dialog[data-dragging] {
    transition: none;
  }

  /* A detent fixes the height; without one the sheet fits its content. */
  dialog[data-detent="medium"] {
    block-size: 50dvh;
  }

  dialog[data-detent="large"] {
    block-size: calc(100dvh - var(--_top-gap));
  }

  :host([side="start"]) dialog,
  :host([side="end"]) dialog {
    inline-size: var(--pl-drawer-width, calc(var(--pl-spacing) * 80));
    max-inline-size: calc(100vw - var(--pl-space-10));
    block-size: 100dvh;
    max-block-size: 100dvh;
    margin-block: 0;
    border-start-start-radius: 0;
    border-start-end-radius: 0;
  }

  :host([side="start"]) dialog {
    --_off: calc(var(--_dir) * -100%) 0;

    margin-inline: 0 auto;
    border-start-end-radius: var(--pl-radius-panel);
    border-end-end-radius: var(--pl-radius-panel);
  }

  :host([side="end"]) dialog {
    --_off: calc(var(--_dir) * 100%) 0;

    margin-inline: auto 0;
    border-start-start-radius: var(--pl-radius-panel);
    border-end-start-radius: var(--pl-radius-panel);
  }

  dialog:not([open]) {
    translate: var(--_off);
  }

  /* While the close plays, the panel and its scrim take no presses. */
  dialog:not([open]),
  dialog:not([open])::backdrop {
    pointer-events: none;
  }

  dialog::backdrop {
    background: var(--pl-color-scrim);
    opacity: 1;
    transition: opacity var(--pl-duration-slow) var(--pl-ease-out);
  }

  dialog:not([open])::backdrop {
    opacity: 0;
  }

  @supports (overlay: auto) and (transition-behavior: allow-discrete) {
    dialog {
      transition:
        translate var(--pl-duration-slow) var(--pl-ease-out),
        block-size var(--pl-duration-slow) var(--pl-ease-out),
        display var(--pl-duration-slow) allow-discrete,
        overlay var(--pl-duration-slow) allow-discrete;
    }

    dialog[data-dragging] {
      transition: none;
    }

    dialog::backdrop {
      transition:
        opacity var(--pl-duration-slow) var(--pl-ease-out),
        display var(--pl-duration-slow) allow-discrete,
        overlay var(--pl-duration-slow) allow-discrete;
    }
  }

  @starting-style {
    dialog[open] {
      translate: var(--_off);
    }

    dialog[open]::backdrop {
      opacity: 0;
    }
  }

  [part="surface"] {
    display: flex;
    flex: 1;
    flex-direction: column;
    box-sizing: border-box;
    min-block-size: 0;
  }

  :host([side="bottom"]) [part="surface"] {
    padding-block-end: env(safe-area-inset-bottom, 0px);
  }

  [part="handle"] {
    flex: none;
    user-select: none;
  }

  :host([side="bottom"]) [part="handle"] {
    touch-action: none;
  }

  [part="grabber"] {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: var(--pl-size-hit-min);
    margin: 0;
    border: 0;
    padding: 0;
    background: none;
    color: var(--pl-color-muted-foreground);
    cursor: var(--pl-cursor-interactive);
  }

  [part="bar"] {
    inline-size: calc(var(--pl-spacing) * 9);
    block-size: var(--pl-space-1-5);
    border-radius: var(--pl-radius-full);
    background: currentColor;
  }

  @media (hover: hover) {
    [part="grabber"]:hover {
      color: var(--pl-color-foreground);
    }
  }

  [part="grabber"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  [part="header"] {
    display: none;
    padding: var(--pl-pad-panel);
    padding-block-end: 0;
  }

  [part="header"]:has(> :not([hidden])) {
    display: block;
  }

  /* The grabber's own height already spaces the header. */
  :host([side="bottom"]) [part="header"] {
    padding-block-start: 0;
  }

  [part="title"] {
    font-weight: 700;
    font-size: var(--pl-text-base);
    line-height: var(--pl-leading-body);
  }

  ::slotted([slot="title"]) {
    margin: 0;
    font: inherit;
    overflow-wrap: anywhere;
  }

  [part="description"] {
    font-weight: 400;
    font-size: var(--pl-text-xs);
  }

  ::slotted([slot="description"]) {
    margin: var(--pl-space-1-5) 0 0;
    overflow-wrap: anywhere;
  }

  [part="body"] {
    flex: 1 1 auto;
    min-block-size: 0;
    padding: var(--pl-pad-panel);
    overflow-y: auto;
    overscroll-behavior: contain;
    overflow-wrap: anywhere;
  }

  [part="body"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  [part="footer"] {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--pl-gap-controls);
    padding: var(--pl-pad-panel);
    padding-block-start: 0;
  }

  [part="footer"][hidden] {
    display: none;
  }

  /* The destructive action sits apart, at the leading edge. */
  ::slotted([destructive]) {
    margin-inline-end: auto;
  }

  @media (forced-colors: active) {
    dialog {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    [part="grabber"] {
      color: CanvasText;
    }

    [part="bar"] {
      forced-color-adjust: none;
      background: CanvasText;
    }

    [part="grabber"]:focus-visible,
    [part="body"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
