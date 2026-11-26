import { css } from "lit";

export const stepIndicatorStyles = css`
  :host {
    display: block;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  [part="list"] {
    display: flex;
    flex-wrap: wrap;
    gap: var(--pl-space-2) var(--pl-space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  [part="step"] {
    display: flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    min-inline-size: 0;
    color: var(--pl-color-muted-foreground);
    overflow-wrap: anywhere;
  }

  [part="number"] {
    display: grid;
    flex: none;
    place-items: center;
    min-inline-size: var(--pl-space-6);
    min-block-size: var(--pl-space-6);
    border-radius: var(--pl-radius-full);
    background: var(--pl-color-muted-2);
    font-variant-numeric: tabular-nums;
  }

  [aria-current="step"] {
    color: var(--pl-color-foreground);
    font-weight: 700;
  }

  [aria-current="step"] [part="number"] {
    background: var(--pl-color-selected);
    color: var(--pl-color-selected-foreground);
  }

  @media (forced-colors: active) {
    [part="number"] {
      outline: var(--pl-ring-offset) solid GrayText;
      outline-offset: calc(-1 * var(--pl-ring-offset));
    }

    [aria-current="step"] [part="number"] {
      outline-color: Highlight;
      color: CanvasText;
    }
  }
`;
