import { css } from "lit";

export const radioStyles = css`
  :host {
    --_r: var(--purr-radius-full);
  }
`;

export const groupStyles = css`
  :host {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    max-inline-size: 100%;
  }

  :host([hidden]) {
    display: none;
  }

  :host([orientation="horizontal"]) {
    display: inline-grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    align-items: start;
    column-gap: var(--purr-gap-form);
    max-inline-size: 100%;
  }
`;
