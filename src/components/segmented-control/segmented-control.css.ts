import { css } from "lit";

/*
 * The track holds three layers in one grid cell: the sliding pill (below the
 * segments), the row of segments, and a bold on-accent copy of the labels that
 * is clipped to the pill. The copy sizes the equal columns at weight 600 and is
 * shown only while the pill travels; at rest the selected segment paints its
 * own label, hover and pressed tones over the pill. Faces are inset 2px.
 */
export const controlStyles = css`
  :host {
    --_pad: calc(var(--purr-space-1) + 2px) calc(var(--purr-space-3) + 2px);

    display: inline-block;
    max-inline-size: 100%;
    font: var(--purr-font-body);
  }

  @media (pointer: coarse) {
    :host {
      --_pad: calc(0.5625rem + 2px) calc(0.875rem + 2px);
    }
  }

  [part="track"] {
    --purr-face-hover: var(--purr-color-fill-control-hover);
    --_start: calc(var(--_i) * 100% / var(--_n) + 2px);
    --_end: calc((var(--_n) - 1 - var(--_i)) * 100% / var(--_n) + 2px);

    position: relative;
    display: grid;
    overflow: clip;
    border-radius: var(--purr-radius-control);
    background-color: var(--purr-color-fill-control);
    box-shadow: var(--purr-boundary);
  }

  .row,
  .cover {
    display: grid;
    grid-area: 1 / 1;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
  }

  .pill,
  .cover {
    pointer-events: none;
    background-color: var(--purr-color-selection);
  }

  .pill {
    position: absolute;
    inset-block: 2px;
    inset-inline: var(--_start) var(--_end);
    border-radius: var(--purr-radius-control-inner);
    box-shadow: var(--purr-elevation-control);
    transition: inset var(--purr-duration-slide) var(--purr-ease-spring);
  }

  .cover {
    position: relative;
    visibility: hidden;
    color: var(--purr-color-on-accent);
    font: var(--purr-font-body-emphasized);
    clip-path: inset(
      2px var(--_end) 2px var(--_start) round var(--purr-radius-control-inner)
    );
    transition: clip-path var(--purr-duration-slide) var(--purr-ease-spring);
  }

  :host(:dir(rtl)) .cover {
    clip-path: inset(
      2px var(--_start) 2px var(--_end) round var(--purr-radius-control-inner)
    );
  }

  .moving .cover {
    visibility: visible;
  }

  .cover span {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-inline-size: var(--purr-hit-min);
    min-block-size: var(--purr-hit-min);
    padding: var(--_pad);
    overflow-wrap: anywhere;
    text-align: center;
  }

  [part="track"]:not(.moving) ::slotted([selected]) {
    --purr-face-hover: var(--purr-color-selection-hover);
    --purr-face-pressed: var(--purr-color-selection-pressed);

    color: var(--purr-color-on-accent);
    font: var(--purr-font-body-emphasized);
    outline-color: var(--purr-color-on-accent);
  }

  :host([disabled]) .pill,
  :host([disabled]) .cover {
    background-color: var(--purr-color-fill-control-hover);
    box-shadow: none;
    color: var(--purr-color-disabled-label);
  }

  [part="track"]:not(.moving) ::slotted([selected][disabled]) {
    color: var(--purr-color-disabled-label);
  }

  /* System colors replace the pill: the selected segment paints Highlight. */
  @media (forced-colors: active) {
    /* The copy stays in flow to size the columns, but never slides. */
    .pill {
      display: none;
    }

    .cover {
      transition: none;
    }

    [part="track"]:not(.moving) ::slotted([selected]:not([disabled])) {
      --purr-face-hover: Highlight;
      --purr-face-pressed: Highlight;

      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      outline-color: HighlightText;
    }

    [part="track"]:not(.moving) ::slotted([selected][disabled]) {
      color: GrayText;
    }
  }
`;

export const segmentStyles = css`
  :host {
    padding: var(--_pad);
    border-radius: var(--purr-radius-control);
    color: var(--purr-color-label);
    cursor: default;
    overflow-wrap: anywhere;
    text-align: center;
    user-select: none;
  }

  :host::before {
    inset: 2px;
    border-radius: var(--purr-radius-control-inner);
  }

  /* The ring sits inside the face, which is inset 2px in the hit region. */
  :host(:focus-visible) {
    outline-offset: calc(var(--purr-focus-offset-inside) - 2px);
  }
`;
