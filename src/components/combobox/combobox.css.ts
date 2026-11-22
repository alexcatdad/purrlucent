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
    --_glyph: var(--purr-icon-sm);
    --_button: var(--purr-visual-md);
    --_inset: var(--purr-space-0-5);
    --_face: var(--purr-color-secondary);
    --_face-pressed: var(--purr-color-secondary-pressed);
    --_face-hover: color-mix(in srgb, var(--_face), var(--_face-pressed));
    --_label: calc(
      var(--purr-pad-item) + var(--purr-icon-sm) + var(--purr-gap-icon)
    );

    vertical-align: middle;
  }

  :host([size="lg"]) {
    --_glyph: var(--purr-icon-md);
  }

  :host([size="xl"]) {
    --_glyph: var(--purr-icon-md);
    --_button: calc(var(--purr-spacing) * 7.5);
    --_inset: var(--purr-space-1);
  }

  [part="field"] {
    gap: 0;
    padding-inline-end: 0;
  }

  [part="button"] {
    position: relative;
    flex: none;
    inline-size: max(
      calc(var(--_button) + 2 * var(--_inset)),
      var(--purr-size-hit-min)
    );
    block-size: 100%;
    margin: 0;
    border: 0;
    border-radius: var(--purr-radius);
    padding: 0;
    background: none;
    color: inherit;
    cursor: default;
  }

  [part="button"]::before {
    content: "";
    position: absolute;
    inset: var(--_inset);
    border-radius: var(--purr-radius);
    background: var(--_face);
    transition: background-color var(--purr-duration-fast) var(--purr-ease-out);
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
    outline: var(--purr-ring-width) solid var(--purr-color-ring);
    outline-offset: calc(var(--purr-ring-width) * -1);
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
    color: var(--purr-color-disabled-foreground);
  }

  :host(:disabled) [part="button"]::before {
    background: var(--purr-color-secondary-disabled);
  }

  [part="empty"] {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--purr-size-hit-min);
    padding-inline: var(--_label) var(--purr-pad-item);
    color: var(--purr-color-muted-foreground);
    white-space: nowrap;
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
