import { css } from "lit";

/*
 * A small keycap: a quiet fill, a hairline edge and a slightly heavier label.
 * One key is at least as wide as it is tall, so a single glyph is square.
 */
export const kbdStyles = css`
  :host {
    display: inline-block;
    vertical-align: baseline;
  }

  :host([hidden]) {
    display: none;
  }

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-inline-size: calc(var(--pl-leading-normal) + var(--pl-space-1));
    block-size: calc(var(--pl-leading-normal) + var(--pl-space-1));
    padding-inline: var(--pl-space-1-5);
    border: 1px solid var(--pl-color-border);
    border-radius: var(--pl-radius-control-inner);
    background: var(--pl-color-muted-2);
    color: var(--pl-color-foreground);
    font: 500 var(--pl-text-xs) / 1 var(--pl-font-sans);
    white-space: nowrap;
    /* Keys read left to right in every language: ⌘K stays ⌘K. */
    direction: ltr;
    unicode-bidi: isolate;
    user-select: none;
  }

  @media (forced-colors: active) {
    kbd {
      border-color: ButtonText;
      background: ButtonFace;
      color: ButtonText;
    }
  }
`;
