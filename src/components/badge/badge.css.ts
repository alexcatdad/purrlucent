import { css } from "lit";

/*
 * A pill. The three variants pair a fill with the foreground token made for it,
 * the same pairs the buttons use, so the text keeps its contrast in every color
 * scheme. A badge with one short glyph or digit stays round.
 */
export const badgeStyles = css`
  :host {
    --_fill: var(--pl-color-muted-3);
    --_text: var(--pl-color-foreground);

    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-inline-size: calc(var(--pl-leading-normal) + var(--pl-space-1));
    block-size: calc(var(--pl-leading-normal) + var(--pl-space-1));
    padding-inline: var(--pl-space-1-5);
    border: 1px solid transparent;
    border-radius: var(--pl-radius-full);
    background: var(--_fill);
    color: var(--_text);
    font: 600 var(--pl-text-xs) / 1 var(--pl-font-sans);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  :host([variant="accent"]) {
    --_fill: var(--pl-color-accent);
    --_text: var(--pl-color-accent-foreground);
  }

  :host([variant="destructive"]) {
    --_fill: var(--pl-color-destructive);
    --_text: var(--pl-color-destructive-foreground);
  }

  @media (forced-colors: active) {
    :host {
      border-color: ButtonText;
      background: ButtonFace;
      color: ButtonText;
    }
  }
`;
