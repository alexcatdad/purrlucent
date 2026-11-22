import { css } from "lit";

/**
 * The toggle takes the button's size, label and icon styles and only changes
 * the tones: a neutral face when off, the filled selected face of a segmented
 * control when on.
 */
export const toggleStyles = css`
  :host {
    --_face: var(--purr-color-muted-3);
    --_face-pressed: var(--purr-color-muted-1);
    --_face-disabled: var(--purr-color-muted-5);
  }

  :host([pressed]) {
    --_face: color-mix(
      in srgb,
      var(--purr-color-selected) 97%,
      var(--purr-color-shade)
    );
    --_face-pressed: color-mix(
      in srgb,
      var(--purr-color-selected) 85%,
      var(--purr-color-shade)
    );
    --_face-disabled: color-mix(
      in srgb,
      var(--purr-color-selected) 45%,
      transparent
    );
    --_fg: var(--purr-color-selected-foreground);
    --_fg-disabled: color-mix(
      in srgb,
      var(--purr-color-selected-foreground) 50%,
      transparent
    );
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
