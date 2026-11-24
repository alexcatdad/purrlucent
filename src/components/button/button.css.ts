import { css } from "lit";

/**
 * Look of each variant. Hit region, face states and focus ring come from
 * interactionStyles; a variant only sets the private tones below, and the
 * host maps them to the face and label for the rest and disabled states.
 * Hover is halfway between the rest and pressed faces.
 */
export const buttonStyles = css`
  :host {
    --_tone: var(--pl-color-accent);
    --_tone-text: var(--pl-color-accent-text);
    --_face: var(--pl-material-control);
    --_face-pressed: var(--pl-material-control-pressed);
    --_face-disabled: var(--pl-color-secondary-disabled);
    --_fg: var(--pl-color-foreground);
    --_fg-disabled: var(--pl-color-disabled-foreground);
    --_size: var(--pl-size-md);
    --pl-face: var(--_face);
    --pl-face-pressed: var(--_face-pressed);
    --pl-face-hover: color-mix(in srgb, var(--_face), var(--_face-pressed));

    min-block-size: var(--_size);
    padding: var(--pl-space-1) var(--pl-pad-control);
    border-radius: var(--pl-radius-control);
    color: var(--_fg);
    font: 400 var(--pl-text-sm) / var(--pl-leading-normal) var(--pl-font-sans);
    text-align: center;
    cursor: default;
    user-select: none;
    transition: color var(--pl-duration-fast) var(--pl-ease-out);
  }

  [part="label"] {
    display: inline-flex;
    align-items: center;
    gap: var(--pl-gap-icon);
    overflow-wrap: anywhere;
  }

  ::slotted(svg),
  pl-spinner {
    flex: none;
    inline-size: var(--pl-icon-md);
    block-size: var(--pl-icon-md);
  }

  /* The busy spinner follows the label colour on every variant. */
  pl-spinner {
    --pl-color-selected: currentColor;
    --pl-color-track: color-mix(in srgb, currentColor 25%, transparent);
  }

  /* The spinner takes the icon's place, so an icon button keeps its size. */
  :host([icon][busy]) ::slotted(svg) {
    display: none;
  }

  :host([size="lg"]) {
    --_size: var(--pl-size-lg);
  }

  :host([size="xl"]) {
    --_size: var(--pl-size-xl);

    padding-inline: var(--pl-pad-control-xl);
  }

  /* A round button that holds one icon. It needs an aria-label. */
  :host([icon]) {
    inline-size: var(--_size);
    padding: 0;
    border-radius: var(--pl-radius-full);
  }

  /* Every face but the label-only ghost is glass under the glass material:
     a blur behind it, a lit edge and a light shadow. Tinted and filled faces
     keep their fill. Increased contrast outlines the face instead. */
  :host(:not([variant="ghost"])) {
    backdrop-filter: var(--pl-lens,) var(--pl-material-control-filter);
  }

  /* Only the neutral face is lifted; filled and tinted faces add no shadow. */
  :host(
    :not(
      [variant="ghost"],
      [variant="primary"],
      [variant="tinted"],
      [destructive],
      [default],
      [pressed]
    )
  ) {
    box-shadow: var(--pl-elevation-control);
  }

  :host(:not([variant="ghost"]))::before {
    box-shadow: var(--pl-material-edge);
  }

  @media (prefers-contrast: more) {
    :host(:not([variant="ghost"]))::before {
      box-shadow: var(--pl-boundary);
    }
  }

  /* The preferred action; a default button without a variant of its own. */
  :host([variant="primary"]),
  :host([default][variant="secondary"]) {
    --_face: var(--pl-color-accent);
    --_face-pressed: color-mix(
      in srgb,
      var(--pl-color-accent),
      var(--pl-color-shade) 10%
    );
    --_face-disabled: color-mix(
      in srgb,
      var(--pl-color-accent) 40%,
      transparent
    );
    --_fg: var(--pl-color-accent-foreground);
    --_fg-disabled: color-mix(
      in srgb,
      var(--pl-color-accent-foreground) 50%,
      transparent
    );
  }

  /* In a glass bar a text-only button sits on the thin fill, so the bar hands
     it the primary text color through --pl-material-ghost-text. */
  :host([variant="ghost"]) {
    --_label: var(--pl-material-ghost-text, var(--_tone-text));
    --_face: transparent;
    --_face-pressed: transparent;
    --_face-disabled: transparent;
    --_fg: var(--_label);
    --_fg-disabled: color-mix(in srgb, var(--_tone-text) 50%, transparent);
    --pl-face-hover: var(--pl-color-muted-3);
  }

  :host([variant="ghost"]:state(pressed)) {
    color: color-mix(in srgb, var(--_label), var(--pl-color-foreground) 25%);
  }

  /* A destructive button takes the tinted look in red, never the filled one. */
  :host([destructive]) {
    --_tone: var(--pl-color-destructive);
    --_tone-text: var(--pl-color-destructive-text);
  }

  /* The tint sits on the thick glass fill, which keeps its pink or red label
     legible; solid, the strong capsule is clear and the tint is as before. */
  :host([variant="tinted"]),
  :host([destructive]:not([variant="ghost"])) {
    --_face: color-mix(
      in srgb,
      var(--_tone) var(--pl-material-tone-rest),
      var(--pl-material-capsule-strong)
    );
    --_face-pressed: color-mix(
      in srgb,
      var(--_tone) var(--pl-material-tone-pressed),
      var(--pl-material-capsule-strong)
    );
    --_face-disabled: color-mix(
      in srgb,
      var(--_tone) calc(var(--pl-material-tone-rest) / 2),
      var(--pl-material-capsule-strong)
    );
    --_fg: var(--_tone-text);
    --_fg-disabled: color-mix(in srgb, var(--_tone-text) 40%, transparent);
  }

  :host(:is([disabled], :disabled)) {
    --pl-face: var(--_face-disabled);

    color: var(--_fg-disabled);
  }

  @media (forced-colors: active) {
    :host {
      --pl-face: ButtonFace;
      --pl-face-hover: ButtonFace;
      --pl-face-pressed: ButtonFace;

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
