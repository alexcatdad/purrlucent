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
    --_material: var(--purr-material-sheet);
    --_filter: var(--purr-material-sheet-filter);
    --_elevation: var(--purr-elevation-sheet);
    --_width: calc(var(--purr-spacing) * 97.5);
    --_icon: calc(var(--purr-spacing) * 16);
    --_scrim: light-dark(
      color-mix(
        in srgb,
        color-mix(
            in srgb,
            var(--purr-color-oxford-navy),
            var(--purr-color-honeydew) 63%
          )
          60%,
        transparent
      ),
      color-mix(in srgb, var(--purr-color-shade) 62%, transparent)
    );

    box-sizing: border-box;
    inline-size: var(--_width);
    max-inline-size: calc(100vw - var(--purr-space-8));
    max-block-size: calc(100dvh - var(--purr-space-8));
    margin: auto;
    border: 0;
    border-radius: var(--purr-radius-lg);
    padding: 0;
    background: var(--_material);
    backdrop-filter: var(--_filter);
    box-shadow: var(--purr-material-edge), var(--_elevation);
    color: var(--purr-color-foreground);
    font: 400 var(--purr-text-sm) / var(--purr-leading-normal)
      var(--purr-font-sans);
    transition:
      opacity var(--purr-duration-slow) var(--purr-ease-out),
      scale var(--purr-duration-slow) var(--purr-ease-out);
  }

  :host([variant="alert"]) dialog {
    --_material: var(--purr-material-panel);
    --_filter: var(--purr-material-panel-filter);
    --_elevation: var(--purr-elevation-panel);
    --_width: calc(var(--purr-spacing) * 65);
    --_icon: calc(var(--purr-spacing) * 18);
  }

  dialog[open] {
    display: flex;
    flex-direction: column;
  }

  dialog::backdrop {
    background: var(--_scrim);
    transition: opacity var(--purr-duration-slow) var(--purr-ease-out);
  }

  @starting-style {
    dialog[open] {
      opacity: 0;
      scale: 0.96;
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
    padding: var(--purr-pad-panel);
  }

  :host([variant="alert"]) [part="surface"] {
    padding-block-start: var(--purr-space-5);
  }

  [part="header"] {
    display: flex;
    align-items: center;
    gap: var(--purr-space-4);
  }

  :host([variant="alert"]) [part="header"] {
    flex-direction: column;
    align-items: stretch;
    gap: var(--purr-space-3);
    padding-inline: var(--purr-space-1-5);
  }

  ::slotted([slot="icon"]) {
    flex: none;
    box-sizing: border-box;
    inline-size: var(--_icon);
    block-size: var(--_icon);
    padding: calc(var(--_icon) / 4);
    border-radius: var(--purr-radius);
    background: linear-gradient(
      color-mix(
        in srgb,
        var(--purr-color-accent),
        var(--purr-color-honeydew) 25%
      ),
      var(--purr-color-accent)
    );
    color: var(--purr-color-accent-foreground);
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

  [part="title"] {
    font-weight: 700;
    font-size: var(--purr-text-base);
  }

  :host([variant="alert"]) [part="title"] {
    font-size: var(--purr-text-sm);
  }

  ::slotted([slot="title"]) {
    margin: 0;
    font: inherit;
    overflow-wrap: anywhere;
  }

  [part="description"] {
    font-weight: 400;
    font-size: var(--purr-text-xs);
  }

  ::slotted([slot="description"]) {
    margin: var(--purr-space-1-5) 0 0;
  }

  /* The scroll box clips, so it bleeds past the content by a focus ring. */
  [part="body"] {
    --_bleed: var(--purr-space-1);

    flex: 1 1 auto;
    min-block-size: 0;
    margin: calc(var(--purr-space-5) - var(--_bleed)) calc(-1 * var(--_bleed))
      calc(-1 * var(--_bleed));
    padding: var(--_bleed);
    overflow-y: auto;
    overscroll-behavior: contain;
    overflow-wrap: anywhere;
  }

  :host([variant="alert"]) [part="body"] {
    margin: var(--purr-space-3) 0 0;
    padding: 0 var(--purr-space-1-5);
  }

  [part="body"]:focus-visible {
    outline: var(--purr-ring-width) solid var(--purr-color-ring);
    outline-offset: calc(var(--purr-ring-width) * -1);
  }

  [part="actions"] {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--purr-gap-controls);
    margin-block-start: var(--purr-space-5);
  }

  /* The destructive action sits apart, at the leading edge. */
  ::slotted([destructive]) {
    margin-inline-end: auto;
  }

  :host([variant="alert"]) [part="actions"] {
    flex-wrap: nowrap;
    margin-block-start: var(--purr-space-3);
  }

  :host([variant="alert"]) ::slotted([slot="actions"]) {
    flex: 1 1 0;
    margin: 0;
  }

  :host([variant="alert"]) [part="actions"][data-stacked] {
    flex-direction: column;
    align-items: stretch;
    gap: var(--purr-space-1-5);
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

    [part="body"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
