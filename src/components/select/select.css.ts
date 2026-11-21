import { css } from "lit";

/*
 * The trigger takes the secondary button's face; the popup is a floating
 * panel, so it reads the panel material. Option rows are at least the hit
 * size tall, and the label starts past the check column.
 */
export const selectStyles = css`
  :host {
    --_size: var(--purr-size-md);
    --_pad: var(--purr-pad-control);
    --_glyph: var(--purr-icon-md);
    --_face: var(--purr-color-secondary);
    --_face-pressed: var(--purr-color-secondary-pressed);
    --_face-hover: color-mix(in srgb, var(--_face), var(--_face-pressed));

    display: inline-block;
    inline-size: calc(var(--purr-spacing) * 30);
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="lg"]) {
    --_size: var(--purr-size-lg);
  }

  :host([size="xl"]) {
    --_size: var(--purr-size-xl);
    --_pad: var(--purr-pad-control-xl);
  }

  [part="trigger"] {
    user-select: none;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: var(--_size);
    margin: 0;
    border: 0;
    border-radius: var(--purr-radius);
    padding: 0;
    padding-inline-start: var(--_pad);
    background: var(--_face);
    box-shadow: var(--purr-boundary);
    color: var(--purr-color-foreground);
    font: 500 var(--purr-text-sm) / var(--purr-leading-normal)
      var(--purr-font-sans);
    text-align: start;
    cursor: default;
    transition:
      background-color var(--purr-duration-fast) var(--purr-ease-out),
      color var(--purr-duration-fast) var(--purr-ease-out);
  }

  @media (hover: hover) {
    [part="trigger"]:hover {
      background: var(--_face-hover);
    }
  }

  [part="trigger"]:active,
  [part="trigger"][aria-expanded="true"] {
    background: var(--_face-pressed);
  }

  [part="trigger"][aria-disabled="true"] {
    background: var(--purr-color-secondary-disabled);
    color: var(--purr-color-disabled-foreground);
  }

  [part="trigger"]:focus-visible {
    outline: var(--purr-ring-width) solid var(--purr-color-ring);
    outline-offset: var(--purr-ring-offset);
  }

  [part="value"] {
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part="value"].placeholder {
    color: var(--purr-color-muted-foreground);
  }

  [part="trigger"][aria-disabled="true"] [part="value"].placeholder {
    color: inherit;
  }

  [part="glyph"] {
    flex: none;
    box-sizing: border-box;
    inline-size: var(--_size);
    block-size: var(--_size);
    padding: calc((var(--_size) - var(--_glyph)) / 2);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [part="listbox"] {
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
    max-block-size: min(
      calc(var(--purr-size-hit-min) * 8),
      calc(100dvh - var(--purr-space-4))
    );
    min-inline-size: var(--_min-inline-size);
    inline-size: max-content;
    max-inline-size: calc(100vw - var(--purr-space-4));
    inset: auto;
    margin: var(--purr-space-1) 0;
    border: 0;
    border-radius: var(--purr-radius-lg);
    padding: var(--purr-pad-surface);
    background: var(--purr-material-panel);
    backdrop-filter: var(--purr-material-panel-filter);
    box-shadow: var(--purr-material-edge), var(--purr-elevation-panel);
    color: var(--purr-color-foreground);
    font: 500 var(--purr-text-sm) / var(--purr-leading-normal)
      var(--purr-font-sans);
    transition: opacity var(--purr-duration) var(--purr-ease-out);
  }

  /* Entry only: nothing waits for an exit animation to end. */
  @starting-style {
    [part="listbox"]:popover-open {
      opacity: 0;
    }
  }

  @media (forced-colors: active) {
    [part="trigger"] {
      border: 1px solid ButtonText;
      background: ButtonFace;
      color: ButtonText;
      forced-color-adjust: none;
    }

    [part="trigger"][aria-disabled="true"] {
      border-color: GrayText;
      color: GrayText;
    }

    [part="trigger"]:focus-visible {
      outline-color: Highlight;
    }

    [part="value"].placeholder {
      color: GrayText;
    }

    [part="listbox"] {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
      transition: none;
    }
  }
`;

export const optionStyles = css`
  :host {
    --_label: calc(
      var(--purr-pad-item) + var(--purr-icon-sm) + var(--purr-gap-icon)
    );

    position: relative;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--purr-size-hit-min);
    border-radius: var(--purr-radius);
    padding-inline: var(--_label) var(--purr-pad-item);
    outline: none;
    white-space: nowrap;
    cursor: default;
    transition:
      background-color var(--purr-duration-fast) var(--purr-ease-out),
      color var(--purr-duration-fast) var(--purr-ease-out);
  }

  [part="check"] {
    position: absolute;
    inset-inline-start: var(--purr-pad-item);
    inset-block-start: calc(50% - var(--purr-icon-sm) / 2);
    inline-size: var(--purr-icon-sm);
    block-size: var(--purr-icon-sm);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0;
  }

  :host([aria-selected="true"]) [part="check"] {
    opacity: 1;
  }

  :host(:not([aria-disabled="true"]):focus) {
    background: var(--purr-color-selected);
    color: var(--purr-color-selected-foreground);
  }

  @media (hover: hover) {
    :host(:not([aria-disabled="true"]):hover) {
      background: var(--purr-color-selected);
      color: var(--purr-color-selected-foreground);
    }
  }

  /* Inset, so the popup does not clip it. */
  :host(:focus-visible) {
    outline: var(--purr-ring-width) solid var(--purr-color-ring);
    outline-offset: calc(var(--purr-ring-width) * -1);
  }

  :host([aria-disabled="true"]) {
    color: var(--purr-color-disabled-foreground);
  }

  @media (forced-colors: active) {
    :host(:not([aria-disabled="true"]):focus),
    :host(:not([aria-disabled="true"]):hover) {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }

    :host([aria-disabled="true"]) {
      color: GrayText;
    }

    :host(:focus-visible) {
      outline-color: HighlightText;
    }
  }
`;
