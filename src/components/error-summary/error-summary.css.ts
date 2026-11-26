import { css } from "lit";

export const errorSummaryStyles = css`
  :host {
    display: block;
    color: var(--pl-color-foreground);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
  }

  :host([hidden]),
  :host(:not(:state(has-errors))) {
    display: none;
  }

  [part="summary"] {
    padding: var(--pl-space-3) var(--pl-space-4);
    border: var(--pl-ring-offset) solid var(--pl-color-destructive-text);
    border-radius: var(--pl-radius-control);
    background: var(--pl-color-surface-content);
  }

  [part="heading"] {
    margin: 0;
    color: var(--pl-color-destructive-text);
    font-size: var(--pl-text-base);
    font-weight: 700;
    line-height: var(--pl-leading-body);
  }

  [part="list"] {
    margin: var(--pl-space-1) 0 0;
    padding: 0;
    list-style: none;
    overflow-wrap: anywhere;
  }

  [part="link"] {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--pl-size-hit-min);
    color: var(--pl-color-destructive-text);
    overflow-wrap: anywhere;
  }

  [part="summary"]:focus,
  [part="link"]:focus-visible {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  @media (forced-colors: active) {
    [part="link"] {
      color: LinkText;
    }

    [part="summary"]:focus,
    [part="link"]:focus-visible {
      outline-color: Highlight;
    }
  }
`;
