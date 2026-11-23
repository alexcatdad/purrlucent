import { css } from "lit";

/*
 * One native input does the editing; it is stretched over the boxes and
 * invisible (opacity, not colour, so UA autofill paint is hidden too). The
 * boxes only draw what it holds. Codes read left to right in every script, so
 * the boxes keep `direction: ltr` and the label and message follow the page.
 */
export const inputOtpStyles = css`
  :host {
    --_h: var(--pl-size-md);
    --_edge: var(--pl-color-input-border);

    display: inline-grid;
    grid-template-columns: minmax(0, max-content);
    gap: var(--pl-gap-form);
    max-inline-size: 100%;
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

  [part="message"] {
    display: flex;
    align-items: flex-start;
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
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--_n), minmax(0, var(--_h)));
    gap: var(--pl-gap-controls);
    direction: ltr;
    cursor: text;
  }

  [part="control"] {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: none;
    opacity: 0;
    font: 400 var(--pl-text-xl) / 1 var(--pl-font-sans);
    cursor: inherit;
    appearance: none;
  }

  [part="box"] {
    box-sizing: border-box;
    display: grid;
    place-items: center;
    block-size: var(--_h);
    border-radius: var(--pl-radius);
    background: var(--pl-material-field);
    backdrop-filter: var(--pl-material-control-filter);
    box-shadow:
      var(--pl-material-edge),
      0 0 0 1px var(--_edge);
    outline: var(--pl-ring-width) solid transparent;
    outline-offset: var(--pl-ring-offset);
    font: 500 var(--pl-text-xl) / 1 var(--pl-font-sans);
    font-variant-numeric: tabular-nums;
    transition:
      background-color var(--pl-duration-fast) var(--pl-ease-out),
      box-shadow var(--pl-duration-fast) var(--pl-ease-out),
      outline-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  [part="box"][data-selected] {
    background: color-mix(
      in srgb,
      var(--pl-color-accent) 24%,
      var(--pl-material-field)
    );
  }

  [part="field"]:has([part="control"]:focus-visible) [part="box"][data-active] {
    outline-color: var(--pl-color-ring);
  }

  :host(:disabled) [part="box"] {
    background: var(--pl-color-muted-disabled);
    box-shadow: 0 0 0 1px var(--pl-color-border);
    color: var(--pl-color-disabled-foreground);
  }

  :host(:disabled) [part="field"] {
    cursor: default;
  }

  @media (forced-colors: active) {
    [part="box"] {
      border: 1px solid ButtonText;
      background: Field;
      box-shadow: none;
      forced-color-adjust: none;
      color: FieldText;
    }

    [part="box"][data-selected] {
      background: Highlight;
      color: HighlightText;
    }

    [part="field"]:has([part="control"]:focus-visible)
      [part="box"][data-active] {
      outline-color: Highlight;
    }

    :host(:state(user-invalid)) [part="box"] {
      border-style: dashed;
    }

    :host(:disabled) [part="box"] {
      border-color: GrayText;
      background: Field;
      color: GrayText;
    }
  }
`;
