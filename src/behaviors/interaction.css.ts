import { css } from "lit";

/**
 * Focus ring, hit region, and face states for a pressable host.
 * The host is the hit region; the visible face is painted by `::before`.
 * Set the face colors on the host: `--pl-face` (rest, default transparent),
 * `--pl-face-hover` and `--pl-face-pressed`. Without them the neutral fills apply.
 * A container sets `--pl-face-inset` to draw the face smaller than the
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
    min-inline-size: var(--pl-size-hit-min);
    min-block-size: var(--pl-size-hit-min);
  }

  :host([hidden]) {
    display: none;
  }

  :host::before {
    content: "";
    position: absolute;
    inset: var(--pl-face-inset, 0);
    z-index: -1;
    border-radius: inherit;
    background-color: var(--pl-face, transparent);
    transition: background-color var(--pl-duration-fast) var(--pl-ease-out);
  }

  @media (hover: hover) {
    :host(:not(:is([disabled], :disabled, :state(disabled))):hover)::before {
      background-color: var(--pl-face-hover, var(--pl-color-muted-3));
    }
  }

  :host(
    :not(:is([disabled], :disabled, :state(disabled))):state(pressed)
  )::before {
    background-color: var(--pl-face-pressed, var(--pl-color-muted-pressed));
  }

  :host(:is([disabled], :disabled, :state(disabled))) {
    color: var(--pl-color-disabled-foreground);
    cursor: var(--pl-cursor-disabled);
  }

  :host(:focus-visible) {
    outline: var(--pl-ring-width) solid var(--pl-color-ring);
    outline-offset: var(--pl-ring-offset);
  }

  /* System colors replace ours; the ring keeps a solid style, and nothing fades. */
  @media (forced-colors: active) {
    :host::before {
      transition: none;
    }

    :host(:is([disabled], :disabled, :state(disabled))) {
      color: GrayText;
    }

    :host(:focus-visible) {
      outline-color: Highlight;
    }
  }
`;
