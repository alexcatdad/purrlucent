import { css } from "lit";

/**
 * Focus ring, hit region, and face states for a pressable host.
 * The host is the hit region; the visible face is painted by `::before`, so a
 * press scales the face and never the hit region. Set the face colors on the
 * host itself: `--purr-face` (rest, default transparent), and override
 * `--purr-face-hover` / `--purr-face-pressed`, which otherwise follow the
 * surface the control sits on. The label keeps its color in every state.
 */
export const interactionStyles = css`
  :host {
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-inline-size: var(--purr-hit-min);
    min-block-size: var(--purr-hit-min);
  }

  :host::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background-color: var(--purr-face, transparent);
    transition:
      background-color var(--purr-duration-release) var(--purr-ease-standard),
      scale var(--purr-duration-release) var(--purr-ease-spring);
  }

  @media (hover: hover) {
    :host(:not([disabled]):hover)::before {
      background-color: var(--purr-face-hover);
      transition-duration:
        var(--purr-duration-hover), var(--purr-duration-release);
    }
  }

  :host(:not([disabled]):state(pressed))::before {
    background-color: var(--purr-face-pressed);
    scale: var(--purr-press-scale);
    transition-duration: var(--purr-duration-press);
    transition-timing-function: var(--purr-ease-standard);
  }

  :host([disabled]) {
    color: var(--purr-color-disabled-label);
    cursor: default;
  }

  :host(:focus-visible) {
    outline: var(--purr-focus-width) solid var(--purr-color-focus);
    outline-offset: var(--purr-focus-offset-outside);
  }

  /* System colors replace ours; the ring keeps a solid style, and nothing fades. */
  @media (forced-colors: active) {
    :host::before {
      transition: none;
    }

    :host([disabled]) {
      color: GrayText;
    }

    :host(:focus-visible) {
      outline-color: Highlight;
    }
  }
`;
