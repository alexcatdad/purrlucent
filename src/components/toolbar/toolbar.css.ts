import { css } from "lit";

export const toolbarStyles = css`
  :host {
    position: relative;
    min-block-size: calc(var(--purr-hit-min) + 2 * var(--purr-space-3));
    padding: var(--purr-space-3);
    font: var(--purr-font-body);
  }

  @media (pointer: coarse) {
    :host {
      min-block-size: calc(var(--purr-hit-min) + 2 * var(--purr-space-2));
      padding: var(--purr-space-2) var(--purr-space-4);
    }
  }

  [part="items"] {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--purr-gap-bezeled);
  }

  /* The one emphasized item sits at the trailing end. */
  ::slotted([variant="prominent"]) {
    margin-inline-start: auto;
  }

  /* Scroll edge: content scrolled beneath the bar fades out past its content-facing edge. */
  :host([scrolled])::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-start: 100%;
    block-size: var(--purr-space-2);
    background: linear-gradient(var(--purr-material-bar), transparent);
    pointer-events: none;
  }

  /* Increased contrast already draws the control-boundary edge. */
  @media (prefers-reduced-transparency: reduce) and (not (prefers-contrast: more)) {
    :host([scrolled]) {
      box-shadow: inset 0 -1px 0 var(--purr-color-divider);
    }
  }

  @media (prefers-reduced-transparency: reduce), (forced-colors: active) {
    :host([scrolled])::after {
      display: none;
    }
  }
`;

/** Related symbol items on one flat face; each item face is inset 2px in its cell. */
export const toolbarGroupStyles = css`
  :host {
    display: inline-flex;
    border-radius: var(--purr-radius-control);
    background-color: var(--purr-color-fill-control);
    box-shadow: var(--purr-boundary);
  }

  ::slotted(*) {
    --purr-face: transparent;
    --purr-face-hover: var(--purr-color-fill-control-hover);
    --purr-face-pressed: var(--purr-color-fill-pressed);

    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--purr-radius-control-inner);
    background-color: transparent;
    color: var(--purr-color-label);
  }

  /* Inside the face, which sits 2px in from the cell. */
  ::slotted(:focus-visible) {
    outline-offset: calc(var(--purr-focus-offset-inside) - 2px);
  }

  ::slotted([disabled]) {
    color: var(--purr-color-disabled-label);
  }

  @media (forced-colors: active) {
    /* The item's own forced-colors face and border take over. */
    ::slotted(*) {
      --purr-face: ButtonFace;
      --purr-face-hover: ButtonFace;
      --purr-face-pressed: ButtonFace;

      border: 0;
      color: ButtonText;
    }

    ::slotted([disabled]) {
      color: GrayText;
    }
  }
`;
