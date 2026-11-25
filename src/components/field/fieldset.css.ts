import { css } from "lit";

export const fieldsetStyles = css`
  :host {
    display: grid;
    gap: var(--pl-space-1);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  /* A disabled fieldset reads as off: its legend, and the labels of the fields
     in it, take the disabled color. A field takes its color from the token. */
  :host([disabled]) {
    --pl-color-foreground: var(--pl-color-disabled-foreground);
    --pl-color-muted-foreground: var(--pl-color-disabled-foreground);
  }

  [part="legend"] {
    font-size: var(--pl-text-base);
    line-height: var(--pl-leading-body);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  [part="description"] {
    color: var(--pl-color-muted-foreground);
    overflow-wrap: anywhere;
  }

  [part="fields"] {
    display: grid;
    gap: var(--pl-gap-form);
    margin-block-start: var(--pl-space-2);
  }

  [hidden] {
    display: none;
  }

  @media (forced-colors: active) {
    [part="description"] {
      color: CanvasText;
    }
  }
`;
