import { css } from "lit";

/*
 * The bar is a row of menus. Each menu is inline and its trigger is the only
 * visible part, so the row only needs spacing; the popups belong to the menus.
 */
export const menubarStyles = css`
  :host {
    display: flex;
    align-items: center;
    gap: var(--pl-gap-controls);
    padding-block: var(--pl-space-1);
    padding-inline: var(--pl-space-3);
    min-block-size: calc(var(--pl-size-md) + var(--pl-space-2));
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }
`;
