import { css } from "lit";

/*
 * The group draws the edge and ring and measures the field row, which grows
 * with the text. The tools sit at the field's bottom edge, so they stay beside
 * the last line while the text grows. The buttons are the medium size and sit
 * --pl-pad-control from the bar's top and bottom: the field's minimum height is
 * a button plus that inset on both sides, and its text is centered in it.
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

  pl-textarea {
    --_h: calc(var(--pl-size-md) + var(--pl-pad-control) * 2);
  }

  [slot="start"],
  [slot="end"] {
    align-items: flex-end;
    gap: var(--pl-gap-controls);
    padding-block: var(--pl-pad-control);
  }

  /* The text is centered in the field's minimum height; one line of it is leading-normal tall. */
  pl-textarea::part(control) {
    padding-block: calc((var(--_h) - var(--pl-leading-normal)) / 2);
  }

  /* About eight lines, then the field scrolls. */
  pl-textarea::part(control) {
    max-block-size: calc(var(--pl-leading-normal) * 7 + var(--_h));
  }
`;
