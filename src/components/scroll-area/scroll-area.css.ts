import { css } from "lit";

/*
 * The host is the native scroller: scrolling, momentum, scroll chaining and
 * keyboard keys are the browser's own. Only the scrollbar is styled, thin and
 * from tokens. A browser that ignores scrollbar-color keeps its own bar.
 */
export const scrollAreaStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    overflow: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--pl-color-thumb) var(--pl-color-track);
    border-radius: var(--pl-radius);
  }

  :host([hidden]) {
    display: none;
  }

  :host(:not([orientation])),
  :host([orientation="vertical"]) {
    overflow-y: auto;
  }

  :host([orientation="horizontal"]) {
    overflow-x: auto;
  }

  :host([orientation="both"]) {
    overflow: auto;
  }

  :host(:focus-visible) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  [part="content"] {
    display: block;
  }

  /* Increased contrast: the thumb takes the stronger border color. */
  @media (prefers-contrast: more) {
    :host {
      scrollbar-color: var(--pl-color-input-border) var(--pl-color-track);
    }
  }

  @media (forced-colors: active) {
    :host {
      scrollbar-color: auto;
    }
  }
`;
