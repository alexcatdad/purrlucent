import { css } from "lit";

/*
 * A one-pixel line in the border token, which already has stronger values for
 * dark mode and increased contrast. The line is a border, so it stays one
 * device-independent pixel at any zoom and mirrors with the writing direction.
 */
export const separatorStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 0;
    border-block-start: 1px solid var(--pl-color-border);
  }

  :host([hidden]) {
    display: none;
  }

  :host([orientation="vertical"]) {
    display: inline-block;
    align-self: stretch;
    inline-size: 0;
    block-size: auto;
    min-block-size: var(--pl-space-4);
    border-block-start: 0;
    border-inline-start: 1px solid var(--pl-color-border);
    vertical-align: middle;
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
    }
  }
`;
