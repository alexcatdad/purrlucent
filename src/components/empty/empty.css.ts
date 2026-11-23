import { css } from "lit";

/*
 * Centered content on the page's own background, so it sits in whatever
 * surface holds it.
 */
export const emptyStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--pl-space-4);
    box-sizing: border-box;
    padding: var(--pl-space-8) var(--pl-space-4);
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    text-align: center;
  }

  [part="text"] {
    max-inline-size: calc(var(--pl-spacing) * 80);
    overflow-wrap: anywhere;
  }

  [part="title"] {
    font-size: var(--pl-text-lg);
    font-weight: 700;
  }

  slot[name="description"] {
    display: block;
    color: var(--pl-color-muted-foreground);
  }

  ::slotted([slot="title"]),
  ::slotted([slot="description"]) {
    display: block;
    margin: 0;
    font: inherit;
  }

  /* Wrappers show only when something is slotted, so the gap stays even. */
  [part="icon"],
  [part="action"] {
    display: none;
  }

  :host(:has(> [slot="icon"])) [part="icon"] {
    display: contents;
  }

  ::slotted([slot="icon"]) {
    box-sizing: border-box;
    inline-size: calc(var(--pl-spacing) * 12);
    block-size: calc(var(--pl-spacing) * 12);
    padding: var(--pl-space-3);
    border-radius: var(--pl-radius-lg);
    background: var(--pl-color-muted-1);
    color: var(--pl-color-muted-foreground);
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  :host(:has(> [slot="action"])) [part="action"] {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--pl-gap-controls);
  }

  @media (forced-colors: active) {
    ::slotted([slot="icon"]) {
      background: none;
    }
  }
`;
