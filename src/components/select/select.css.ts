import { css } from "lit";

/*
 * The trigger takes the secondary button's face; the popup is a floating
 * panel, so it reads the panel material. Option rows are at least the hit
 * size tall, and the label starts past the check column.
 */
export const selectStyles = css`
  :host {
    --_size: var(--pl-size-md);
    --_pad: var(--pl-pad-control);
    --_glyph: var(--pl-icon-md);
    --_face: var(--pl-material-control-strong);
    --_face-pressed: var(--pl-material-control-strong-pressed);
    --_face-hover: color-mix(in srgb, var(--_face), var(--_face-pressed));

    display: inline-grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--pl-gap-form);
    inline-size: calc(var(--pl-spacing) * 40);
    vertical-align: middle;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="lg"]) {
    --_size: var(--pl-size-lg);
  }

  :host([size="xl"]) {
    --_size: var(--pl-size-xl);
    --_pad: var(--pl-pad-control-xl);
  }

  [part="label"] {
    overflow-wrap: anywhere;
  }

  :host(:not(:state(labelled))) [part="label"] {
    display: none;
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
    border-radius: var(--pl-radius-control);
    padding: 0;
    padding-inline-start: var(--_pad);
    background: var(--_face);
    backdrop-filter: var(--pl-lens,) var(--pl-material-control-filter);
    box-shadow: var(--pl-material-edge);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    text-align: start;
    cursor: var(--pl-cursor-interactive);
    transition:
      background-color var(--pl-duration-fast) var(--pl-ease-out),
      color var(--pl-duration-fast) var(--pl-ease-out);
  }

  /* Increased contrast outlines the trigger instead of lighting its edge. */
  @media (prefers-contrast: more) {
    [part="trigger"] {
      box-shadow: var(--pl-boundary);
    }
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
    cursor: var(--pl-cursor-disabled);
    background: var(--pl-color-secondary-disabled);
    color: var(--pl-color-disabled-foreground);
  }

  [part="trigger"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  [part="value"] {
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part="value"].placeholder {
    color: var(--pl-color-muted-foreground);
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

  @media (forced-colors: active) {
    [part="trigger"] {
      border: 1px solid ButtonText;
      background: ButtonFace;
      color: ButtonText;
      forced-color-adjust: none;
    }

    [part="trigger"][aria-expanded="true"] {
      border-color: Highlight;
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
  }
`;

/** The popup panel. Shared by every component that lists options under a field. */
export const listboxStyles = css`
  [part="listbox"] {
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
    max-block-size: min(
      calc(var(--pl-size-row) * 8),
      calc(100dvh - var(--pl-space-4))
    );
    min-inline-size: var(--_min-inline-size);
    inline-size: max-content;
    max-inline-size: calc(100vw - var(--pl-space-4));
    inset: auto;
    margin: var(--pl-space-1) 0;
    border: 0;
    border-radius: var(--pl-radius-panel);
    padding: var(--pl-pad-surface);
    background: var(--pl-material-panel);
    backdrop-filter: var(--pl-lens,) var(--pl-material-panel-filter);
    box-shadow: var(--pl-material-edge), var(--pl-elevation-panel);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    transition: opacity var(--pl-duration) var(--pl-ease-out);
  }

  /* Entry only: nothing waits for an exit animation to end. */
  @starting-style {
    [part="listbox"]:popover-open {
      opacity: 0;
    }
  }

  @media (forced-colors: active) {
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
    --_label: calc(var(--pl-pad-item) + var(--pl-icon-sm) + var(--pl-gap-icon));

    position: relative;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--pl-size-row);
    border-radius: var(--pl-radius-row);
    padding-inline: var(--_label) var(--pl-pad-item);
    outline: none;
    white-space: nowrap;
    cursor: var(--pl-cursor-interactive);
    transition:
      background-color var(--pl-duration-fast) var(--pl-ease-out),
      color var(--pl-duration-fast) var(--pl-ease-out);
  }

  [part="check"] {
    position: absolute;
    inset-inline-start: var(--pl-pad-item);
    inset-block-start: calc(50% - var(--pl-icon-sm) / 2);
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
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

  /* [data-active]: the option a combobox points at while focus stays in its field. */
  :host(:not([aria-disabled="true"]):focus),
  :host(:not([aria-disabled="true"])[data-active]) {
    background: var(--pl-color-selected);
    color: var(--pl-color-selected-foreground);
  }

  @media (hover: hover) {
    :host(:not([aria-disabled="true"]):hover) {
      background: var(--pl-color-selected);
      color: var(--pl-color-selected-foreground);
    }
  }

  /* Inset, so the popup does not clip it. */
  :host(:focus-visible) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  :host([aria-disabled="true"]) {
    cursor: var(--pl-cursor-disabled);
    color: var(--pl-color-disabled-foreground);
  }

  /* The ring's own color matches the selection fill it sits on. */
  :host(:not([aria-disabled="true"]):focus-visible) {
    outline-color: var(--pl-color-selected-foreground);
  }

  @media (forced-colors: active) {
    :host(:not([aria-disabled="true"]):focus),
    :host(:not([aria-disabled="true"])[data-active]),
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
