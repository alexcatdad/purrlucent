import { css } from "lit";

/**
 * Look of each variant. Hit region, face states, focus ring and reduced motion
 * come from interactionStyles; variants only set the face variables and label.
 * Every variant rule has the same specificity, so source order decides.
 */
export const buttonStyles = css`
  :host {
    padding: 0.375rem var(--purr-space-3);
    border-radius: var(--purr-radius-control);
    color: var(--purr-color-accent-text);
    font: var(--purr-font-action);
    text-align: center;
    cursor: pointer;
    user-select: none;
  }

  @media (pointer: coarse) {
    :host {
      padding: 0.6875rem var(--purr-space-4);
    }
  }

  [part="label"] {
    overflow-wrap: anywhere;
  }

  :host([variant="bordered"]),
  :host([variant="prominent"]) {
    --purr-face: var(--purr-color-fill-control);
    --purr-face-hover: var(--purr-color-fill-control-hover);

    color: var(--purr-color-label);
  }

  /* Increased contrast outlines neutral faces only, never the accent fill. */
  :host([variant="bordered"])::before,
  :host([variant="prominent"][destructive])::before {
    box-shadow: var(--purr-boundary);
  }

  /* The preferred action. A destructive or disabled one never takes the accent. */
  :host([variant="prominent"]:where(:not([destructive], [disabled]))) {
    --purr-face: var(--purr-color-accent-fill);
    --purr-face-hover: var(--purr-color-accent-fill-hover);
    --purr-face-pressed: var(--purr-color-accent-fill-pressed);

    color: var(--purr-color-on-accent);
  }

  :host([destructive]) {
    --purr-face-hover: var(--purr-color-destructive-fill);
    --purr-face-pressed: var(--purr-color-destructive-pressed);

    color: var(--purr-color-destructive-text);
  }

  /* Disabled is not shown by color alone: the face goes and the weight drops. */
  :host([disabled]) {
    --purr-face: transparent;

    color: var(--purr-color-disabled-label);
    font: var(--purr-font-body);
  }

  :host([disabled])::before {
    box-shadow: none;
  }

  @media (forced-colors: active) {
    :host([variant]) {
      --purr-face: ButtonFace;
      --purr-face-hover: ButtonFace;
      --purr-face-pressed: ButtonFace;

      color: ButtonText;
    }

    :host([disabled]) {
      color: GrayText;
    }

    :host::before {
      border: 1px solid;
    }
  }
`;
