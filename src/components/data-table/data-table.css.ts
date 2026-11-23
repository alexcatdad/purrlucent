import { css } from "lit";

export const dataTableStyles = css`
  :host {
    display: block;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  /* The element's own max-block-size bounds the scroll area. */
  pl-table {
    max-block-size: inherit;
  }

  /* A sortable heading is a button in the cell; the cell keeps its th role. */
  th button {
    display: inline-flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    min-block-size: var(--pl-size-hit-min);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--pl-radius);
    background: none;
    color: inherit;
    font: inherit;
    text-align: inherit;
    cursor: default;
    transition: color var(--pl-duration-fast) var(--pl-ease-out);
  }

  th[aria-sort] button {
    color: var(--pl-color-foreground);
  }

  @media (hover: hover) {
    th button:hover {
      color: var(--pl-color-foreground);
    }
  }

  th button:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  th svg {
    flex: none;
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  th:not([aria-sort]) svg {
    color: var(--pl-color-muted-foreground);
  }

  /* The selection column holds only a checkbox. */
  .select {
    inline-size: var(--pl-size-hit-min);
    padding-inline-end: 0;
  }

  .select pl-checkbox {
    vertical-align: middle;
  }

  .empty {
    padding-block: var(--pl-space-8);
    color: var(--pl-color-muted-foreground);
    text-align: center;
  }

  @media (forced-colors: active) {
    th button {
      transition: none;
    }

    th button:focus-visible {
      outline-color: Highlight;
    }

    th:not([aria-sort]) svg {
      color: ButtonText;
    }
  }
`;
