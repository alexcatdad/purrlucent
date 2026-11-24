import { css } from "lit";

/*
 * The tab list and the panels sit side by side when vertical, stacked when
 * horizontal. The list keeps a hairline on the edge it shares with the panels.
 */
export const tabsStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]) {
    display: none;
  }

  :host([orientation="vertical"]) {
    flex-direction: row;
  }

  /* The indicator's edge, read by the tabs through inheritance. */
  [part="list"] {
    --_ind-block: auto 0;
    --_ind-inline: 0;
    --_ind-block-size: var(--pl-ring-width);
    --_ind-inline-size: auto;

    display: flex;
    flex: none;
    gap: var(--pl-space-1);
    overflow: auto;
    border-block-end: 1px solid var(--pl-color-border);
    background: var(--pl-material-capsule-strong);
    backdrop-filter: var(--pl-material-bar-filter);
    box-shadow: var(--pl-material-edge);
  }

  :host([orientation="vertical"]) [part="list"] {
    --_ind-block: 0;
    --_ind-inline: auto 0;
    --_ind-block-size: auto;
    --_ind-inline-size: var(--pl-ring-width);

    flex-direction: column;
    border-block-end: 0;
    border-inline-end: 1px solid var(--pl-color-border);
  }

  [part="panels"] {
    flex: 1;
    min-inline-size: 0;
  }

  @media (forced-colors: active) {
    [part="list"] {
      border-color: CanvasText;
    }
  }
`;

export const tabStyles = css`
  :host {
    --pl-face-inset: var(--pl-space-0-5);

    flex: none;
    gap: var(--pl-gap-icon);
    min-block-size: var(--pl-size-md);
    padding: var(--pl-space-1) var(--pl-pad-control);
    color: var(--pl-color-muted-foreground);
    cursor: default;
    user-select: none;
    white-space: nowrap;
  }

  :host::before {
    border-radius: var(--pl-radius-control);
  }

  [part="label"] {
    display: inline-flex;
    align-items: center;
    gap: var(--pl-gap-icon);
  }

  ::slotted(svg) {
    flex: none;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
  }

  /* The selected tab has an indicator on the edge it shares with the panels,
     as well as its color. */
  :host::after {
    content: "";
    position: absolute;
    inset-block: var(--_ind-block);
    inset-inline: var(--_ind-inline);
    block-size: var(--_ind-block-size);
    inline-size: var(--_ind-inline-size);
    background-color: currentcolor;
    opacity: 0;
    transition: opacity var(--pl-duration) var(--pl-ease-out);
  }

  :host([selected])::after {
    opacity: 1;
  }

  :host([selected]:not(:state(disabled))) {
    color: var(--pl-color-accent-text);
  }

  /* The ring sits inside the tab: the list clips anything outside. */
  :host(:focus-visible) {
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  @media (forced-colors: active) {
    :host::after {
      forced-color-adjust: none;
      background-color: Highlight;
      transition: none;
    }

    :host([selected]:not(:state(disabled))) {
      color: HighlightText;
      forced-color-adjust: none;
      background-color: Highlight;
    }

    :host([selected]:not(:state(disabled)))::after {
      background-color: HighlightText;
    }
  }
`;

export const panelStyles = css`
  :host {
    display: block;
    padding: var(--pl-pad-panel);
  }

  :host([hidden]) {
    display: none;
  }

  :host(:focus-visible) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: calc(var(--pl-ring-width) * -1);
  }

  @media (forced-colors: active) {
    :host(:focus-visible) {
      outline-color: Highlight;
    }
  }
`;
