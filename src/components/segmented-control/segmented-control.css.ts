import { css } from "lit";

export const controlStyles = css`
  :host {
    display: inline-block;
    box-sizing: border-box;
    max-inline-size: 100%;
    font-family: var(--purr-font-family);
    font-size: var(--purr-font-size-body);
  }

  [part="track"] {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 2px;
    padding: 2px;
    background: var(--purr-color-secondary-background);
    border: 1px solid var(--purr-color-separator);
    border-radius: var(--purr-radius-medium);
  }
`;

export const segmentStyles = css`
  @media not (pointer: coarse) {
    :host {
      min-inline-size: 0;
    }
  }

  :host {
    padding-block: var(--purr-space-1);
    padding-inline: var(--purr-space-3);
    border: 2px solid transparent;
    border-radius: var(--purr-radius-small);
    color: var(--purr-color-label);
    cursor: default;
    overflow-wrap: anywhere;
    text-align: center;
    user-select: none;
    transition:
      background-color var(--purr-duration-fast),
      border-color var(--purr-duration-fast);
  }

  :host([selected]) {
    background-color: var(--purr-color-background);
    border-color: var(--purr-color-accent);
  }

  /* Forced colors drops the fills above, so the selection uses system colors. */
  @media (forced-colors: active) {
    :host([selected]) {
      background-color: Highlight;
      border-color: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
