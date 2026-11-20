import { css } from "lit";

/** Focus ring, hit area, and hover and pressed styles for a pressable host. */
export const interactionStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  :host(:focus-visible) {
    outline: 2px solid var(--purr-color-focus);
    outline-offset: 2px;
  }

  /* Forced colors replaces the ring's color but keeps a solid style. */
  @media (forced-colors: active) {
    :host(:focus-visible) {
      outline: 2px solid Highlight;
    }
  }

  @media (pointer: coarse) {
    :host {
      min-inline-size: 44px;
      min-block-size: 44px;
    }
  }

  @media (hover: hover) {
    :host(:hover) {
      background-color: var(--purr-color-fill);
    }
  }

  :host(:state(pressed)) {
    opacity: 0.6;
  }
`;
