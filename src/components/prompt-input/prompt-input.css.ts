import { css } from "lit";

/*
 * The group draws the edge and ring and measures the field row, which grows
 * with the text. The tools sit at the field's bottom edge, so they stay beside
 * the last line while the text grows. The field is the large size; the buttons
 * are the medium size, and the padding below derives the difference.
 */
export const promptInputStyles = css`
  :host {
    display: block;
    max-inline-size: 100%;
  }

  :host([hidden]) {
    display: none;
  }

  pl-input-group {
    display: grid;
    inline-size: 100%;
  }

  [hidden] {
    display: none;
  }

  [slot="start"],
  [slot="end"] {
    align-items: flex-end;
    gap: var(--pl-gap-controls);
    padding-block: calc((var(--pl-size-lg) - var(--pl-size-md)) / 2);
  }

  /* About eight lines, then the field scrolls. */
  pl-textarea::part(control) {
    max-block-size: calc(var(--pl-leading-normal) * 8 + var(--pl-space-1) * 2);
  }
`;
