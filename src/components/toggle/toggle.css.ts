import { css } from "lit";

/**
 * The toggle takes the button's size, label and icon styles and only changes
 * the tones: a neutral face when off, an accent tint and accent text when on.
 */
export const toggleStyles = css`
  :host {
    --_face: var(--purr-color-muted-3);
    --_face-pressed: var(--purr-color-muted-1);
    --_face-disabled: var(--purr-color-muted-5);
  }

  :host([pressed]) {
    --_face: color-mix(in srgb, var(--purr-color-accent) 6%, transparent);
    --_face-pressed: color-mix(
      in srgb,
      var(--purr-color-accent) 16%,
      transparent
    );
    --_face-disabled: color-mix(
      in srgb,
      var(--purr-color-accent) 2%,
      transparent
    );
    --_fg: var(--_tone-text);
    --_fg-disabled: color-mix(in srgb, var(--_tone-text) 40%, transparent);
  }

  :host([pressed]) ::slotted(svg) {
    fill: currentColor;
  }

  /* The on state is told by Highlight, not by a tint that forced colors drop. */
  @media (forced-colors: active) {
    :host([pressed]:not(:is([disabled], :disabled))) {
      --purr-face: Highlight;
      --purr-face-hover: Highlight;
      --purr-face-pressed: Highlight;

      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
