import { css } from "lit";

/*
 * The shell [part="field"] draws the fill, edge and focus ring; the native
 * control inside it only edits. Height comes from the size tokens, which
 * already grow on coarse pointers. Shared by the text area and number field.
 */
export const fieldStyles = css`
  :host {
    --_h: var(--pl-size-md);
    --_pad: var(--pl-pad-control);
    --_edge: var(--pl-color-input-border);

    display: inline-grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--pl-gap-form);
    inline-size: calc(var(--pl-spacing) * 40);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="lg"]) {
    --_h: var(--pl-size-lg);
  }

  :host([size="xl"]) {
    --_h: var(--pl-size-xl);
    --_pad: var(--pl-pad-control-xl);
  }

  :host(:state(user-invalid)) {
    --_edge: var(--pl-color-destructive);
  }

  [part="label"] {
    overflow-wrap: anywhere;
  }

  :host(:not(:state(labelled))) [part="label"] {
    display: none;
  }

  /* The validation message: the icon and text say what the red edge only shows. */
  [part="message"] {
    display: flex;
    align-items: flex-start;
    justify-self: stretch;
    min-inline-size: 0;
    gap: var(--pl-gap-icon);
    color: var(--pl-color-destructive-text);
    font-size: var(--pl-text-xs);
    overflow-wrap: anywhere;
  }

  :host(:not(:state(user-invalid))) [part="message"] {
    display: none;
  }

  [part="message"] svg {
    flex: none;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [part="field"] {
    display: flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    box-sizing: border-box;
    block-size: var(--_h);
    padding-inline: var(--_pad);
    border-radius: var(--pl-radius);
    background: var(--pl-material-field);
    backdrop-filter: var(--pl-material-control-filter);
    box-shadow:
      var(--pl-material-edge),
      0 0 0 1px var(--_edge);
    outline: var(--pl-ring-width) solid transparent;
    outline-offset: var(--pl-ring-offset);
    cursor: text;
    transition:
      background-color var(--pl-duration-fast) var(--pl-ease-out),
      box-shadow var(--pl-duration-fast) var(--pl-ease-out),
      outline-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  [part="field"]:has([part="control"]:focus-visible) {
    outline-color: var(--pl-color-ring);
  }

  [part="control"] {
    flex: 1;
    min-inline-size: 0;
    block-size: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: none;
    color: inherit;
    font: inherit;
    caret-color: var(--pl-color-accent);
    appearance: none;
  }

  /* The UA paints its autofill colour on the input; cover it with the shell's. */
  [part="control"]:-webkit-autofill {
    -webkit-text-fill-color: var(--pl-color-foreground);
    box-shadow: inset 0 0 0 calc(var(--pl-spacing) * 1000) var(--pl-color-input);
  }

  [part="control"]::placeholder {
    color: var(--pl-color-muted-foreground);
    opacity: 1;
  }

  :host(:disabled) [part="field"] {
    background: var(--pl-color-muted-disabled);
    box-shadow: 0 0 0 1px var(--pl-color-border);
    color: var(--pl-color-disabled-foreground);
    cursor: default;
  }

  :host(:disabled) [part="control"] {
    -webkit-text-fill-color: var(--pl-color-disabled-foreground);
  }

  :host(:disabled) [part="control"]::placeholder {
    color: var(--pl-color-disabled-foreground);
    -webkit-text-fill-color: var(--pl-color-disabled-foreground);
  }

  /* Inside a pl-input-group the group draws the edge, fill and ring. */
  :host([data-grouped]) [part="field"] {
    background: none;
    backdrop-filter: none;
    box-shadow: none;
    outline-color: transparent;
  }

  @media (forced-colors: active) {
    [part="field"] {
      border: 1px solid ButtonText;
      background: Field;
      box-shadow: none;
      forced-color-adjust: none;
      color: FieldText;
    }

    [part="control"]::placeholder {
      color: GrayText;
    }

    [part="field"]:has([part="control"]:focus-visible) {
      outline-color: Highlight;
    }

    :host(:state(user-invalid)) [part="field"] {
      border-style: dashed;
    }

    :host(:disabled) [part="field"] {
      border-color: GrayText;
      background: Field;
      color: GrayText;
    }

    :host(:disabled) [part="control"] {
      -webkit-text-fill-color: GrayText;
    }

    :host([data-grouped]) [part="field"] {
      border: 0;
      background: none;
      outline-color: transparent;
    }
  }
`;

export const inputStyles = [
  fieldStyles,
  css`
    /* Room for about five characters beside the glyph and the clear button. */
    :host(:state(search)) {
      inline-size: max(
        calc(var(--pl-spacing) * 40),
        calc(
          var(--_pad) + var(--pl-icon-lg) + var(--pl-gap-icon) * 2 +
            var(--pl-size-hit-min) + var(--pl-spacing) * 12
        )
      );
    }

    :host(:state(clearable)) [part="field"] {
      padding-inline-end: 0;
    }

    [part="control"]::-webkit-search-decoration,
    [part="control"]::-webkit-search-cancel-button,
    [part="control"]::-webkit-search-results-button {
      appearance: none;
      display: none;
    }

    /* A value wider than the field ends in an ellipsis while it is not being edited. */
    [part="control"] {
      text-overflow: ellipsis;
    }

    /* With a web font the dots show as empty boxes until it loads. */
    [part="control"][type="password"] {
      font-family: system-ui, sans-serif;
      letter-spacing: 0.125em;
    }

    [part="glyph"] {
      flex: none;
      inline-size: var(--pl-icon-lg);
      block-size: auto;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    [part="clear"] {
      flex: none;
      display: grid;
      place-items: center;
      inline-size: var(--pl-size-hit-min);
      block-size: var(--pl-size-hit-min);
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: var(--pl-radius-full);
      background: none;
      color: var(--pl-color-muted-foreground);
      cursor: default;
      transition:
        color var(--pl-duration-fast) var(--pl-ease-out),
        opacity var(--pl-duration-slow) var(--pl-ease-out);

      @starting-style {
        opacity: 0;
      }
    }

    [part="clear"] svg {
      inline-size: var(--pl-icon-md);
      block-size: auto;
      fill: currentColor;
    }

    [part="clear"]:active {
      color: var(--pl-color-foreground);
    }

    [part="clear"]:focus-visible {
      outline: var(--pl-ring-width) solid var(--pl-color-ring);
      outline-offset: calc(var(--pl-ring-width) * -1);
    }

    @media (forced-colors: active) {
      [part="clear"] {
        color: ButtonText;
      }

      [part="clear"]:focus-visible {
        outline-color: Highlight;
      }
    }
  `,
];
