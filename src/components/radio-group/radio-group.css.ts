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
    flex-flow: row wrap;
    align-items: center;
    column-gap: var(--purr-gap-form);
  }
`;
