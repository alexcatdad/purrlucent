import { css } from "lit";

/*
 * The host takes no box: the native dialog is in the top layer. The alert
 * reads the panel material and the sheet the sheet material, so glass and its
 * solid fallbacks apply through the tokens. The padded panel fills the native
 * dialog, which keeps a press on the backdrop distinguishable from one inside.
 * Only the entry is animated; nothing waits for an animation to end.
 */
export const dialogStyles = css`
  :host {
    display: contents;
  }

  dialog {
    --_material: var(--pl-material-sheet);
    --_filter: var(--pl-material-sheet-filter);
    --_elevation: var(--pl-elevation-sheet);
    --_width: var(--pl-dialog-width, calc(var(--pl-spacing) * 97.5));
    --_icon: calc(var(--pl-spacing) * 16);

    box-sizing: border-box;
    inline-size: var(--_width);
    max-inline-size: calc(100vw - var(--pl-space-8));
    max-block-size: calc(100dvh - var(--pl-space-8));
    margin: auto;
    border: 0;
    border-radius: var(--pl-radius-panel);
    padding: 0;
    background: var(--_material);
    backdrop-filter: var(--pl-lens,) var(--_filter);
    box-shadow: var(--pl-material-edge), var(--_elevation);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    transition:
      opacity var(--pl-duration-slow) var(--pl-ease-out),
      scale var(--pl-duration-slow) var(--pl-ease-out);
  }

  :host([variant="alert"]) dialog {
    --_material: var(--pl-material-panel);
    --_filter: var(--pl-material-panel-filter);
    --_elevation: var(--pl-elevation-panel);
    --_width: calc(var(--pl-spacing) * 65);
    --_icon: calc(var(--pl-spacing) * 18);
  }

  dialog[open] {
    display: flex;
    flex-direction: column;
  }

  /* A manual popover: in the top layer, so it centers itself above the page. */
  :host([nonmodal]) dialog {
    position: fixed;
    inset: 0;
    block-size: fit-content;
  }

  dialog:modal::backdrop {
    background: var(--pl-color-scrim);
    transition: opacity var(--pl-duration-slow) var(--pl-ease-out);
  }

  @starting-style {
    dialog[open] {
      opacity: 0;
      scale: 0.96;
    }

    dialog:modal[open]::backdrop {
      opacity: 0;
    }
  }

  [part="surface"] {
    display: flex;
    flex: 1;
    flex-direction: column;
    box-sizing: border-box;
    min-block-size: 0;
    padding: var(--pl-pad-panel);
  }

  :host([variant="alert"]) [part="surface"] {
    padding-block-start: var(--pl-space-5);
  }

  [part="header"] {
    display: flex;
    align-items: center;
    gap: var(--pl-space-4);
  }

  :host([variant="alert"]) [part="header"] {
    flex-direction: column;
    align-items: stretch;
    gap: var(--pl-space-3);
    padding-inline: var(--pl-space-1-5);
  }

  ::slotted([slot="icon"]) {
    flex: none;
    box-sizing: border-box;
    inline-size: var(--_icon);
    block-size: var(--_icon);
    padding: calc(var(--_icon) / 4);
    border-radius: var(--pl-radius-control);
    background: linear-gradient(
      color-mix(in srgb, var(--pl-color-accent), var(--pl-color-paper) 25%),
      var(--pl-color-accent)
    );
    color: var(--pl-color-accent-foreground);
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [part="text"] {
    flex: 1;
    min-inline-size: 0;
  }

  /* A sheet's title is a step above its body text, so the header reads as one. */
  [part="title"] {
    font-weight: 700;
    font-size: var(--pl-text-lg);
    line-height: var(--pl-leading-body);
  }

  :host([variant="alert"]) [part="title"] {
    font-size: var(--pl-text-sm);
  }

  ::slotted([slot="title"]) {
    margin: 0;
    font: inherit;
    overflow-wrap: anywhere;
  }

  /* The gap sits on the dialog's own wrapper: a page reset (Tailwind's
     preflight) outranks a margin set on the slotted element. */
  [part="description"] {
    margin-block-start: var(--pl-space-1-5);
    font-weight: 400;
    font-size: var(--pl-text-xs);
  }

  [part="description"][hidden] {
    display: none;
  }

  ::slotted([slot="description"]) {
    margin: 0;
  }

  /* The scroll box clips, so it bleeds past the content by a focus ring. */
  [part="body"] {
    --_bleed: var(--pl-space-1);

    flex: 1 1 auto;
    min-block-size: 0;
    margin: calc(var(--pl-space-5) - var(--_bleed)) calc(-1 * var(--_bleed))
      calc(-1 * var(--_bleed));
    padding: var(--_bleed);
    overflow-y: auto;
    overscroll-behavior: contain;
    overflow-wrap: anywhere;
  }

  :host([variant="alert"]) [part="body"] {
    margin: var(--pl-space-3) 0 0;
    padding: 0 var(--pl-space-1-5);
  }

  [part="body"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  [part="actions"] {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--pl-gap-controls);
    margin-block-start: var(--pl-space-5);
  }

  /* The destructive action and the status text sit apart, at the leading edge. */
  ::slotted([destructive]),
  ::slotted([slot="actions-start"]) {
    margin-inline-end: auto;
  }

  /* A button there keeps its own size and colors. */
  ::slotted([slot="actions-start"]:not(pl-button)) {
    min-inline-size: 0;
    color: var(--pl-color-muted-foreground);
  }

  [part="close"] {
    display: grid;
    flex: none;
    place-items: center;
    align-self: flex-start;
    inline-size: var(--pl-size-hit-min);
    block-size: var(--pl-size-hit-min);
    margin: calc((var(--pl-size-hit-min) - var(--pl-icon-md)) / -2);
    padding: 0;
    border: 0;
    border-radius: var(--pl-radius-full);
    background: none;
    color: var(--pl-color-muted-foreground);
    cursor: var(--pl-cursor-interactive);
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

  :host([variant="alert"]) [part="actions"] {
    flex-wrap: nowrap;
    margin-block-start: var(--pl-space-3);
  }

  :host([variant="alert"]) ::slotted([slot="actions"]) {
    flex: 1 1 0;
    margin: 0;
  }

  :host([variant="alert"]) [part="actions"][data-stacked] {
    flex-direction: column;
    align-items: stretch;
    gap: var(--pl-space-1-5);
  }

  :host([variant="alert"]) [part="actions"][data-stacked] ::slotted(*) {
    flex: none;
  }

  @media (forced-colors: active) {
    dialog {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    [part="body"]:focus-visible,
    [part="close"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
