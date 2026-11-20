import { css } from "lit";

export const toolbarStyles = css`
  :host {
    font-family: var(--purr-font-family);
    font-size: var(--purr-font-size-body);
  }

  [part="items"] {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0;
  }

  /* The one emphasized item sits at the trailing end. */
  ::slotted([variant="prominent"]) {
    margin-inline-start: auto;
  }
`;
