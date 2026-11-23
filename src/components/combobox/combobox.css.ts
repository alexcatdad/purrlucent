import { css } from "lit";

/*
 * Composed with the input and listbox styles: the shell and the editing input
 * are the input's, the popup is the select's. This adds the chevron button at
 * the end of the shell and the "no results" row. The host stays the input's
 * grid, so a label sits above the field. The button is the full shell
 * height and at least the hit size wide; its fill is drawn inset by ::before.
 */
export const comboboxStyles = css`
  :host {
    --_glyph: var(--pl-icon-sm);
    --_button: var(--pl-visual-md);
    --_inset: var(--pl-space-0-5);
    --_face: var(--pl-material-control);
    --_face-pressed: var(--pl-color-secondary-pressed);
    --_face-hover: color-mix(in srgb, var(--_face), var(--_face-pressed));
    --_label: calc(var(--pl-pad-item) + var(--pl-icon-sm) + var(--pl-gap-icon));

    vertical-align: middle;
  }

  :host([size="lg"]) {
    --_glyph: var(--pl-icon-md);
  }

  :host([size="xl"]) {
    --_glyph: var(--pl-icon-md);
    --_button: calc(var(--pl-spacing) * 7.5);
    --_inset: var(--pl-space-1);
  }

  [part="field"] {
    gap: 0;
    padding-inline-end: 0;
  }

  /* A value wider than the field shows that it is cut off. */
  [part="control"] {
    text-overflow: ellipsis;
  }

  /* The list is exactly as wide as the field, so no item is wider than it. */
  [part="listbox"] {
    inline-size: var(--_min-inline-size);
  }

  /* A long option wraps; the padding keeps a one-line row the hit height. */
  ::slotted(pl-option),
  [part="empty"] {
    padding-block: max(0px, calc((var(--pl-size-hit-min) - 1lh) / 2));
    white-space: normal;
    overflow-wrap: anywhere;
  }

  [part="button"] {
    position: relative;
    flex: none;
    inline-size: max(
      calc(var(--_button) + 2 * var(--_inset)),
      var(--pl-size-hit-min)
    );
    block-size: 100%;
    margin: 0;
    border: 0;
    border-radius: var(--pl-radius);
    padding: 0;
    background: none;
    color: inherit;
    cursor: default;
  }

  [part="button"]::before {
    content: "";
    position: absolute;
    inset: var(--_inset);
    border-radius: var(--pl-radius);
    background: var(--_face);
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    [part="button"]:hover::before {
      background: var(--_face-hover);
    }
  }

  [part="button"]:active::before,
  [part="button"][aria-expanded="true"]::before {
    background: var(--_face-pressed);
  }

  [part="button"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  [part="button"] svg {
    position: absolute;
    inset: 0;
    margin: auto;
    inline-size: var(--_glyph);
    block-size: var(--_glyph);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  :host(:disabled) [part="button"] {
    color: var(--pl-color-disabled-foreground);
  }

  :host(:disabled) [part="button"]::before {
    background: var(--pl-color-secondary-disabled);
  }

  [part="empty"] {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--pl-size-hit-min);
    padding-inline: var(--_label) var(--pl-pad-item);
    color: var(--pl-color-muted-foreground);
  }

  @media (forced-colors: active) {
    [part="button"] {
      color: ButtonText;
    }

    [part="button"]::before {
      border: 1px solid ButtonText;
      background: ButtonFace;
      forced-color-adjust: none;
    }

    [part="button"][aria-expanded="true"]::before {
      border-color: Highlight;
    }

    [part="button"]:focus-visible {
      outline-color: Highlight;
    }

    :host(:disabled) [part="button"] {
      color: GrayText;
    }

    :host(:disabled) [part="button"]::before {
      border-color: GrayText;
      background: ButtonFace;
    }

    [part="empty"] {
      color: GrayText;
    }
  }
`;
