import { css } from "lit";

/*
 * The shell [part="field"] draws the fill, edge and focus ring; the native
 * control inside it only edits. Height comes from the size tokens, which
 * already grow on coarse pointers. Shared by the text area and number field.
 */
export const fieldStyles = css`
  :host {
    --_h: var(--purr-size-md);
    --_pad: var(--purr-pad-control);
    --_edge: var(--purr-color-input-border);

    display: inline-grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--purr-gap-form);
    inline-size: calc(var(--purr-spacing) * 30);
    color: var(--purr-color-foreground);
    font: 500 var(--purr-text-sm) / var(--purr-leading-normal)
      var(--purr-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  :host([size="lg"]) {
    --_h: var(--purr-size-lg);
  }

  :host([size="xl"]) {
    --_h: var(--purr-size-xl);
    --_pad: var(--purr-pad-control-xl);
  }

  :host(:state(user-invalid)) {
    --_edge: var(--purr-color-destructive);
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
    gap: var(--purr-gap-icon);
    color: var(--purr-color-destructive-text);
    font-size: var(--purr-text-xs);
    overflow-wrap: anywhere;
  }

  :host(:not(:state(user-invalid))) [part="message"] {
    display: none;
  }

  [part="message"] svg {
    flex: none;
    inline-size: var(--purr-icon-md);
    block-size: var(--purr-icon-md);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [part="field"] {
    display: flex;
    align-items: center;
    gap: var(--purr-gap-icon);
    box-sizing: border-box;
    block-size: var(--_h);
    padding-inline: var(--_pad);
    border-radius: var(--purr-radius);
    background: var(--purr-color-input);
    box-shadow: 0 0 0 1px var(--_edge);
    outline: var(--purr-ring-width) solid transparent;
    outline-offset: var(--purr-ring-offset);
    cursor: text;
    transition:
      background-color var(--purr-duration-fast) var(--purr-ease-out),
      box-shadow var(--purr-duration-fast) var(--purr-ease-out),
      outline-color var(--purr-duration-fast) var(--purr-ease-out);
  }

  [part="field"]:has([part="control"]:focus-visible) {
    outline-color: var(--purr-color-ring);
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
    caret-color: var(--purr-color-accent);
    appearance: none;
  }

  /* The UA paints its autofill colour on the input; cover it with the shell's. */
  [part="control"]:-webkit-autofill {
    -webkit-text-fill-color: var(--purr-color-foreground);
    box-shadow: inset 0 0 0 calc(var(--purr-spacing) * 1000)
      var(--purr-color-input);
  }

  [part="control"]::placeholder {
    color: var(--purr-color-muted-foreground);
    opacity: 1;
  }

  :host(:disabled) [part="field"] {
    background: var(--purr-color-muted-disabled);
    box-shadow: 0 0 0 1px var(--purr-color-border);
    color: var(--purr-color-disabled-foreground);
    cursor: default;
  }

  :host(:disabled) [part="control"] {
    -webkit-text-fill-color: var(--purr-color-disabled-foreground);
  }

  :host(:disabled) [part="control"]::placeholder {
    color: var(--purr-color-disabled-foreground);
    -webkit-text-fill-color: var(--purr-color-disabled-foreground);
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
  }
`;

export const inputStyles = [
  fieldStyles,
  css`
    /* Room for about five characters beside the glyph and the clear button. */
    :host(:state(search)) {
      inline-size: max(
        calc(var(--purr-spacing) * 30),
        calc(
          var(--_pad) + var(--purr-icon-lg) + var(--purr-gap-icon) * 2 +
            var(--purr-size-hit-min) + var(--purr-spacing) * 12
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

    /* With a web font the dots show as empty boxes until it loads. */
    [part="control"][type="password"] {
      font-family: system-ui, sans-serif;
      letter-spacing: 0.125em;
    }

    [part="glyph"] {
      flex: none;
      inline-size: var(--purr-icon-lg);
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
      inline-size: var(--purr-size-hit-min);
      block-size: var(--purr-size-hit-min);
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: var(--purr-radius-full);
      background: none;
      color: var(--purr-color-muted-foreground);
      cursor: default;
      transition:
        color var(--purr-duration-fast) var(--purr-ease-out),
        opacity var(--purr-duration-slow) var(--purr-ease-out);

      @starting-style {
        opacity: 0;
      }
    }

    [part="clear"] svg {
      inline-size: var(--purr-icon-md);
      block-size: auto;
      fill: currentColor;
    }

    [part="clear"]:active {
      color: var(--purr-color-foreground);
    }

    [part="clear"]:focus-visible {
      outline: var(--purr-ring-width) solid var(--purr-color-ring);
      outline-offset: calc(var(--purr-ring-width) * -1);
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
