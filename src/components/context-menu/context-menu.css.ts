import { css } from "lit";

/*
 * The wrapper has no look of its own. The menu is a `pl-menu` in the `menu`
 * slot; it has no box (its popup is in the top layer), so it takes no space.
 * Touch callouts are off so a long press reaches the menu instead of the
 * system's own sheet.
 */
export const contextMenuStyles = css`
  :host {
    display: block;
    -webkit-touch-callout: none;
  }

  :host([hidden]) {
    display: none;
  }

  :host([disabled]) {
    -webkit-touch-callout: default;
  }

  ::slotted([slot="menu"]) {
    display: contents;
  }
`;
