import { css } from "lit";

/** Look of each variant. Layout, focus ring, hit area, hover and pressed come from interactionStyles. */
export const buttonStyles = css`
  :host {
    gap: var(--purr-space-2);
    padding: var(--purr-space-2) var(--purr-space-4);
    border: 1px solid transparent;
    border-radius: var(--purr-radius-medium);
    background-color: transparent;
    color: var(--purr-color-accent);
    font: inherit;
    font-family: var(--purr-font-family);
    font-size: var(--purr-font-size-body);
    line-height: 1.25;
    text-align: center;
    cursor: pointer;
    user-select: none;
  }

  [part="label"] {
    overflow-wrap: anywhere;
  }

  :host([destructive]) {
    color: var(--purr-color-destructive);
  }

  :host([variant="bordered"]),
  :host([variant="prominent"][destructive]) {
    border-color: var(--purr-color-separator);
    background-color: var(--purr-color-secondary-background);
  }

  /* A destructive button is never the primary one: it keeps the bordered look. */
  :host([variant="prominent"]:not([destructive])) {
    border-color: var(--purr-color-accent);
    background-color: var(--purr-color-accent);
    color: var(--purr-color-background);
    font-weight: 600;
  }

  @media (hover: hover) {
    :host([variant="prominent"]:not([destructive]):hover) {
      background-color: var(--purr-color-accent);
      filter: brightness(1.1);
    }
  }

  :host([disabled]) {
    opacity: 0.4;
    cursor: default;
    pointer-events: none;
  }

  @media (forced-colors: active) {
    :host([variant="bordered"]),
    :host([variant="prominent"]) {
      border-color: ButtonText;
    }

    :host([variant="prominent"]:not([destructive])) {
      background-color: ButtonFace;
      color: ButtonText;
    }

    :host([disabled]) {
      border-color: GrayText;
      color: GrayText;
      opacity: 1;
    }
  }
`;
