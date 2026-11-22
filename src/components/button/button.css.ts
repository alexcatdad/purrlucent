import { css } from "lit";

/**
 * Look of each variant. Hit region, face states and focus ring come from
 * interactionStyles; a variant only sets the private tones below, and the
 * host maps them to the face and label for the rest and disabled states.
 * Hover is halfway between the rest and pressed faces.
 */
export const buttonStyles = css`
  :host {
    --_tone: var(--purr-color-accent);
    --_tone-text: var(--purr-color-accent-text);
    --_face: var(--purr-color-secondary);
    --_face-pressed: var(--purr-color-secondary-pressed);
    --_face-disabled: var(--purr-color-secondary-disabled);
    --_fg: var(--purr-color-foreground);
    --_fg-disabled: var(--purr-color-disabled-foreground);
    --_size: var(--purr-size-md);
    --purr-face: var(--_face);
    --purr-face-pressed: var(--_face-pressed);
    --purr-face-hover: color-mix(in srgb, var(--_face), var(--_face-pressed));

    min-block-size: var(--_size);
    padding: var(--purr-space-1) var(--purr-pad-control);
    border-radius: var(--purr-radius);
    color: var(--_fg);
    font: 400 var(--purr-text-sm) / var(--purr-leading-normal)
      var(--purr-font-sans);
    text-align: center;
    cursor: default;
    user-select: none;
    transition: color var(--purr-duration-fast) var(--purr-ease-out);
  }

  [part="label"] {
    display: inline-flex;
    align-items: center;
    gap: var(--purr-gap-icon);
    overflow-wrap: anywhere;
  }

  ::slotted(svg) {
    flex: none;
    inline-size: var(--purr-icon-md);
    block-size: var(--purr-icon-md);
  }

  :host([size="lg"]) {
    --_size: var(--purr-size-lg);
  }

  :host([size="xl"]) {
    --_size: var(--purr-size-xl);

    padding-inline: var(--purr-pad-control-xl);
  }

  /* A round button that holds one icon. It needs an aria-label. */
  :host([icon]) {
    inline-size: var(--_size);
    padding: 0;
    border-radius: var(--purr-radius-full);
  }

  /* Increased contrast outlines every face but the label-only ghost. */
  :host(:not([variant="ghost"]))::before {
    box-shadow: var(--purr-boundary);
  }

  /* The preferred action; a default button without a variant of its own. */
  :host([variant="primary"]),
  :host([default][variant="secondary"]) {
    --_face: var(--purr-color-accent);
    --_face-pressed: color-mix(
      in srgb,
      var(--purr-color-accent),
      var(--purr-color-shade) 10%
    );
    --_face-disabled: color-mix(
      in srgb,
      var(--purr-color-accent) 40%,
      transparent
    );
    --_fg: var(--purr-color-accent-foreground);
    --_fg-disabled: color-mix(
      in srgb,
      var(--purr-color-accent-foreground) 50%,
      transparent
    );
  }

  :host([variant="ghost"]) {
    --_face: transparent;
    --_face-pressed: transparent;
    --_face-disabled: transparent;
    --_fg: var(--_tone-text);
    --_fg-disabled: color-mix(in srgb, var(--_tone-text) 50%, transparent);
    --purr-face-hover: var(--purr-color-muted-3);
  }

  :host([variant="ghost"]:state(pressed)) {
    color: color-mix(
      in srgb,
      var(--_tone-text),
      var(--purr-color-foreground) 25%
    );
  }

  /* A destructive button takes the tinted look in red, never the filled one. */
  :host([destructive]) {
    --_tone: var(--purr-color-destructive);
    --_tone-text: var(--purr-color-destructive-text);
  }

  :host([variant="tinted"]),
  :host([destructive]:not([variant="ghost"])) {
    --_face: color-mix(in srgb, var(--_tone) 21%, transparent);
    --_face-pressed: color-mix(in srgb, var(--_tone) 28%, transparent);
    --_face-disabled: color-mix(in srgb, var(--_tone) 10%, transparent);
    --_fg: var(--_tone-text);
    --_fg-disabled: color-mix(in srgb, var(--_tone-text) 40%, transparent);
  }

  :host(:is([disabled], :disabled)) {
    --purr-face: var(--_face-disabled);

    color: var(--_fg-disabled);
  }

  @media (forced-colors: active) {
    :host {
      --purr-face: ButtonFace;
      --purr-face-hover: ButtonFace;
      --purr-face-pressed: ButtonFace;

      color: ButtonText;
    }

    :host(:is([disabled], :disabled)) {
      color: GrayText;
    }

    :host::before {
      border: 1px solid;
    }

    :host(:state(pressed))::before {
      border-color: Highlight;
    }

    @media (hover: hover) {
      :host(:not(:is([disabled], :disabled)):hover)::before {
        border-color: Highlight;
      }
    }
  }
`;
