import { css } from "lit";

/*
 * The host keeps `--_ratio` (set from the `ratio` attribute) with CSS
 * aspect-ratio. Slotted media fills the box and is cropped, not stretched.
 */
export const aspectRatioStyles = css`
  :host {
    --_ratio: 1;

    display: block;
    overflow: hidden;
    aspect-ratio: var(--_ratio);
  }

  :host([hidden]) {
    display: none;
  }

  ::slotted(*) {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
`;
