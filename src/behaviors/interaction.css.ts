import { css } from "lit";

/**
 * Focus ring, hit region, and face states for a pressable host.
 * The host is the hit region; the visible face is painted by `::before`.
 * Set the face colors on the host: `--purr-face` (rest, default transparent),
 * `--purr-face-hover` and `--purr-face-pressed`. Without them the neutral fills apply.
 * A container sets `--purr-face-inset` to draw the face smaller than the
 * hit region.
 */
export const interactionStyles = css`
  :host {
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-inline-size: var(--purr-size-hit-min);
    min-block-size: var(--purr-size-hit-min);
  }

  :host([hidden]) {
    display: none;
  }

  :host::before {
    content: "";
    position: absolute;
    inset: var(--purr-face-inset, 0);
    z-index: -1;
    border-radius: inherit;
    background-color: var(--purr-face, transparent);
    transition: background-color var(--purr-duration-fast) var(--purr-ease-out);
  }

  @media (hover: hover) {
    :host(:not(:is([disabled], :disabled)):hover)::before {
      background-color: var(--purr-face-hover, var(--purr-color-muted-3));
    }
  }

  :host(:not(:is([disabled], :disabled)):state(pressed))::before {
    background-color: var(--purr-face-pressed, var(--purr-color-muted-pressed));
  }

  :host(:is([disabled], :disabled)) {
    color: var(--purr-color-disabled-foreground);
    cursor: default;
  }

  :host(:focus-visible) {
    outline: var(--purr-ring-width) solid var(--purr-color-ring);
    outline-offset: var(--purr-ring-offset);
  }

  /* System colors replace ours; the ring keeps a solid style, and nothing fades. */
  @media (forced-colors: active) {
    :host::before {
      transition: none;
    }

    :host(:is([disabled], :disabled)) {
      color: GrayText;
    }

    :host(:focus-visible) {
      outline-color: Highlight;
    }
  }
`;
