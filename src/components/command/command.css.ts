import { css } from "lit";

/*
 * Composed with the input styles: the search shell, glyph and clear button are
 * the input's. This makes the host a block that fills its container (a dialog
 * body, usually), and lays the always-visible list under the field. The list
 * scrolls past eight rows. Motion is tokenized, so reduced motion zeroes it.
 */
export const commandStyles = css`
  :host {
    display: grid;
    inline-size: 100%;
    gap: var(--pl-space-2);
  }

  [part="list"] {
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
    max-block-size: calc(var(--pl-size-row) * 8 + var(--pl-pad-surface) * 2);
    padding: var(--pl-pad-surface);
  }

  [part="empty"] {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--pl-size-row);
    padding-inline: var(--pl-pad-item);
    color: var(--pl-color-muted-foreground);
  }

  @media (forced-colors: active) {
    [part="empty"] {
      color: GrayText;
    }
  }
`;

/*
 * A row is at least the hit size tall; a long label wraps and the padding
 * keeps a one-line row that height. The active row takes the selection fill
 * while focus stays in the search field.
 */
export const itemStyles = css`
  :host {
    position: relative;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--pl-size-row);
    border-radius: var(--pl-radius-row);
    padding-block: max(0px, calc((var(--pl-size-row) - 1lh) / 2));
    padding-inline: var(--pl-pad-item);
    cursor: var(--pl-cursor-interactive);
    transition:
      background-color var(--pl-duration-fast) var(--pl-ease-out),
      color var(--pl-duration-fast) var(--pl-ease-out);
  }

  :host([data-filtered]),
  :host([hidden]) {
    display: none;
  }

  ::slotted([slot="icon"]) {
    flex: none;
    inline-size: var(--pl-icon-sm);
    block-size: var(--pl-icon-sm);
    margin-inline-end: var(--pl-gap-icon);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [part="label"] {
    flex: 1;
    min-inline-size: 0;
    margin-inline-end: var(--pl-space-2);
    overflow-wrap: anywhere;
  }

  /* Shortcuts read left to right in every language. */
  [part="detail"] {
    direction: ltr;
    color: var(--pl-color-muted-foreground);
  }

  :host(:not([disabled])[data-active]) {
    background: var(--pl-color-selected);
    color: var(--pl-color-selected-foreground);
  }

  :host(:not([disabled])[data-active]) [part="detail"] {
    color: inherit;
  }

  :host([disabled]) {
    cursor: var(--pl-cursor-disabled);
    color: var(--pl-color-disabled-foreground);
  }

  @media (forced-colors: active) {
    :host(:not([disabled])[data-active]) {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }

    :host([disabled]) {
      color: GrayText;
    }
  }
`;

export const groupStyles = css`
  :host {
    display: block;
  }

  :host([data-filtered]),
  :host([hidden]) {
    display: none;
  }

  [part="heading"] {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--pl-size-row);
    padding-inline: var(--pl-pad-item);
    color: var(--pl-color-muted-foreground);
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  @media (forced-colors: active) {
    [part="heading"] {
      color: CanvasText;
    }
  }
`;
